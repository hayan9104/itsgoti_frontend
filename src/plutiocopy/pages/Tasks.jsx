import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PlutioCopyLayout from '../components/PlutioCopyLayout';
import { usePlutioCopyAuth } from '../context/PlutioCopyAuthContext';
import { plutioBoardsAPI, plutioTasksAPI, plutioTaskGroupsAPI, plutioCommentsAPI } from '../../services/api';

/* ─── Helpers ─── */
const Icon = ({ d, size = 16, color = 'currentColor', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
    <path d={d} />
  </svg>
);

const ICONS = {
  allTasks:    'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z', // circle check
  myTasks:     'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  delegated:   'M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z', // share icon
  following:   'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z', // eye icon
  today:       'M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z',
  project:     'M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z',
  info:        'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',
  help:        'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-3h-2c0-3.25 3-3 3-5 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 2.5-3 2.75-3 5z',
  plus:        'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
  search:      'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
  kanban:      'M4 4h4v16H4zm6 0h4v10h-4zm6 0h4v6h-4z',
  editView:    'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
  filter:      'M4.25 5.61C6.27 8.2 10 13 10 13v6c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-6s3.72-4.8 5.74-7.39c.51-.66.04-1.61-.79-1.61H5.04c-.83 0-1.3.95-.79 1.61z',
  group:       'M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z',
  order:       'M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z',
  archived:    'M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z',
  import:      'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z',
  chevDown:    'M7 10l5 5 5-5z',
  table:       'M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 4h14v2H5V8zm0 4h14v2H5v-2zm0 4h14v2H5v-2z',
  close:       'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  arrowRight:  'M16.01 11H4v2h12.01v3L20 12l-3.99-4z',
  warning:     'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
  rename:      'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z',
  settings:    'M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58z',
  duplicate:   'M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z',
  copy:        'M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z',
  move:        'M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z',
  template:    'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h10V7H7v3zm0 4h10v-3H7v3zm0 3h10v-3H7v3z',
  export:      'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z',
  archive:     'M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5z',
  delete:      'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
  enter:       'M19 7v4H5.83l3.58-3.59L8 6l-6 6 6 6 1.41-1.41L5.83 13H21V7h-2z',
  userPlus:    'M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  toggleOn:    'M17 7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h10c2.76 0 5-2.24 5-5s-2.24-5-5-5zm0 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z',
  toggleOff:   'M17 7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h10c2.76 0 5-2.24 5-5s-2.24-5-5-5zm-10 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z',
  check:       'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
  calendar:    'M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z',
  clock:       'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z',
  user:        'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  chevronLeft: 'M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z',
  chevronRight:'M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z',
  wavy:        'M20 12c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm-16 0c0-1.1-.9-2-2-2S0 10.9 0 12s.9 2 2 2 2-.9 2-2zm8 0c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2z', // Simple placeholder for wavy icon
  circleDot:   'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zM12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z',
  assignee:    'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z', // Placeholder for the pointing hand/assignee icon
  squarePlus:  'M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z',
  dotsHorizontal: 'M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
  play:        'M8 5v14l11-7z',
  maximize:    'M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z',
  chat:        'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z',
  attachment:  'M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.66 1.34 3 3 3s3-1.34 3-3V5c0-2.48-2.02-4.5-4.5-4.5S7 2.52 7 5v12.5c0 3.59 2.91 6.5 6.5 6.5s6.5-2.91 6.5-6.5V6h-1.5z',
  link:        'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z',
  followers:   'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z', // Using user icon for followers
  creator:     'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z', // Using user icon for creator
  dots:        'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
  listView:    'M3 5h2v2H3V5zm4 0h14v2H7V5zm-4 6h2v2H3v-2zm4 0h14v2H7v-2zm-4 6h2v2H3v-2zm4 0h14v2H7v-2z',
  timeline:    'M23 8c0 1.1-.9 2-2 2-.18 0-.35-.02-.51-.07l-3.56 3.55c.05.16.07.34.07.52 0 1.1-.9 2-2 2s-2-.9-2-2c0-.18.02-.36.07-.52l-2.55-2.55c-.16.05-.34.07-.52.07s-.36-.02-.52-.07l-4.55 4.56c.05.16.07.33.07.51 0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2c.18 0 .35.02.51.07l4.56-4.55C8.02 9.36 8 9.18 8 9c0-1.1.9-2 2-2s2 .9 2 2c0 .18-.02.36-.07.52l2.55 2.55c.16-.05.34-.07.52-.07s.36.02.52.07l3.55-3.56C19.02 8.35 19 8.18 19 8c0-1.1.9-2 2-2s2 .9 2 2z',
  circleClose: 'M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z',
  uploadFile:  'M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z',
  exportIcon:  'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z',
  importIcon:  'M5 4h14a2 2 0 012 2v4H3V6a2 2 0 012-2zM3 12h18v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6zm7 2v2h4v-2h-4z',
  circleCheck: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
  lightbulb:   'M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z',
  grip:        'M9 11h2v2H9v-2zm4 0h2v2h-2v-2zm-4-4h2v2H9V7zm4 0h2v2h-2V7zm-4 8h2v2H9v-2zm4 0h2v2h-2v-2z',
  refresh:     'M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z',
};

const TASK_SET_COLORS = ['#6366f1', '#4b5563', '#22c55e', '#f97316', '#eab308', '#3b82f6', '#f1f1f1', '#e5e7eb'];
const ROLES = ['Client', 'Co-owner', 'Contributor'];

const formatDateOnly = (dateInput) => {
  if (!dateInput) return '';
  if (typeof dateInput === 'string' && ["1 hour", "2 hours", "3 hours", "5 hours", "Tomorrow", "Next working day"].includes(dateInput)) return dateInput;
  
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) {
      const parts = String(dateInput).split(' ');
      if (parts.length >= 3) {
        const day = parts[0];
        const monthStr = parts[1];
        const year = parts[2];
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthIdx = months.indexOf(monthStr);
        if (monthIdx !== -1) return `${day}/${monthIdx + 1}/${year.substring(2)}`; // dd/mm/yy
      }
      return String(dateInput);
    }
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear().toString().substring(2)}`; // dd/mm/yy
  } catch (e) {
    return String(dateInput);
  }
};

const formatFullDateTime = (dateInput) => {
  if (!dateInput) return '';
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return String(dateInput);
    
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear().toString().substring(2)} ${hours}:${minutes} ${ampm}`;
  } catch (e) {
    return String(dateInput);
  }
};

/* ─── Modal Component ─── */
const Modal = ({ title, onClose, children, footer, width = '540px' }) => (
  <div style={{
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 10000, padding: '10px',
  }}>
    <div style={{
      background: '#fff', borderRadius: '16px', width: '100%', maxWidth: width,
      maxHeight: 'calc(100vh - 20px)', display: 'flex', flexDirection: 'column',
      boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflow: 'hidden',
    }}>
      <div style={{
        padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0, borderBottom: '1px solid #f3f4f6'
      }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#111827' }}>{title}</h3>
        <button onClick={onClose} style={{ 
          background: 'none', border: '1px solid #f3f4f6', cursor: 'pointer', 
          padding: '6px', color: '#9ca3af', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s'
        }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}>
          <Icon d={ICONS.close} size={14} />
        </button>
      </div>
      <div style={{ 
        padding: '20px 24px', 
        overflowY: 'auto', 
        flex: 1,
      }} className="hide-scrollbar">
        {children}
      </div>
      {footer && (
        <div style={{ 
          padding: '16px 24px', 
          borderTop: '1px solid #f3f4f6', 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '12px',
          flexShrink: 0,
          background: '#fff'
        }}>
          {footer}
        </div>
      )}
    </div>
  </div>
);

/* ─── Tasks middle panel ─── */
const TasksMiddlePanel = ({ activeView, projects, taskSets, onNavigate, onCreateProject, onCreateTaskSet, currentBoardId }) => {
  const [hoverTaskSet, setHoverTaskSet] = useState(false);
  const [hoverProject, setHoverProject] = useState(false);

  const TASK_FILTERS = [
    { id: 'all',       label: 'All tasks',   icon: 'allTasks',  path: '/plutiocopy/tasks' },
    { id: 'my',        label: 'My tasks',    icon: 'myTasks',   path: '/plutiocopy/tasks/my' },
    { id: 'delegated', label: 'Delegated',   icon: 'delegated', path: '/plutiocopy/tasks/delegated' },
    { id: 'following', label: 'Following',   icon: 'following', path: '/plutiocopy/tasks/following' },
    { id: 'today',     label: 'Today',       icon: 'today',     path: '/plutiocopy/tasks/today' },
  ];

  return (
    <div style={{ padding: '14px 10px', height: '100%', boxSizing: 'border-box' }}>
      {/* Task sets header */}
      <div 
        onMouseEnter={() => setHoverTaskSet(true)}
        onMouseLeave={() => setHoverTaskSet(false)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 6px', marginBottom: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Task sets
          </span>
          <Icon d={ICONS.info} size={13} color="#c4b5fd" />
        </div>
        {hoverTaskSet && (
          <button 
            onClick={onCreateTaskSet}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex' }}
          >
            <Icon d={ICONS.plus} size={16} />
          </button>
        )}
      </div>

      {/* Task sets list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', marginBottom: '10px' }}>
        {taskSets.map(set => {
          const isActive = currentBoardId === set.id;
          return (
            <div
              key={set.id}
              onClick={() => onNavigate(`/plutiocopy/tasks/board/${set.id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '7px 8px', borderRadius: '8px',
                background: isActive ? '#eef0fd' : 'transparent',
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#f5f5fa'; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              {/* Plutio-style: small colored square with table-row lines inside */}
              <div style={{
                width: '16px', height: '16px', borderRadius: '3px',
                background: set.color || '#4f46e5', flexShrink: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '2px',
                padding: '3px',
              }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: '100%', height: '2px', background: 'rgba(255,255,255,0.85)', borderRadius: '1px' }} />
                ))}
              </div>
              <span style={{
                fontSize: '13px',
                fontWeight: isActive ? '600' : '400',
                color: isActive ? '#1f2937' : '#374151',
                flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {set.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: '#e8e8ef', margin: '8px 0' }} />

      {/* Filter items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {TASK_FILTERS.map((item) => {
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '7px 8px', borderRadius: '6px',
                border: 'none', cursor: 'pointer', width: '100%',
                textAlign: 'left',
                background: active ? '#ededf8' : 'transparent',
                color: active ? '#6d28d9' : '#4b5563',
                fontWeight: active ? '600' : '400',
                fontSize: '13px',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#f0f0f8'; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon d={ICONS[item.icon]} size={15} color={active ? '#6d28d9' : '#9ca3af'} />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: '#e8e8ef', margin: '10px 0' }} />

      {/* Project tasks */}
      <div 
        onMouseEnter={() => setHoverProject(true)}
        onMouseLeave={() => setHoverProject(false)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 6px', marginBottom: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Project tasks
          </span>
          <Icon d={ICONS.info} size={13} color="#c4b5fd" />
        </div>
        {hoverProject && (
          <button 
            onClick={onCreateProject}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex' }}
          >
            <Icon d={ICONS.plus} size={16} />
          </button>
        )}
      </div>

      {/* Dynamic Projects */}
      {projects.length === 0 ? (
        <div style={{ padding: '10px 6px', fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>
          No projects yet
        </div>
      ) : (
        projects.map((p) => {
          const isActive = currentBoardId === p.id;
          return (
          <div key={p.id}
            onClick={() => onNavigate(`/plutiocopy/tasks/board/${p.id}`)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 8px', borderRadius: '6px', cursor: 'pointer',
              background: isActive ? '#ede9fe' : 'transparent',
            }}
            onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#f0f0f8'; }}
            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon d={ICONS.project} size={14} color={isActive ? '#6d28d9' : '#6b7280'} />
              <span style={{ fontSize: '13px', color: isActive ? '#6d28d9' : '#374151', fontWeight: isActive ? '700' : '400' }}>{p.name}</span>
            </div>
            {!isActive && (
              <span style={{ fontSize: '10px', fontWeight: '600', color: '#fff', background: '#3b82f6', borderRadius: '4px', padding: '1px 6px' }}>
                New
              </span>
            )}
          </div>
          );
        })
      )}
    </div>
  );
};

/* ─── Toolbar ─── */
const Toolbar = ({ onCreateTask, hideCreate = false, activeViewFields = DEFAULT_VIEW_FIELDS, setActiveViewFields }) => {
  const [activeView, setActiveView] = useState('kanban');
  const [showKanbanMenu, setShowKanbanMenu] = useState(false);
  const [showOrderMenu, setShowOrderMenu] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showViewEditor, setShowViewEditor] = useState(false);
  const [showAddOption, setShowAddOption] = useState(false);
  const [archivedActive, setArchivedActive] = useState(false);
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [kanbanMenuPos, setKanbanMenuPos] = useState({ top: 0, left: 0 });
  const [orderMenuPos, setOrderMenuPos] = useState({ top: 0, left: 0 });
  const kanbanBtnRef = useRef(null);
  const orderBtnRef = useRef(null);

  const hiddenFields = ALL_VIEW_FIELDS.filter(f => !activeViewFields.includes(f.id));
  const activeFieldObjects = activeViewFields.map(id => ALL_VIEW_FIELDS.find(f => f.id === id)).filter(Boolean);

  const VIEW_OPTIONS = [
    { id: 'list',     label: 'List',     icon: 'listView' },
    { id: 'table',    label: 'Table',    icon: 'table' },
    { id: 'kanban',   label: 'Kanban',   icon: 'kanban' },
    { id: 'calendar', label: 'Calendar', icon: 'calendar' },
    { id: 'timeline', label: 'Timeline', icon: 'timeline' },
  ];
  const currentView = VIEW_OPTIONS.find(v => v.id === activeView) || VIEW_OPTIONS[2];

  const ORDER_OPTIONS = ['Completion date', 'Creation date', 'Due date', 'Name (alphabetically)'];
  const FILTER_FIELDS = ['Assignee', 'Creation date', 'Creator', 'Due date', 'Start date', 'Status', 'Subtask', 'Title'];

  const openKanbanMenu = () => {
    if (showKanbanMenu) { setShowKanbanMenu(false); return; }
    const rect = kanbanBtnRef.current.getBoundingClientRect();
    setKanbanMenuPos({ top: rect.bottom + 4, left: rect.left });
    setShowKanbanMenu(true);
  };
  const openOrderMenu = () => {
    if (showOrderMenu) { setShowOrderMenu(false); return; }
    const rect = orderBtnRef.current.getBoundingClientRect();
    setOrderMenuPos({ top: rect.bottom + 4, left: rect.left });
    setShowOrderMenu(true);
  };

  const tbBtn = (active = false) => ({
    display: 'flex', alignItems: 'center', gap: '5px',
    padding: '5px 10px', border: 'none', borderRadius: '6px',
    background: active ? '#eef0fd' : 'transparent', cursor: 'pointer',
    fontSize: '13px', color: active ? '#4f46e5' : '#374151', fontWeight: '500',
    whiteSpace: 'nowrap',
  });

  return (
    <>
      {/* ── Toolbar bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '2px',
        padding: '0 20px', borderBottom: '1px solid #ebebf0',
        background: '#fff', height: '48px', flexShrink: 0,
      }}>
        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '5px 12px', border: '1px solid #e2e2eb', borderRadius: '8px',
          background: '#fafafa', minWidth: '160px', marginRight: '6px',
        }}>
          <Icon d={ICONS.search} size={14} color="#9ca3af" />
          <input placeholder="Search" style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', color: '#1f2937', width: '100%' }} />
        </div>

        <div style={{ width: '1px', height: '22px', background: '#e5e7eb', margin: '0 2px' }} />

        {/* Kanban view switcher */}
        <button ref={kanbanBtnRef} onClick={openKanbanMenu} style={tbBtn(showKanbanMenu)}
          onMouseEnter={(e) => { if (!showKanbanMenu) e.currentTarget.style.background = '#f5f5fa'; }}
          onMouseLeave={(e) => { if (!showKanbanMenu) e.currentTarget.style.background = 'transparent'; }}
        >
          <Icon d={ICONS[currentView.icon]} size={14} color={showKanbanMenu ? '#4f46e5' : '#6b7280'} />
          <span>{currentView.label}</span>
          <Icon d={ICONS.chevDown} size={13} color="#9ca3af" />
        </button>

        <div style={{ width: '1px', height: '22px', background: '#e5e7eb', margin: '0 2px' }} />

        {/* Edit view */}
        <button onClick={() => { setShowViewEditor(true); setShowAddOption(false); }} style={tbBtn(showViewEditor)}
          onMouseEnter={(e) => { if (!showViewEditor) e.currentTarget.style.background = '#f5f5fa'; }}
          onMouseLeave={(e) => { if (!showViewEditor) e.currentTarget.style.background = 'transparent'; }}
        >
          <Icon d={ICONS.editView} size={14} color={showViewEditor ? '#4f46e5' : '#6b7280'} /> Edit view
        </button>

        {/* Filter */}
        <button onClick={() => { setShowFilterModal(true); setShowFilterDropdown(false); }} style={tbBtn(showFilterModal)}
          onMouseEnter={(e) => { if (!showFilterModal) e.currentTarget.style.background = '#f5f5fa'; }}
          onMouseLeave={(e) => { if (!showFilterModal) e.currentTarget.style.background = showFilterModal ? '#eef0fd' : 'transparent'; }}
        >
          <Icon d={ICONS.filter} size={14} color={showFilterModal ? '#4f46e5' : '#6b7280'} /> Filter
        </button>

        {/* Order */}
        <button ref={orderBtnRef} onClick={openOrderMenu} style={tbBtn(showOrderMenu)}
          onMouseEnter={(e) => { if (!showOrderMenu) e.currentTarget.style.background = '#f5f5fa'; }}
          onMouseLeave={(e) => { if (!showOrderMenu) e.currentTarget.style.background = 'transparent'; }}
        >
          <Icon d={ICONS.order} size={14} color={showOrderMenu ? '#4f46e5' : '#6b7280'} /> Order
          <Icon d={ICONS.chevDown} size={13} color="#9ca3af" />
        </button>

        {/* Archived */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setArchivedActive(v => !v)} style={tbBtn(archivedActive)}
            onMouseEnter={(e) => { if (!archivedActive) e.currentTarget.style.background = '#f5f5fa'; }}
            onMouseLeave={(e) => { if (!archivedActive) e.currentTarget.style.background = 'transparent'; }}
          >
            <Icon d={ICONS.archived} size={14} color={archivedActive ? '#4f46e5' : '#6b7280'} /> Archived
          </button>
        </div>

        {/* Import / Export */}
        <button onClick={() => setShowImportExportModal(true)} style={tbBtn(showImportExportModal)}
          onMouseEnter={(e) => { if (!showImportExportModal) e.currentTarget.style.background = '#f5f5fa'; }}
          onMouseLeave={(e) => { if (!showImportExportModal) e.currentTarget.style.background = 'transparent'; }}
        >
          <Icon d={ICONS.import} size={14} color={showImportExportModal ? '#4f46e5' : '#6b7280'} /> Import / Export
        </button>
      </div>

      {/* ── Kanban view dropdown ── */}
      {showKanbanMenu && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 2000 }} onMouseDown={() => setShowKanbanMenu(false)} />
          <div style={{
            position: 'fixed', top: kanbanMenuPos.top, left: kanbanMenuPos.left,
            background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb',
            boxShadow: '0 8px 24px rgba(0,0,0,0.10)', zIndex: 2001,
            minWidth: '180px', padding: '6px', overflow: 'hidden',
          }}>
            {VIEW_OPTIONS.map(v => (
              <button key={v.id} onMouseDown={() => { setActiveView(v.id); setShowKanbanMenu(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                  padding: '9px 12px', border: 'none', borderRadius: '8px',
                  background: v.id === activeView ? '#f5f3ff' : 'none', cursor: 'pointer',
                  fontSize: '14px', fontWeight: v.id === activeView ? '600' : '400',
                  color: v.id === activeView ? '#4f46e5' : '#374151', textAlign: 'left',
                }}
                onMouseEnter={(e) => { if (v.id !== activeView) e.currentTarget.style.background = '#f9fafb'; }}
                onMouseLeave={(e) => { if (v.id !== activeView) e.currentTarget.style.background = 'none'; }}
              >
                <Icon d={ICONS[v.icon]} size={16} color={v.id === activeView ? '#4f46e5' : '#6b7280'} />
                <span style={{ flex: 1 }}>{v.label}</span>
                {v.id === activeView && <Icon d={ICONS.check} size={16} color="#4f46e5" />}
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── Order dropdown ── */}
      {showOrderMenu && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 2000 }} onMouseDown={() => setShowOrderMenu(false)} />
          <div style={{
            position: 'fixed', top: orderMenuPos.top, left: orderMenuPos.left,
            background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb',
            boxShadow: '0 8px 24px rgba(0,0,0,0.10)', zIndex: 2001,
            minWidth: '210px', padding: '6px', overflow: 'hidden',
          }}>
            {ORDER_OPTIONS.map((opt, i) => (
              <button key={opt} onMouseDown={() => setShowOrderMenu(false)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '9px 12px', border: 'none', borderRadius: '8px',
                  background: 'none', cursor: 'pointer', fontSize: '14px', color: '#374151', textAlign: 'left',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <span>{opt}</span>
                {i === 0 && <Icon d={ICONS.squarePlus} size={15} color="#9ca3af" />}
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── Filter modal ── */}
      {showFilterModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5000 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) { setShowFilterModal(false); setShowFilterDropdown(false); } }}
        >
          <div style={{ background: '#fff', borderRadius: '16px', width: '520px', maxWidth: '90vw', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827' }}>Filter options</h3>
              <button onClick={() => { setShowFilterModal(false); setShowFilterDropdown(false); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', padding: '2px' }}>
                <Icon d={ICONS.circleClose} size={22} color="#9ca3af" />
              </button>
            </div>
            {/* Add filter option row */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowFilterDropdown(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                  padding: '12px 16px', border: '1.5px solid #e5e7eb', borderRadius: '10px',
                  background: '#fff', cursor: 'pointer', fontSize: '14px', color: '#6b7280',
                  textAlign: 'left', borderColor: showFilterDropdown ? '#6d28d9' : '#e5e7eb',
                }}>
                <Icon d={ICONS.squarePlus} size={18} color="#6b7280" />
                <span>Add filter option</span>
              </button>
              {showFilterDropdown && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                  background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.10)', zIndex: 10, overflow: 'hidden',
                }}>
                  {FILTER_FIELDS.map((field, i) => (
                    <button key={field} onMouseDown={() => setShowFilterDropdown(false)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        width: '100%', padding: '11px 16px', border: 'none',
                        borderBottom: i < FILTER_FIELDS.length - 1 ? '1px solid #f3f4f6' : 'none',
                        background: 'none', cursor: 'pointer', fontSize: '14px', color: '#374151', textAlign: 'left',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      {field}
                      {i === 0 && <Icon d={ICONS.squarePlus} size={15} color="#9ca3af" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Import / Export modal ── */}
      {showImportExportModal && !showImportModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5000 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) setShowImportExportModal(false); }}
        >
          <div style={{ background: '#fff', borderRadius: '16px', width: '480px', maxWidth: '90vw', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827' }}>Import / Export tasks</h3>
              <button onClick={() => setShowImportExportModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                <Icon d={ICONS.circleClose} size={22} color="#9ca3af" />
              </button>
            </div>
            {/* Import row */}
            <button onClick={() => setShowImportModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
                padding: '14px 16px', border: '1.5px solid #e5e7eb', borderRadius: '10px',
                background: '#fff', cursor: 'pointer', marginBottom: '8px',
                fontSize: '14px', color: '#374151', fontWeight: '500', textAlign: 'left',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
            >
              <Icon d={ICONS.import} size={18} color="#6b7280" />
              <span style={{ flex: 1 }}>Import</span>
              <Icon d={ICONS.chevronRight} size={18} color="#9ca3af" />
            </button>
            {/* Export row */}
            <button
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
                padding: '14px 16px', border: '1.5px solid #e5e7eb', borderRadius: '10px',
                background: '#fff', cursor: 'pointer',
                fontSize: '14px', color: '#374151', fontWeight: '500', textAlign: 'left',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
            >
              <Icon d={ICONS.export} size={18} color="#6b7280" />
              <span>Export</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Import tasks modal (3-step wizard) ── */}
      {showImportModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5000 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) { setShowImportModal(false); setShowImportExportModal(false); } }}
        >
          <div style={{ background: '#fff', borderRadius: '16px', width: '540px', maxWidth: '90vw', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button onClick={() => setShowImportModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                  <Icon d={ICONS.chevronLeft} size={22} color="#9ca3af" />
                </button>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827' }}>Import tasks</h3>
              </div>
              <button onClick={() => { setShowImportModal(false); setShowImportExportModal(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                <Icon d={ICONS.circleClose} size={22} color="#9ca3af" />
              </button>
            </div>

            {/* Step indicator */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '0' }}>
              {[{ n: 1, label: 'Upload file' }, { n: 2, label: 'Import options' }, { n: 3, label: 'Match dataset' }].map((step, i) => (
                <div key={step.n} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: step.n === 1 ? '#4f46e5' : '#e5e7eb',
                      color: step.n === 1 ? '#fff' : '#9ca3af', fontSize: '13px', fontWeight: '700',
                    }}>{step.n}</div>
                    <span style={{ fontSize: '11px', fontWeight: step.n === 1 ? '700' : '400', color: step.n === 1 ? '#111827' : '#9ca3af', whiteSpace: 'nowrap' }}>{step.label}</span>
                  </div>
                  {i < 2 && <div style={{ flex: 1, height: '2px', background: '#e5e7eb', margin: '0 4px', marginBottom: '18px' }} />}
                </div>
              ))}
            </div>

            {/* Info box */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px' }}>
              <Icon d={ICONS.lightbulb} size={18} color="#3b82f6" style={{ flexShrink: 0, marginTop: '1px' }} />
              <div style={{ fontSize: '13px', color: '#374151' }}>
                Ensure the imported file adheres to our CSV file format before uploading it.{' '}
                <span style={{ color: '#4f46e5', cursor: 'pointer', textDecoration: 'underline' }}>Learn more</span>
              </div>
            </div>

            {/* Drop zone */}
            <div style={{
              border: '2px dashed #d1d5db', borderRadius: '12px', padding: '40px 20px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '8px', marginBottom: '20px', cursor: 'pointer', background: '#fafafa',
            }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#6d28d9'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
            >
              <Icon d={ICONS.uploadFile} size={28} color="#9ca3af" />
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>Drop or click to browse</span>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>Size limit: 5 MB</span>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => { setShowImportModal(false); setShowImportExportModal(false); }}
                style={{ flex: 1, padding: '11px', border: '1.5px solid #e5e7eb', borderRadius: '10px', background: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#374151' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
              >Cancel</button>
              <button style={{ flex: 2, padding: '11px', border: 'none', borderRadius: '10px', background: '#22c55e', cursor: 'pointer', fontSize: '14px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                Next <Icon d={ICONS.arrowRight} size={16} color="#fff" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Editor modal ── */}
      {showViewEditor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5000 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) { setShowViewEditor(false); setShowAddOption(false); } }}
        >
          <div style={{ background: '#fff', borderRadius: '16px', width: '520px', maxWidth: '90vw', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827' }}>View editor</h3>
              <button onClick={() => { setShowViewEditor(false); setShowAddOption(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                <Icon d={ICONS.circleClose} size={22} color="#9ca3af" />
              </button>
            </div>

            {/* Info box */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px' }}>
              <Icon d={ICONS.lightbulb} size={16} color="#3b82f6" style={{ flexShrink: 0, marginTop: '1px' }} />
              <span style={{ fontSize: '13px', color: '#374151' }}>Add, remove, or reorder the options below to customize your view exactly how you need it.</span>
            </div>

            {/* Add an option */}
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <button onClick={() => setShowAddOption(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '11px 14px', border: `1.5px solid ${showAddOption ? '#6d28d9' : '#e5e7eb'}`, borderRadius: '10px', background: '#fff', cursor: 'pointer', fontSize: '14px', color: '#6b7280', textAlign: 'left' }}>
                <Icon d={ICONS.squarePlus} size={18} color={showAddOption ? '#6d28d9' : '#6b7280'} />
                <span>Add an option</span>
              </button>
              {showAddOption && hiddenFields.length > 0 && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', boxShadow: '0 8px 24px rgba(0,0,0,0.10)', zIndex: 10, overflow: 'hidden' }}>
                  {hiddenFields.map((field, i) => (
                    <button key={field.id}
                      onMouseDown={() => {
                        setActiveViewFields && setActiveViewFields(prev => [...prev, field.id]);
                        setShowAddOption(false);
                      }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '11px 16px', border: 'none', borderBottom: i < hiddenFields.length - 1 ? '1px solid #f3f4f6' : 'none', background: 'none', cursor: 'pointer', fontSize: '14px', color: '#374151', textAlign: 'left' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      {field.label}
                      {i === 0 && <Icon d={ICONS.squarePlus} size={15} color="#9ca3af" />}
                    </button>
                  ))}
                </div>
              )}
              {showAddOption && hiddenFields.length === 0 && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '14px 16px', zIndex: 10 }}>
                  <span style={{ fontSize: '13px', color: '#9ca3af' }}>All options are already visible</span>
                </div>
              )}
            </div>

            {/* Active fields list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '20px' }}>
              {activeFieldObjects.map((field) => (
                <div key={field.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: '10px', background: '#fff' }}>
                  {/* Drag handle */}
                  <Icon d={ICONS.grip} size={16} color="#c4b5fd" />
                  <span style={{ flex: 1, fontSize: '14px', color: '#374151', fontWeight: '500' }}>{field.label}</span>
                  {/* Remove button */}
                  <button
                    onClick={() => setActiveViewFields && setActiveViewFields(prev => prev.filter(id => id !== field.id))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <div style={{ width: '20px', height: '20px', border: '1.5px solid #6d28d9', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '10px', height: '2px', background: '#6d28d9', borderRadius: '1px' }} />
                    </div>
                  </button>
                </div>
              ))}
            </div>

            {/* Reset to system default */}
            <button
              onClick={() => { setActiveViewFields && setActiveViewFields(DEFAULT_VIEW_FIELDS); setShowAddOption(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#6d28d9', fontSize: '13px', fontWeight: '600', padding: '4px 0' }}
            >
              <Icon d={ICONS.refresh} size={16} color="#6d28d9" />
              Reset to system default
            </button>
          </div>
        </div>
      )}
    </>
  );
};

/* ─── Empty state ─── */
const EmptyState = ({ message, sub }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '100%', minHeight: '300px',
    background: '#f5f5f8', borderRadius: '12px', margin: '16px',
  }}>
    <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '700', color: '#1f2937' }}>
      {message}
    </h3>
    <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>{sub}</p>
  </div>
);

/* ─── Table view ─── */
const TasksTable = ({ columns, rows, onRowClick }) => (
  <div style={{ padding: '16px', overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
          <th style={{ width: '40px', padding: '10px 12px', textAlign: 'left' }}>
            <input type="checkbox" style={{ accentColor: '#6d28d9' }} />
          </th>
          {columns.map((col) => (
            <th key={col.key} style={{
              padding: '10px 14px', textAlign: 'left',
              fontSize: '12px', fontWeight: '600', color: '#6b7280',
              borderLeft: '1px solid #f0f0f5', background: '#fafafa',
            }}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={columns.length + 1} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
              No tasks added yet.
            </td>
          </tr>
        ) : (
          rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f0f0f5', cursor: onRowClick ? 'pointer' : 'default' }}
              onClick={() => onRowClick && onRowClick(row)}
              onMouseEnter={(e) => e.currentTarget.style.background = '#fafafa'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <td style={{ padding: '10px 12px' }}>
                <div style={{
                  width: '16px', height: '16px', borderRadius: '50%',
                  border: '1.5px solid #d1d5db', cursor: 'pointer',
                }} />
              </td>
              {columns.map((col) => (
                <td key={col.key} style={{
                  padding: '10px 14px', fontSize: '13px', color: '#374151',
                  borderLeft: '1px solid #f0f0f5',
                }}>
                  {col.key === 'project' && row[col.key] ? (
                    <span style={{
                      background: '#3b82f6', color: '#fff',
                      borderRadius: '4px', padding: '2px 8px',
                      fontSize: '11px', fontWeight: '500',
                    }}>
                      {row[col.key]}
                    </span>
                  ) : (
                    row[col.key] || ''
                  )}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

/* ─── Task Card Component ─── */
const TaskCard = ({ task, onClick, onDelete }) => {
  const [hoveredDate, setHoveredDate] = useState(null); // 'start' | 'due' | null
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const dotsRef = useRef(null);

  const MENU_ITEMS = [
    { label: 'Set cover',         icon: ICONS.duplicate,  action: null },
    { label: 'Copy',              icon: ICONS.copy,        action: null },
    { label: 'Move',              icon: ICONS.move,        action: null },
    { label: 'Copy link',         icon: ICONS.link,        action: null },
    { label: 'Pin to menu',       icon: ICONS.toggleOn,    action: null },
    { label: 'Open in new tab',   icon: ICONS.maximize,    action: null },
    { label: 'Save to templates', icon: ICONS.template,    action: null },
    { label: 'Archive task',      icon: ICONS.archive,     action: null },
    { label: 'Delete task',       icon: ICONS.delete,      action: 'delete', danger: true },
  ];

  const MENU_HEIGHT = 9 * 36 + 8; // approx height of all items

  const handleDotsClick = (e) => {
    e.stopPropagation();
    if (showMenu) { setShowMenu(false); return; }
    const rect = dotsRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow >= MENU_HEIGHT
      ? rect.bottom + 4
      : rect.top - MENU_HEIGHT - 4;
    setMenuPos({ top, left: rect.right - 190 });
    setShowMenu(true);
  };

  const handleMenuAction = async (e, item) => {
    e.stopPropagation();
    setShowMenu(false);
    if (item.action === 'delete' && onDelete) {
      onDelete(task.id || task._id);
    }
  };

  return (
    <div
      onClick={() => onClick && onClick(task)}
      style={{
        background: '#fff', borderRadius: '12px', border: '1.5px solid #e5e7eb',
        padding: '12px 14px', width: '260px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.2s', position: 'relative',
      }}
      onMouseEnter={(e) => { if (onClick) e.currentTarget.style.borderColor = '#d1d5db'; }}
      onMouseLeave={(e) => { if (onClick) e.currentTarget.style.borderColor = '#e5e7eb'; }}
    >
      {/* Dots context menu — rendered fixed so it never clips */}
      {showMenu && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 1000 }}
            onMouseDown={(e) => { e.stopPropagation(); setShowMenu(false); }}
          />
          <div style={{
            position: 'fixed', top: menuPos.top, left: menuPos.left,
            background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 1001,
            minWidth: '190px', padding: '4px 0', overflow: 'hidden',
          }}>
            {MENU_ITEMS.map((item, idx) => (
              <button
                key={idx}
                onMouseDown={(e) => handleMenuAction(e, item)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  width: '100%', padding: '8px 14px', border: 'none',
                  background: 'none', cursor: 'pointer',
                  textAlign: 'left', fontSize: '13px', fontWeight: '500',
                  color: item.danger ? '#ef4444' : '#374151',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = item.danger ? '#fef2f2' : '#f9fafb'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
              >
                <Icon d={item.icon} size={14} color={item.danger ? '#ef4444' : '#9ca3af'} />
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: '1.5px solid #d1d5db', cursor: 'pointer', flexShrink: 0 }} />
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            ref={dotsRef}
            onClick={handleDotsClick}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px', borderRadius: '4px' }}
          >
            <Icon d={ICONS.dots} size={14} color="#9ca3af" />
          </div>
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1.5px solid #e5e7eb', cursor: 'pointer', flexShrink: 0 }} />
        </div>
      </div>

      {/* Meta Row */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '5px' }}>
        {/* Assignees */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {task.assignees && task.assignees.length > 0 ? (
            task.assignees.map((asg, idx) => (
              <div 
                key={idx}
                title={asg.name || `${asg.firstName} ${asg.lastName}`}
                style={{ 
                  width: '20px', height: '20px', borderRadius: '50%', 
                  background: asg.avatarColor || '#f3f4f6', 
                  color: '#fff', fontSize: '9px', fontWeight: '700', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  flexShrink: 0, border: '1.5px solid #fff', marginLeft: idx === 0 ? 0 : '-6px',
                  zIndex: task.assignees.length - idx
                }}
              >
                {(asg.name || `${asg.firstName} ${asg.lastName}`).substring(0, 2).toUpperCase()}
              </div>
            ))
          ) : (
            <div title="Unassigned" style={{
              width: '20px', height: '20px', borderRadius: '50%', background: '#f3f4f6',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Icon d={ICONS.user} size={12} color="#9ca3af" />
            </div>
          )}
        </div>

        {/* Start Date */}
        {task.startDate && (
          <div 
            onMouseEnter={() => setHoveredDate('start')}
            onMouseLeave={() => setHoveredDate(null)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '4px', background: '#f5f3ff', 
              padding: '3px 8px', borderRadius: '12px', border: '1px solid #ddd6fe',
              position: 'relative'
            }}
          >
            <Icon d={ICONS.clock} size={11} color="#111827" />
            <span style={{ fontSize: '11px', color: '#111827', fontWeight: '600' }}>Starts {formatDateOnly(task.startDate)}</span>
            
            {hoveredDate === 'start' && (
              <div style={{
                position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                marginBottom: '8px', background: '#1f2937', color: '#fff', padding: '6px 10px',
                borderRadius: '6px', fontSize: '11px', whiteSpace: 'nowrap', zIndex: 100,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}>
                {formatFullDateTime(task.startDate)}
              </div>
            )}
          </div>
        )}

        {/* Due Date */}
        {task.dueDate && (
          <div 
            onMouseEnter={() => setHoveredDate('due')}
            onMouseLeave={() => setHoveredDate(null)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '4px', background: '#fff', 
              padding: '3px 8px', borderRadius: '12px', border: '1px solid #e5e7eb',
              position: 'relative'
            }}
          >
            <Icon d={ICONS.calendar} size={11} color="#111827" />
            <span style={{ fontSize: '11px', color: '#111827', fontWeight: '600' }}>Due {formatDateOnly(task.dueDate)}</span>
            
            {hoveredDate === 'due' && (
              <div style={{
                position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                marginBottom: '8px', background: '#1f2937', color: '#fff', padding: '6px 10px',
                borderRadius: '6px', fontSize: '11px', whiteSpace: 'nowrap', zIndex: 100,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}>
                {formatFullDateTime(task.dueDate)}
              </div>
            )}
          </div>
        )}

        {/* Repeat icon */}
        {task.repeat?.active && (
          <div title={`Repeats every ${task.repeat.interval} ${task.repeat.unit}${task.repeat.interval > 1 ? 's' : ''}`}
            style={{ display: 'flex', alignItems: 'center' }}>
            <Icon d={ICONS.refresh} size={12} color="#6d28d9" />
          </div>
        )}

        {/* Wavy Icon */}
        <Icon d={ICONS.wavy} size={12} color="#d1d5db" />

        {/* Task Number */}
        <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600' }}>#{task.number || '001'}</span>
      </div>
    </div>
  );
};


/* ─── Helper Functions ─── */
const parsePlutioDate = (dateStr) => {
  if (!dateStr) return null;
  if (["1 hour", "2 hours", "3 hours", "5 hours", "Tomorrow", "Next working day"].includes(dateStr)) return null;
  
  try {
    // Expected format: "16 April 2026 at 09:49 am"
    const parts = String(dateStr).split(' ');
    if (parts.length < 6) return new Date(dateStr); // Fallback to native parsing
    
    const day = parseInt(parts[0]);
    const monthStr = parts[1];
    const year = parseInt(parts[2]);
    const timeParts = parts[4].split(':');
    let hour = parseInt(timeParts[0]);
    const minute = parseInt(timeParts[1]);
    const period = parts[5].toLowerCase();

    if (period === 'pm' && hour < 12) hour += 12;
    if (period === 'am' && hour === 12) hour = 0;

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthIdx = months.indexOf(monthStr);

    const date = new Date(year, monthIdx, day, hour, minute);
    return isNaN(date.getTime()) ? null : date;
  } catch (e) {
    return null;
  }
};

/* ─── Date Picker Component ─── */
const DatePicker = ({ value, onChange, onClose, title = "Select Date", disabledDate }) => {
  const [currentDate, setCurrentDate] = useState(() => value ? new Date(value) : new Date());
  const [selectedDate, setSelectedDate] = useState(() => value ? new Date(value) : null);
  const [selectedHour, setSelectedHour] = useState('09');
  const [selectedMinute, setSelectedMinute] = useState('49');
  const [selectedPeriod, setSelectedPeriod] = useState('am');
  
  const hourRef = useRef(null);
  const minRef = useRef(null);
  const periodRef = useRef(null);

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
  const periods = ['am', 'pm'];
  
  const handleScroll = (ref, list, setter) => {
    if (!ref.current) return;
    const scrollTop = ref.current.scrollTop;
    const itemHeight = 36;
    const index = Math.round(scrollTop / itemHeight);
    if (list[index] && list[index] !== setter) {
      setter(list[index]);
    }
  };

  const handleWheel = (e, ref, list, selected, setter) => {
    const direction = e.deltaY > 0 ? 1 : -1;
    const currentIndex = list.indexOf(selected);
    const nextIndex = Math.max(0, Math.min(list.length - 1, currentIndex + direction));
    
    if (currentIndex !== nextIndex) {
      const nextValue = list[nextIndex];
      setter(nextValue);
      if (ref.current) {
        ref.current.scrollTop = nextIndex * 36;
      }
    }
  };

  useEffect(() => {
    // Set initial scroll positions
    if (hourRef.current) hourRef.current.scrollTop = (parseInt(selectedHour) - 1) * 36;
    if (minRef.current) minRef.current.scrollTop = parseInt(selectedMinute) * 36;
    if (periodRef.current) periodRef.current.scrollTop = selectedPeriod === 'am' ? 0 : 36;

    // Set calendar to the month of the current value if it exists
    if (value) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        setCurrentDate(parsed);
        let h = parsed.getHours();
        const p = h >= 12 ? 'pm' : 'am';
        h = h % 12 || 12;
        setSelectedHour(h.toString().padStart(2, '0'));
        setSelectedMinute(parsed.getMinutes().toString().padStart(2, '0'));
        setSelectedPeriod(p);
      }
    }
  }, []);

  const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();
  
  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  const handleToday = () => setCurrentDate(new Date());
  
  const days = [];
  const totalDays = daysInMonth(currentDate.getMonth(), currentDate.getFullYear());
  const startDay = firstDayOfMonth(currentDate.getMonth(), currentDate.getFullYear());
  
  // Previous month days for padding
  const prevMonthDays = daysInMonth(currentDate.getMonth() - 1, currentDate.getFullYear());
  for (let i = startDay - 1; i >= 0; i--) days.push({ day: prevMonthDays - i, current: false });
  for (let i = 1; i <= totalDays; i++) days.push({ day: i, current: true });
  // Next month days for padding
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) days.push({ day: i, current: false });

  return (
      <div style={{
        background: '#fff', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
        border: '1px solid #e5e7eb', width: '480px', padding: '16px',
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: '0 0 12px 0', borderBottom: '1px solid #f3f4f6', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: '800', color: '#111827' }}>{title}</span>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}><Icon d={ICONS.close} size={16} /></button>
        </div>

        {/* Presets Row */}
       <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #f3f4f6' }} className="hide-scrollbar">
         {["1 hour", "2 hours", "3 hours", "5 hours", "Tomorrow", "Next working day"].map(preset => (
           <button 
             key={preset}
             onClick={() => { onChange(preset); onClose(); }}
             style={{ 
               padding: '4px 8px', fontSize: '11px', border: '1px solid #e5e7eb', 
               borderRadius: '6px', background: '#fff', cursor: 'pointer', color: '#6b7280',
               whiteSpace: 'nowrap', flexShrink: 0,
               transition: 'all 0.2s'
             }}
             onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6d28d9'; e.currentTarget.style.color = '#6d28d9'; }}
             onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#6b7280'; }}
           >
             {preset}
           </button>
         ))}
       </div>

       <div style={{ display: 'flex' }}>
         {/* Calendar Section */}
         <div style={{ flex: 1, paddingRight: '16px', borderRight: '1px solid #f3f4f6' }}>
           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
             <span style={{ fontSize: '15px', fontWeight: '800', color: '#111827' }}>
               {months[currentDate.getMonth()]} {currentDate.getFullYear()}
             </span>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#111827' }} onClick={handleToday}>
                 <Icon d={ICONS.clock} size={14} color="#111827" />
                 <span style={{ fontSize: '13px', fontWeight: '700' }}>Today</span>
               </div>
               <div style={{ display: 'flex', gap: '8px' }}>
                 <button onClick={handlePrevMonth} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px', color: '#111827' }}><Icon d={ICONS.chevronLeft} size={18} /></button>
                 <button onClick={handleNextMonth} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px', color: '#111827' }}><Icon d={ICONS.chevronRight} size={18} /></button>
               </div>
             </div>
           </div>
           
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '8px' }}>
             {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => (
               <span key={d} style={{ fontSize: '12px', fontWeight: '700', color: '#6d28d9' }}>{d}</span>
             ))}
           </div>
           
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
             {days.map((item, i) => {
               const today = new Date();
               const isToday = item.current && 
                               item.day === today.getDate() && 
                               currentDate.getMonth() === today.getMonth() && 
                               currentDate.getFullYear() === today.getFullYear();
               
               const dateForThisItem = new Date(currentDate.getFullYear(), currentDate.getMonth(), item.day);
               const isSelected = item.current && selectedDate && selectedDate.toDateString() === dateForThisItem.toDateString();
               const isDisabled = item.current && disabledDate && disabledDate(dateForThisItem);
               
               return (
                 <div 
                   key={i}
                   onClick={() => {
                     if (item.current && !isDisabled) {
                       setSelectedDate(dateForThisItem);
                       setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), item.day));
                     }
                   }}
                   style={{
                     padding: '8px 0', fontSize: '13px', borderRadius: '50%', cursor: isDisabled ? 'not-allowed' : 'pointer',
                     opacity: isDisabled ? 0.3 : 1,
                     background: isSelected ? '#3b82f6' : 'none',
                     color: isSelected ? '#fff' : (item.current ? '#111827' : '#d1d5db'),
                     textAlign: 'center', fontWeight: '500', width: '32px', height: '32px',
                     display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 'auto',
                     border: isToday ? '1.5px solid #3b82f6' : 'none',
                   }}
                 >
                   {item.day}
                 </div>
               );
             })}
           </div>
         </div>

         {/* Time Selector */}
         <div style={{ width: '160px', position: 'relative', display: 'flex', paddingLeft: '16px' }}>
           {/* Horizontal Selection Bar */}
           <div style={{
             position: 'absolute', top: '50%', left: '8px', right: '8px',
             height: '36px', background: '#f5f3ff', borderRadius: '8px',
             transform: 'translateY(-50%)', zIndex: 0, border: '1px solid #ddd6fe'
           }} />
           
           <div style={{ display: 'flex', width: '100%', zIndex: 1, maxHeight: '280px' }}>
             {/* Hours Column */}
             <div 
               ref={hourRef}
               onScroll={() => handleScroll(hourRef, hours, setSelectedHour)}
               onWheel={(e) => handleWheel(e, hourRef, hours, selectedHour, setSelectedHour)}
               style={{ 
                 flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center',
                 scrollSnapType: 'y mandatory', scrollBehavior: 'smooth'
               }} className="hide-scrollbar">
               <div style={{ height: '122px', flexShrink: 0 }} />
               {hours.map(h => (
                 <button 
                   key={h} 
                   onClick={() => {
                     setSelectedHour(h);
                     hourRef.current.scrollTop = (parseInt(h) - 1) * 36;
                   }} 
                   style={{
                     padding: '10px 0', border: 'none', background: 'none', cursor: 'pointer',
                     fontSize: '14px', fontWeight: selectedHour === h ? '700' : '400',
                     color: selectedHour === h ? '#111827' : '#6b7280', minHeight: '36px',
                     scrollSnapAlign: 'center', width: '100%',
                     scrollSnapStop: 'always'
                   }}
                 >
                   {parseInt(h)}
                 </button>
               ))}
               <div style={{ height: '122px', flexShrink: 0 }} />
             </div>
             {/* Minutes Column */}
             <div 
               ref={minRef}
               onScroll={() => handleScroll(minRef, minutes, setSelectedMinute)}
               onWheel={(e) => handleWheel(e, minRef, minutes, selectedMinute, setSelectedMinute)}
               style={{ 
                 flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center',
                 scrollSnapType: 'y mandatory', scrollBehavior: 'smooth'
               }} className="hide-scrollbar">
               <div style={{ height: '122px', flexShrink: 0 }} />
               {minutes.map(m => (
                 <button 
                   key={m} 
                   onClick={() => {
                     setSelectedMinute(m);
                     minRef.current.scrollTop = parseInt(m) * 36;
                   }} 
                   style={{
                     padding: '10px 0', border: 'none', background: 'none', cursor: 'pointer',
                     fontSize: '14px', fontWeight: selectedMinute === m ? '700' : '400',
                     color: selectedMinute === m ? '#111827' : '#6b7280', minHeight: '36px',
                     scrollSnapAlign: 'center', width: '100%',
                     scrollSnapStop: 'always'
                   }}
                 >
                   {m}
                 </button>
               ))}
               <div style={{ height: '122px', flexShrink: 0 }} />
             </div>
             {/* Period Column */}
             <div 
               ref={periodRef}
               onScroll={() => handleScroll(periodRef, periods, setSelectedPeriod)}
               onWheel={(e) => handleWheel(e, periodRef, periods, selectedPeriod, setSelectedPeriod)}
               style={{ 
                 flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center',
                 scrollSnapType: 'y mandatory', scrollBehavior: 'smooth'
               }} className="hide-scrollbar">
               <div style={{ height: '122px', flexShrink: 0 }} />
               {periods.map(p => (
                 <button 
                   key={p} 
                   onClick={() => {
                     setSelectedPeriod(p);
                     periodRef.current.scrollTop = p === 'am' ? 0 : 36;
                   }} 
                   style={{
                     padding: '10px 0', border: 'none', background: 'none', cursor: 'pointer',
                     fontSize: '14px', fontWeight: selectedPeriod === p ? '700' : '400',
                     color: selectedPeriod === p ? '#111827' : '#6b7280', minHeight: '36px',
                     scrollSnapAlign: 'center', width: '100%', textTransform: 'lowercase',
                     scrollSnapStop: 'always'
                   }}
                 >
                   {p}
                 </button>
               ))}
               <div style={{ height: '122px', flexShrink: 0 }} />
             </div>
           </div>
         </div>
       </div>
       
       {/* Footer Buttons */}
       <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <button onClick={onClose} style={{ fontSize: '14px', color: '#6b7280', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '600', padding: '8px 16px' }}>Clear</button>
         <button 
           onClick={() => {
             const base = selectedDate || currentDate;
             const finalDate = new Date(base.getFullYear(), base.getMonth(), base.getDate());
             let h = parseInt(selectedHour);
             if (selectedPeriod === 'pm' && h < 12) h += 12;
             if (selectedPeriod === 'am' && h === 12) h = 0;
             finalDate.setHours(h);
             finalDate.setMinutes(parseInt(selectedMinute));
             
             onChange(finalDate.toISOString());
             onClose();
           }}
           style={{ fontSize: '14px', color: '#fff', background: '#55c141', border: 'none', borderRadius: '8px', padding: '10px 32px', fontWeight: '700', cursor: 'pointer', transition: 'background 0.2s' }}
           onMouseEnter={(e) => e.currentTarget.style.background = '#48a936'}
           onMouseLeave={(e) => e.currentTarget.style.background = '#55c141'}
         >
           Confirm
         </button>
       </div>
     </div>
  );
};
 
/* ─── Assignee Picker Component ─── */
const AssigneePicker = ({ members, selectedIds, onSelect, onClose }) => {
  return (
    <div style={{
      position: 'absolute', top: 'calc(100% - 2px)', left: 0,
      background: '#fff', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb', width: '220px', zIndex: 1000, padding: '8px',
    }}>
      <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' }}>Select Assignee</div>
      {members.length === 0 ? (
        <div style={{ padding: '12px', fontSize: '13px', color: '#6b7280', textAlign: 'center' }}>No members found</div>
      ) : (
        members.map(m => {
          const isSelected = selectedIds.includes(m.id || m._id);
          return (
            <button
              key={m.id || m._id}
              onClick={() => {
                onSelect(m);
              }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 12px', borderRadius: '8px', border: 'none',
                background: isSelected ? '#f5f3ff' : 'none', cursor: 'pointer', fontSize: '13px', color: '#374151',
                justifyContent: 'space-between'
              }}
              onMouseEnter={(e) => { if(!isSelected) e.currentTarget.style.background = '#f9fafb'; }}
              onMouseLeave={(e) => { if(!isSelected) e.currentTarget.style.background = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: m.avatarColor || '#6d28d9', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700' }}>
                  {(m.name || `${m.firstName} ${m.lastName}`).substring(0, 2).toUpperCase()}
                </div>
                {m.name || `${m.firstName} ${m.lastName}`}
              </div>
              {isSelected && <Icon d={ICONS.check} size={14} color="#6d28d9" />}
            </button>
          );
        })
      )}
    </div>
  );
};

/* ─── View Editor field definitions ─── */
const ALL_VIEW_FIELDS = [
  { id: 'project',       label: 'Project',        icon: 'project' },
  { id: 'assignee',      label: 'Assignee',        icon: 'user' },
  { id: 'startDate',     label: 'Start date',      icon: 'calendar' },
  { id: 'dueDate',       label: 'Due date',        icon: 'clock' },
  { id: 'repeats',       label: 'Repeats',         icon: 'archived' },
  { id: 'indicators',    label: 'Indicators',      icon: 'check' },
  { id: 'id',            label: 'ID',              icon: 'info' },
  { id: 'assignedBy',    label: 'Assigned by',     icon: 'user' },
  { id: 'dateCompleted', label: 'Date completed',  icon: 'check' },
  { id: 'location',      label: 'Location',        icon: 'info' },
  { id: 'subtasks',      label: 'Subtasks',        icon: 'info' },
];
const DEFAULT_VIEW_FIELDS = ['project', 'assignee', 'startDate', 'dueDate', 'repeats', 'indicators', 'id'];

/* ─── Task Drawer Component ─── */
const TaskDrawer = ({ task, onClose, onUpdateTask, onOpenDatePicker, members = [], activeViewFields = DEFAULT_VIEW_FIELDS, allTasks = [], taskSets = [], projects = [] }) => {
  const [hoveredRow, setHoveredRow] = useState(null);
  const [activePicker, setActivePicker] = useState(null);
  const [showAssigneePicker, setShowAssigneePicker] = useState(false);
  const [localAssignees, setLocalAssignees] = useState(task?.assignees || []);
  const [showDependenciesPicker, setShowDependenciesPicker] = useState(false);
  const [selectedDependencies, setSelectedDependencies] = useState([]);
  const [localFollowers, setLocalFollowers] = useState([]);
  const [showFollowersPicker, setShowFollowersPicker] = useState(false);
  const [showRepeatPanel, setShowRepeatPanel] = useState(false);
  const [repeatInterval, setRepeatInterval] = useState(task?.repeat?.interval || 1);
  const [repeatUnit, setRepeatUnit] = useState(task?.repeat?.unit || 'day');
  const [showRepeatUnitDropdown, setShowRepeatUnitDropdown] = useState(false);
  const [repeatActive, setRepeatActive] = useState(task?.repeat?.active || false);

  // ── Comment section state ──
  const [drawerTab, setDrawerTab] = useState('details');
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentFiles, setCommentFiles] = useState([]); // File[] from file input
  const [pendingGif, setPendingGif] = useState(null); // { url, title }
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showSnippetTooltip, setShowSnippetTooltip] = useState(false);
  const [showCreateSnippet, setShowCreateSnippet] = useState(false);
  const [gifSearch, setGifSearch] = useState('');
  const [gifTab, setGifTab] = useState('gifs'); // 'gifs' | 'stickers' | 'favorites'
  const [gifCategory, setGifCategory] = useState(''); // '' = trending / category name
  const [gifs, setGifs] = useState([]);
  const [snippetName, setSnippetName] = useState('');
  const [snippetCategory, setSnippetCategory] = useState('');
  const [snippetContent, setSnippetContent] = useState('');
  const fileInputRef = useRef(null);
  const snippetBtnRef = useRef(null);
  const gifBtnRef = useRef(null);

  // Fetch comments when switching to comments tab or task changes
  useEffect(() => {
    if (drawerTab !== 'comments') return;
    const taskId = task._id || task.id;
    if (!taskId) return;
    plutioCommentsAPI.getByTask(taskId)
      .then(res => setComments(res.data.data || []))
      .catch(() => {});
  }, [drawerTab, task]);

  // Fetch GIFs when GIF picker opens or search/category changes
  useEffect(() => {
    if (!showGifPicker) return;
    const query = gifSearch.trim() || gifCategory;
    const GIPHY_KEY = 'dc6zaTOxFJmzC';
    const url = query
      ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(query)}&limit=18&rating=g`
      : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=18&rating=g`;
    fetch(url).then(r => r.json()).then(d => setGifs(d.data || [])).catch(() => {});
  }, [showGifPicker, gifSearch, gifCategory, gifTab]);

  const handlePostComment = async () => {
    if (!commentText.trim() && !pendingGif && commentFiles.length === 0) return;
    setIsPostingComment(true);
    try {
      const fd = new FormData();
      fd.append('content', commentText);
      if (pendingGif) fd.append('gif', JSON.stringify(pendingGif));
      commentFiles.forEach(f => fd.append('files', f));
      const res = await plutioCommentsAPI.create(task._id || task.id, fd);
      setComments(prev => [...prev, res.data.data]);
      setCommentText('');
      setPendingGif(null);
      setCommentFiles([]);
    } catch (err) { console.error(err); }
    setIsPostingComment(false);
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await plutioCommentsAPI.delete(commentId);
      setComments(prev => prev.filter(c => c._id !== commentId));
    } catch (err) { console.error(err); }
  };

  const toggleDependency = (depTask) => {
    const id = depTask.id || depTask._id;
    setSelectedDependencies(prev =>
      prev.find(d => (d.id || d._id) === id)
        ? prev.filter(d => (d.id || d._id) !== id)
        : [...prev, depTask]
    );
  };

  if (!task) return null;

  return (
    <>

        {/* Drawer Header */}
        <div style={{
          padding: '24px 24px 12px', display: 'flex', alignItems: 'flex-start', 
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1 }}>
            <div style={{ 
              width: '22px', height: '22px', borderRadius: '6px', 
              border: '2px solid #d1d5db', cursor: 'pointer', marginTop: '4px',
              flexShrink: 0
            }} />
            <h3 style={{ 
              margin: 0, fontSize: '20px', fontWeight: '800', 
              color: '#111827', flex: 1, lineHeight: '1.3'
            }}>
              {task.title}
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
            <button style={{ 
              background: 'none', border: '1px solid #f3f4f6', cursor: 'pointer', 
              padding: '6px', color: '#9ca3af', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Icon d={ICONS.maximize} size={16} />
            </button>
            <button onClick={onClose} style={{ 
              background: 'none', border: '1px solid #f3f4f6', cursor: 'pointer', 
              padding: '6px', color: '#9ca3af', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Icon d={ICONS.close} size={16} />
            </button>
          </div>
        </div>

        {/* Drawer Sub-header */}
        <div style={{ padding: '0 24px 20px 62px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Icon d={ICONS.dotsHorizontal} size={18} color="#9ca3af" style={{ cursor: 'pointer' }} />
          <Icon d={ICONS.play} size={16} color="#9ca3af" style={{ cursor: 'pointer' }} />
          {activeViewFields.includes('id') && (
            <span style={{ fontSize: '13px', color: '#9ca3af', fontWeight: '700' }}>#{task.number || '001'}</span>
          )}
        </div>

        {/* Tab Icons Row */}
        <div style={{ padding: '0 24px 20px', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid #f9fafb' }}>
          {[
            { icon: 'editView', tab: 'details',     title: 'Details' },
            { icon: 'chat',     tab: 'comments',    title: 'Comments' },
            { icon: 'check',    tab: 'checklist',   title: 'Checklist' },
            { icon: 'attachment', tab: 'files',     title: 'Files' },
            { icon: 'clock',    tab: 'time',        title: 'Time' },
            { icon: 'link',     tab: 'links',       title: 'Links' },
          ].map((item) => {
            const isActive = drawerTab === item.tab;
            return (
              <button key={item.tab} title={item.title} onClick={() => setDrawerTab(item.tab)} style={{
                background: isActive ? '#f5f3ff' : 'none',
                border: isActive ? '1px solid #ddd6fe' : '1px solid transparent',
                borderRadius: '10px', padding: '10px',
                cursor: 'pointer', color: isActive ? '#6d28d9' : '#9ca3af',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s'
              }}>
                <Icon d={ICONS[item.icon]} size={18} />
              </button>
            );
          })}
        </div>

        {/* Comments Tab */}
        {drawerTab === 'comments' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* Comment list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }} className="hide-scrollbar">
              {comments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af', fontSize: '14px' }}>
                  No comments yet. Be the first to comment!
                </div>
              ) : (
                comments.map(c => (
                  <div key={c._id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: c.author?.avatarColor || '#6d28d9', color: '#fff', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {(c.author?.name || 'U').substring(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>{c.author?.name || 'User'}</span>
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                          {new Date(c.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <button onClick={() => handleDeleteComment(c._id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', padding: '2px' }}>
                          <Icon d={ICONS.close} size={12} />
                        </button>
                      </div>
                      {c.content && <p style={{ margin: 0, fontSize: '14px', color: '#374151', lineHeight: '1.5', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{c.content}</p>}
                      {c.gif?.url && (
                        <img src={c.gif.url} alt={c.gif.title || 'gif'} style={{ maxWidth: '220px', borderRadius: '8px', marginTop: '6px' }} />
                      )}
                      {(c.attachments || []).map((att, i) => (
                        <a key={i} href={att.url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', color: '#374151', textDecoration: 'none', maxWidth: '220px' }}>
                          <Icon d={ICONS.attachment} size={14} color="#6d28d9" />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment Input */}
            <div style={{ borderTop: '1px solid #f3f4f6', padding: '12px 16px', background: '#fff' }}>
              {/* Pending GIF preview */}
              {pendingGif && (
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: '8px' }}>
                  <img src={pendingGif.url} alt="gif" style={{ maxHeight: '100px', borderRadius: '8px' }} />
                  <button onClick={() => setPendingGif(null)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon d={ICONS.close} size={10} color="#fff" />
                  </button>
                </div>
              )}
              {/* Pending file previews */}
              {commentFiles.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                  {commentFiles.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f3f4f6', borderRadius: '6px', padding: '4px 8px', fontSize: '12px' }}>
                      <Icon d={ICONS.attachment} size={12} color="#6d28d9" />
                      <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                      <button onClick={() => setCommentFiles(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '0 2px' }}>
                        <Icon d={ICONS.close} size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handlePostComment(); }}
                placeholder="Type a comment..."
                rows={3}
                style={{ width: '100%', border: 'none', outline: 'none', resize: 'none', fontSize: '14px', color: '#374151', fontFamily: 'inherit', boxSizing: 'border-box', background: 'transparent' }}
              />
              {/* Bottom toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', position: 'relative' }}>
                  {/* Attach file */}
                  <button onClick={() => setShowAttachModal(true)} title="Attach file" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', color: '#9ca3af', display: 'flex', alignItems: 'center' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <Icon d={ICONS.attachment} size={17} />
                  </button>
                  {/* Snippet */}
                  <div style={{ position: 'relative' }}>
                    <button ref={snippetBtnRef} onClick={() => setShowSnippetTooltip(v => !v)} title="Snippets" style={{ background: showSnippetTooltip ? '#f3f4f6' : 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', color: '#9ca3af', display: 'flex', alignItems: 'center' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'} onMouseLeave={e => { if (!showSnippetTooltip) e.currentTarget.style.background = 'none'; }}>
                      <Icon d={ICONS.template} size={17} />
                    </button>
                    {showSnippetTooltip && (
                      <>
                        <div onClick={() => setShowSnippetTooltip(false)} style={{ position: 'fixed', inset: 0, zIndex: 9998 }} />
                        <div style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '16px', width: '240px', zIndex: 9999 }}>
                          <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#374151', lineHeight: '1.5' }}>
                            Snippets are pre-saved content (text, images, and more) that you can instantly insert into conversations, comments, invoices, proposals, and contracts.
                          </p>
                          <button onClick={() => { setShowSnippetTooltip(false); setShowCreateSnippet(true); }} style={{ width: '100%', padding: '10px', background: '#111827', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            Create snippet <Icon d={ICONS.arrowRight} size={14} color="#fff" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  {/* GIF */}
                  <div style={{ position: 'relative' }}>
                    <button ref={gifBtnRef} onClick={() => { setShowGifPicker(v => !v); setGifSearch(''); setGifCategory(''); }} title="GIF" style={{ background: showGifPicker ? '#f3f4f6' : 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', color: '#9ca3af', display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: '800' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'} onMouseLeave={e => { if (!showGifPicker) e.currentTarget.style.background = 'none'; }}>
                      GIF
                    </button>
                    {showGifPicker && (
                      <>
                        <div onClick={() => setShowGifPicker(false)} style={{ position: 'fixed', inset: 0, zIndex: 9998 }} />
                        <div style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', padding: '14px', width: '340px', zIndex: 9999 }}>
                          {/* Tabs */}
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                            {[{ key: 'gifs', label: 'GIFs' }, { key: 'stickers', label: 'Stickers' }, { key: 'favorites', label: '⭐ Favorites' }].map(t => (
                              <button key={t.key} onClick={() => setGifTab(t.key)} style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: gifTab === t.key ? '#6d28d9' : '#f3f4f6', color: gifTab === t.key ? '#fff' : '#374151', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>{t.label}</button>
                            ))}
                          </div>
                          {/* Category chips */}
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                            {['Reactions', 'Memes', 'Animals', 'Sports', 'TV & Movies'].map(cat => (
                              <button key={cat} onClick={() => { setGifCategory(gifCategory === cat ? '' : cat); setGifSearch(''); }} style={{ padding: '4px 10px', borderRadius: '20px', border: `1px solid ${gifCategory === cat ? '#6d28d9' : '#e5e7eb'}`, background: gifCategory === cat ? '#f5f3ff' : '#fff', color: gifCategory === cat ? '#6d28d9' : '#374151', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>{cat}</button>
                            ))}
                          </div>
                          {/* Search */}
                          <input value={gifSearch} onChange={e => { setGifSearch(e.target.value); setGifCategory(''); }} placeholder="Search gifs..." style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', marginBottom: '10px' }} />
                          {/* GIF grid */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', maxHeight: '200px', overflowY: 'auto' }} className="hide-scrollbar">
                            {gifs.length === 0 ? (
                              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: '13px' }}>Loading GIFs...</div>
                            ) : gifs.map(g => (
                              <img key={g.id} src={g.images?.fixed_height_small?.url || g.images?.fixed_height?.url} alt={g.title}
                                onClick={() => { setPendingGif({ url: g.images?.original?.url, title: g.title }); setShowGifPicker(false); }}
                                style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer', border: '2px solid transparent' }}
                                onMouseEnter={e => e.currentTarget.style.border = '2px solid #6d28d9'}
                                onMouseLeave={e => e.currentTarget.style.border = '2px solid transparent'}
                              />
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  {/* Hidden file input */}
                  <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={e => { setCommentFiles(prev => [...prev, ...Array.from(e.target.files)]); e.target.value = ''; }} />
                </div>
                <button
                  onClick={handlePostComment}
                  disabled={isPostingComment || (!commentText.trim() && !pendingGif && commentFiles.length === 0)}
                  style={{ padding: '8px 16px', background: '#6d28d9', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: (isPostingComment || (!commentText.trim() && !pendingGif && commentFiles.length === 0)) ? 0.5 : 1 }}
                >
                  {isPostingComment ? 'Posting...' : 'Post comment'}
                  {!isPostingComment && <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', padding: '2px 5px' }}>⌘↵</span>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Details Tab (existing content) */}
        {drawerTab === 'details' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }} className="hide-scrollbar">
          {/* Description/Notes */}
          <div style={{ 
            fontSize: '15px', color: '#374151', marginBottom: '32px', 
            lineHeight: '1.6', fontWeight: '500' 
          }}>
            {task.description || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Add a description...</span>}
          </div>

          {/* Info Rows — controlled by activeViewFields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>

            {/* Start date */}
            {activeViewFields.includes('startDate') && (() => {
              const item = { id: 'startDate', label: 'Start date', icon: 'calendar', value: task.startDate ? formatFullDateTime(task.startDate) : 'Select date', hasAction: true };
              return (
                <div key="startDate" onMouseEnter={() => setHoveredRow('startDate')} onMouseLeave={() => setHoveredRow(null)}
                  onClick={(e) => { onOpenDatePicker('startDate', e.currentTarget.getBoundingClientRect()); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', padding: '8px 12px', borderRadius: '12px', border: hoveredRow === 'startDate' ? '1px solid #ddd6fe' : '1px solid transparent', background: hoveredRow === 'startDate' ? '#f5f3ff' : 'transparent', transition: 'all 0.2s', position: 'relative', marginLeft: '-12px', marginRight: '-12px' }}>
                  <Icon d={ICONS.calendar} size={18} color="#9ca3af" />
                  <span style={{ fontSize: '14px', color: '#6b7280', width: '110px' }}>Start date</span>
                  <span style={{ fontSize: '14px', color: '#111827', fontWeight: '600', flex: 1 }}>{item.value}</span>
                  <Icon d={ICONS.plus} size={14} color="#9ca3af" />
                </div>
              );
            })()}

            {/* Due date */}
            {activeViewFields.includes('dueDate') && (() => {
              const item = { value: task.dueDate ? formatFullDateTime(task.dueDate) : 'Select date' };
              return (
                <div key="dueDate" onMouseEnter={() => setHoveredRow('dueDate')} onMouseLeave={() => setHoveredRow(null)}
                  onClick={(e) => { onOpenDatePicker('dueDate', e.currentTarget.getBoundingClientRect()); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', padding: '8px 12px', borderRadius: '12px', border: hoveredRow === 'dueDate' ? '1px solid #ddd6fe' : '1px solid transparent', background: hoveredRow === 'dueDate' ? '#f5f3ff' : 'transparent', transition: 'all 0.2s', marginLeft: '-12px', marginRight: '-12px' }}>
                  <Icon d={ICONS.clock} size={18} color="#9ca3af" />
                  <span style={{ fontSize: '14px', color: '#6b7280', width: '110px' }}>Due date</span>
                  <span style={{ fontSize: '14px', color: '#111827', fontWeight: '600', flex: 1 }}>{item.value}</span>
                  <Icon d={ICONS.plus} size={14} color="#9ca3af" />
                </div>
              );
            })()}

            {/* Repeats */}
            {activeViewFields.includes('repeats') && (
              <div style={{ marginLeft: '-12px', marginRight: '-12px' }}>
                {/* Header row */}
                <div
                  onClick={() => setShowRepeatPanel(v => !v)}
                  onMouseEnter={() => setHoveredRow('repeats')}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', padding: '8px 12px', borderRadius: '12px', border: (hoveredRow === 'repeats' || showRepeatPanel) ? '1px solid #ddd6fe' : '1px solid transparent', background: (hoveredRow === 'repeats' || showRepeatPanel) ? '#f5f3ff' : 'transparent', transition: 'all 0.2s' }}>
                  <Icon d={ICONS.refresh} size={18} color={repeatActive ? '#6d28d9' : '#9ca3af'} />
                  <span style={{ fontSize: '14px', color: '#6b7280', width: '110px' }}>Repeats</span>
                  <span style={{ fontSize: '14px', color: repeatActive ? '#6d28d9' : '#9ca3af', flex: 1, fontWeight: repeatActive ? '600' : '400' }}>
                    {repeatActive ? `Every ${repeatInterval} ${repeatUnit}${repeatInterval > 1 ? 's' : ''}` : 'Never'}
                  </span>
                  {repeatActive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRepeatActive(false);
                        onUpdateTask(task._id || task.id, { repeat: { active: false, interval: repeatInterval, unit: repeatUnit, nextRun: null } });
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#9ca3af', display: 'flex', alignItems: 'center' }}
                    >
                      <Icon d={ICONS.circleClose} size={14} />
                    </button>
                  )}
                </div>

                {/* Expandable panel */}
                {showRepeatPanel && (
                  <div style={{ margin: '6px 12px 8px', border: '1.5px dashed #d1d5db', borderRadius: '12px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Every [number] [unit] */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>Every</span>
                      <input
                        type="number"
                        min="1"
                        max="999"
                        value={repeatInterval}
                        onChange={e => setRepeatInterval(Math.max(1, parseInt(e.target.value) || 1))}
                        style={{ width: '56px', padding: '6px 8px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: '#111827', textAlign: 'center', outline: 'none' }}
                        onFocus={e => e.target.style.borderColor = '#6d28d9'}
                        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                      />
                      {/* Unit dropdown */}
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={() => setShowRepeatUnitDropdown(v => !v)}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', border: '1.5px solid #e5e7eb', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#111827' }}
                        >
                          {repeatUnit.charAt(0).toUpperCase() + repeatUnit.slice(1)}
                          <Icon d={ICONS.chevDown} size={14} color="#6b7280" />
                        </button>
                        {showRepeatUnitDropdown && (
                          <>
                            <div onClick={() => setShowRepeatUnitDropdown(false)} style={{ position: 'fixed', inset: 0, zIndex: 9998 }} />
                            <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 9999, minWidth: '100px', overflow: 'hidden' }}>
                              {['day', 'week', 'month', 'year'].map(u => (
                                <div
                                  key={u}
                                  onClick={() => { setRepeatUnit(u); setShowRepeatUnitDropdown(false); }}
                                  style={{ padding: '9px 14px', fontSize: '14px', cursor: 'pointer', fontWeight: repeatUnit === u ? '700' : '400', color: repeatUnit === u ? '#6d28d9' : '#374151', background: repeatUnit === u ? '#f5f3ff' : 'transparent' }}
                                  onMouseEnter={e => e.currentTarget.style.background = repeatUnit === u ? '#f5f3ff' : '#f9fafb'}
                                  onMouseLeave={e => e.currentTarget.style.background = repeatUnit === u ? '#f5f3ff' : 'transparent'}
                                >
                                  {u.charAt(0).toUpperCase() + u.slice(1)}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Save button */}
                    <button
                      onClick={() => {
                        const nextRun = (() => {
                          const d = new Date();
                          switch (repeatUnit) {
                            case 'day':   d.setDate(d.getDate() + repeatInterval); break;
                            case 'week':  d.setDate(d.getDate() + repeatInterval * 7); break;
                            case 'month': d.setMonth(d.getMonth() + repeatInterval); break;
                            case 'year':  d.setFullYear(d.getFullYear() + repeatInterval); break;
                          }
                          return d.toISOString();
                        })();
                        setRepeatActive(true);
                        onUpdateTask(task._id || task.id, { repeat: { active: true, interval: repeatInterval, unit: repeatUnit, nextRun } });
                        setShowRepeatPanel(false);
                      }}
                      style={{ alignSelf: 'flex-start', padding: '8px 20px', background: '#6d28d9', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Dependencies — always shown, expands inline */}
            <div style={{ marginLeft: '-12px', marginRight: '-12px' }}>
              {/* Header row */}
              <div
                onClick={() => setShowDependenciesPicker(v => !v)}
                onMouseEnter={() => setHoveredRow('dependencies')}
                onMouseLeave={() => setHoveredRow(null)}
                style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', padding: '8px 12px', borderRadius: '12px', border: (hoveredRow === 'dependencies' || showDependenciesPicker) ? '1px solid #ddd6fe' : '1px solid transparent', background: (hoveredRow === 'dependencies' || showDependenciesPicker) ? '#f5f3ff' : 'transparent', transition: 'all 0.2s' }}>
                <Icon d={ICONS.circleCheck} size={18} color={showDependenciesPicker ? '#6d28d9' : '#9ca3af'} />
                <span style={{ fontSize: '14px', color: '#6b7280', width: '110px' }}>Dependencies</span>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: selectedDependencies.length > 0 ? '#111827' : '#9ca3af', fontWeight: selectedDependencies.length > 0 ? '600' : '400' }}>
                    {selectedDependencies.length > 0 ? `${selectedDependencies.length} task${selectedDependencies.length > 1 ? 's' : ''}` : 'None'}
                  </span>
                  <Icon d={ICONS.info} size={14} color="#3b82f6" />
                </div>
              </div>

              {/* Expandable picker panel */}
              {showDependenciesPicker && (() => {
                const currentId = String(task.id || task._id);
                // All personal tasks (from any task set), excluding current task
                const personalTasks = allTasks.filter(t => String(t.id || t._id) !== currentId);
                // Group by project (project tasks — tasks where projectId matches)
                // Since our tasks don't have projectId yet, project sections show project name only
                return (
                  <div style={{ margin: '6px 12px 8px', border: '1.5px dashed #d1d5db', borderRadius: '12px', overflow: 'hidden' }}>
                    {/* Personal tasks section */}
                    <div style={{ padding: '12px 14px 4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#111827', display: 'block', marginBottom: '8px' }}>Personal tasks</span>
                      {personalTasks.length === 0 ? (
                        <span style={{ fontSize: '13px', color: '#9ca3af' }}>No other tasks</span>
                      ) : (
                        <div style={{ maxHeight: '148px', overflowY: 'auto' }} className="hide-scrollbar">
                        {personalTasks.map(t => {
                          const tId = t.id || t._id;
                          const isSelected = selectedDependencies.some(d => (d.id || d._id) === tId);
                          const boardName = taskSets.find(s => s.id === t.taskSetId)?.name || '';
                          return (
                            <div key={tId}
                              onClick={() => toggleDependency(t)}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                                <div style={{ width: '14px', height: '14px', borderRadius: '3px', border: '1.5px solid #d1d5db', flexShrink: 0, background: isSelected ? '#6d28d9' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {isSelected && <Icon d={ICONS.check} size={10} color="#fff" />}
                                </div>
                                <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {t.title} <span style={{ color: '#9ca3af', fontWeight: '400' }}>({String(t.number || '001').padStart(3, '0')})</span>
                                </span>
                                {boardName && <span style={{ fontSize: '10px', color: '#9ca3af', flexShrink: 0 }}>· {boardName}</span>}
                              </div>
                              {!isSelected && (
                                <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: '1.5px solid #6d28d9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <Icon d={ICONS.plus} size={11} color="#6d28d9" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                        </div>
                      )}
                    </div>

                    {/* Project sections */}
                    {projects.length > 0 && projects.map(project => {
                      const projTasks = allTasks.filter(t => String(t.id || t._id) !== currentId && t.projectId === (project.id || project._id));
                      return (
                        <div key={project.id || project._id} style={{ padding: '10px 14px 4px', borderTop: '1px solid #f3f4f6' }}>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: '#111827', display: 'block', marginBottom: '8px' }}>{project.name}</span>
                          {projTasks.length === 0 ? (
                            <span style={{ fontSize: '13px', color: '#9ca3af' }}>No tasks</span>
                          ) : (
                            <div style={{ maxHeight: '148px', overflowY: 'auto' }} className="hide-scrollbar">
                            {projTasks.map(t => {
                              const tId = t.id || t._id;
                              const isSelected = selectedDependencies.some(d => (d.id || d._id) === tId);
                              return (
                                <div key={tId} onClick={() => toggleDependency(t)}
                                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '14px', height: '14px', borderRadius: '3px', border: '1.5px solid #d1d5db', background: isSelected ? '#6d28d9' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      {isSelected && <Icon d={ICONS.check} size={10} color="#fff" />}
                                    </div>
                                    <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>
                                      {t.title} <span style={{ color: '#9ca3af' }}>({String(t.number || '001').padStart(3, '0')})</span>
                                    </span>
                                  </div>
                                  {!isSelected && (
                                    <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: '1.5px solid #6d28d9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <Icon d={ICONS.plus} size={11} color="#6d28d9" />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Indicators */}
            {activeViewFields.includes('indicators') && (
              <div onMouseEnter={() => setHoveredRow('indicators')} onMouseLeave={() => setHoveredRow(null)}
                style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', padding: '8px 12px', borderRadius: '12px', border: hoveredRow === 'indicators' ? '1px solid #ddd6fe' : '1px solid transparent', background: hoveredRow === 'indicators' ? '#f5f3ff' : 'transparent', transition: 'all 0.2s', marginLeft: '-12px', marginRight: '-12px' }}>
                <Icon d={ICONS.check} size={18} color="#9ca3af" />
                <span style={{ fontSize: '14px', color: '#6b7280', width: '110px' }}>Indicators</span>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {/* Priority badge */}
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#f59e0b', background: '#fef3c7', borderRadius: '6px', padding: '2px 8px' }}>
                    {task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Medium'}
                  </span>
                  {/* Status badge */}
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', background: '#f3f4f6', borderRadius: '6px', padding: '2px 8px' }}>
                    {task.status ? task.status.charAt(0).toUpperCase() + task.status.slice(1) : 'Open'}
                  </span>
                </div>
              </div>
            )}

            {/* Assignee */}
            {activeViewFields.includes('assignee') && (
              <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '16px', cursor: 'pointer', padding: '8px 12px', borderRadius: '12px', background: showAssigneePicker ? '#f5f3ff' : 'transparent', marginLeft: '-12px', marginRight: '-12px' }}
                onClick={() => setShowAssigneePicker(v => !v)}>
                <Icon d={ICONS.user} size={18} color="#9ca3af" style={{ marginTop: '4px' }} />
                <span style={{ fontSize: '14px', color: '#6b7280', width: '110px', marginTop: '4px' }}>Assignee</span>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {localAssignees.length > 0 ? (
                    localAssignees.map((asg, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: asg.avatarColor || '#6d28d9', color: '#fff', fontSize: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {(asg.name || `${asg.firstName} ${asg.lastName}`).substring(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontSize: '14px', color: '#111827', fontWeight: '600' }}>{asg.name || `${asg.firstName} ${asg.lastName}`}</span>
                      </div>
                    ))
                  ) : (
                    <span style={{ fontSize: '14px', color: '#9ca3af', fontStyle: 'italic' }}>Unassigned</span>
                  )}
                </div>
                {showAssigneePicker && (
                  <>
                    <div onClick={(e) => { e.stopPropagation(); setShowAssigneePicker(false); }} style={{ position: 'fixed', inset: 0, zIndex: 99999 }} />
                    <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: '130px', zIndex: 100000 }} onClick={e => e.stopPropagation()}>
                      <AssigneePicker
                        members={members}
                        selectedIds={localAssignees.map(a => a.id || a._id)}
                        onSelect={async (member) => {
                          const id = member.id || member._id;
                          const already = localAssignees.find(a => (a.id || a._id) === id);
                          const updated = already ? localAssignees.filter(a => (a.id || a._id) !== id) : [...localAssignees, member];
                          setLocalAssignees(updated);
                          try {
                            await plutioTasksAPI.update(task.id || task._id, { assignees: updated.map(a => a.id || a._id) });
                            onUpdateTask && onUpdateTask(task.id || task._id, { assignees: updated });
                          } catch (err) { console.error('Failed to save assignees:', err); }
                        }}
                        onClose={() => setShowAssigneePicker(false)}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Followers — always shown, same as Assignee */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '16px', cursor: 'pointer', padding: '8px 12px', borderRadius: '12px', background: showFollowersPicker ? '#f5f3ff' : 'transparent', marginLeft: '-12px', marginRight: '-12px' }}
              onClick={() => setShowFollowersPicker(v => !v)}>
              <Icon d={ICONS.following} size={18} color="#9ca3af" style={{ marginTop: '4px' }} />
              <span style={{ fontSize: '14px', color: '#6b7280', width: '110px', marginTop: '4px' }}>Followers</span>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {localFollowers.length > 0 ? (
                  localFollowers.map((flw, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: flw.avatarColor || '#6d28d9', color: '#fff', fontSize: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {(flw.name || `${flw.firstName} ${flw.lastName}`).substring(0, 2).toUpperCase()}
                      </div>
                      <span style={{ fontSize: '14px', color: '#111827', fontWeight: '600' }}>{flw.name || `${flw.firstName} ${flw.lastName}`}</span>
                    </div>
                  ))
                ) : (
                  <span style={{ fontSize: '14px', color: '#9ca3af', fontStyle: 'italic' }}>Add follower</span>
                )}
              </div>
              {showFollowersPicker && (
                <>
                  <div onClick={(e) => { e.stopPropagation(); setShowFollowersPicker(false); }} style={{ position: 'fixed', inset: 0, zIndex: 99999 }} />
                  <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: '130px', zIndex: 100000 }} onClick={e => e.stopPropagation()}>
                    <AssigneePicker
                      members={members}
                      selectedIds={localFollowers.map(f => f.id || f._id)}
                      onSelect={(member) => {
                        const id = member.id || member._id;
                        const already = localFollowers.find(f => (f.id || f._id) === id);
                        setLocalFollowers(already
                          ? localFollowers.filter(f => (f.id || f._id) !== id)
                          : [...localFollowers, member]
                        );
                      }}
                      onClose={() => setShowFollowersPicker(false)}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Creator — always shown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', padding: '8px 12px' }}>
              <Icon d={ICONS.user} size={18} color="#9ca3af" />
              <span style={{ fontSize: '14px', color: '#6b7280', width: '110px' }}>Creator</span>
              <span style={{ fontSize: '14px', color: '#111827', fontWeight: '600' }}>{task.creatorName || 'You'}</span>
            </div>

            {/* Optional added fields */}
            {activeViewFields.includes('assignedBy') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', padding: '8px 12px' }}>
                <Icon d={ICONS.user} size={18} color="#9ca3af" />
                <span style={{ fontSize: '14px', color: '#6b7280', width: '110px' }}>Assigned by</span>
                <span style={{ fontSize: '14px', color: '#9ca3af' }}>—</span>
              </div>
            )}
            {activeViewFields.includes('dateCompleted') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', padding: '8px 12px' }}>
                <Icon d={ICONS.check} size={18} color="#9ca3af" />
                <span style={{ fontSize: '14px', color: '#6b7280', width: '110px' }}>Date completed</span>
                <span style={{ fontSize: '14px', color: '#9ca3af' }}>—</span>
              </div>
            )}
            {activeViewFields.includes('location') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', padding: '8px 12px' }}>
                <Icon d={ICONS.info} size={18} color="#9ca3af" />
                <span style={{ fontSize: '14px', color: '#6b7280', width: '110px' }}>Location</span>
                <span style={{ fontSize: '14px', color: '#9ca3af' }}>—</span>
              </div>
            )}
            {activeViewFields.includes('subtasks') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', padding: '8px 12px' }}>
                <Icon d={ICONS.info} size={18} color="#9ca3af" />
                <span style={{ fontSize: '14px', color: '#6b7280', width: '110px' }}>Subtasks</span>
                <span style={{ fontSize: '14px', color: '#9ca3af' }}>None</span>
              </div>
            )}
          </div>

          {/* Custom Fields */}
          <div style={{ marginTop: '48px' }}>
            <h4 style={{
              fontSize: '14px', fontWeight: '800', color: '#111827',
              marginBottom: '20px', textTransform: 'none'
            }}>Custom fields</h4>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#6b7280' }}>
                <Icon d={ICONS.plus} size={16} />
                <span style={{ fontSize: '14px', fontWeight: '600' }}>Add custom field</span>
              </div>
              <Icon d={ICONS.info} size={16} color="#3b82f6" />
            </div>
          </div>
        </div>
        )} {/* end details tab */}

        {/* Placeholder tabs */}
        {['checklist', 'files', 'time', 'links'].includes(drawerTab) && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '14px' }}>
            {drawerTab.charAt(0).toUpperCase() + drawerTab.slice(1)} coming soon
          </div>
        )}

        {/* Attachment modal */}
        {showAttachModal && (
          <>
            <div onClick={() => setShowAttachModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100000 }} />
            <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: '16px', padding: '28px', width: '500px', maxWidth: '90vw', zIndex: 100001, boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <p style={{ fontSize: '15px', color: '#374151', marginBottom: '4px' }}>
                  Drop files here, paste, <button onClick={() => { fileInputRef.current?.click(); setShowAttachModal(false); }} style={{ background: 'none', border: 'none', color: '#6d28d9', fontWeight: '700', cursor: 'pointer', fontSize: '15px', padding: 0 }}>browse files</button> or import from:
                </p>
              </div>
              <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {[
                  { label: 'Browse files', icon: ICONS.uploadFile, color: '#6d28d9', action: () => { fileInputRef.current?.click(); setShowAttachModal(false); } },
                  { label: 'Link', icon: ICONS.link, color: '#f97316', action: () => { const url = prompt('Enter URL:'); if (url) { setCommentFiles(prev => [...prev, { name: url, isLink: true }]); } setShowAttachModal(false); } },
                ].map(opt => (
                  <button key={opt.label} onClick={opt.action} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 16px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '10px', textAlign: 'left', width: '100%' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon d={opt.icon} size={18} color={opt.color} />
                    </div>
                    <span style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>{opt.label}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setShowAttachModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                <Icon d={ICONS.close} size={18} />
              </button>
            </div>
          </>
        )}

        {/* Create Snippet modal */}
        {showCreateSnippet && (
          <>
            <div onClick={() => setShowCreateSnippet(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100000 }} />
            <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: '16px', padding: '28px', width: '500px', maxWidth: '90vw', zIndex: 100001, boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
              <h3 style={{ margin: '0 0 24px', fontSize: '20px', fontWeight: '800', color: '#111827' }}>Create snippet</h3>
              <button onClick={() => setShowCreateSnippet(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                <Icon d={ICONS.circleClose} size={20} />
              </button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                <input value={snippetName} onChange={e => setSnippetName(e.target.value)} placeholder="Snippet name" style={{ padding: '12px 14px', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#6d28d9'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                <input value={snippetCategory} onChange={e => setSnippetCategory(e.target.value)} placeholder="Category" style={{ padding: '12px 14px', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#6d28d9'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                <textarea value={snippetContent} onChange={e => setSnippetContent(e.target.value)} placeholder="Snippet content" rows={4} style={{ padding: '12px 14px', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} onFocus={e => e.target.style.borderColor = '#6d28d9'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowCreateSnippet(false)} style={{ padding: '10px 24px', background: '#f3f4f6', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', color: '#374151' }}>Cancel</button>
                <button onClick={() => { if (snippetContent.trim()) { setCommentText(prev => prev + (prev ? '\n' : '') + snippetContent); } setShowCreateSnippet(false); setSnippetName(''); setSnippetCategory(''); setSnippetContent(''); }} style={{ padding: '10px 24px', background: '#22c55e', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Create <Icon d={ICONS.arrowRight} size={14} color="#fff" />
                </button>
              </div>
            </div>
          </>
        )}
    </>
  );
};


/* ─── Main Tasks component ─── */
const Tasks = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, members, setMembers } = usePlutioCopyAuth();

  const pickerRef = useRef(null);
   const actionsRef = useRef(null);
   const roleRef = useRef(null);

   // State for dynamic items
  const [projects, setProjects] = useState([]);
  const [taskSets, setTaskSets] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for modals
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTaskSetModal, setShowTaskSetModal] = useState(false);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  
  const [newProjectName, setNewProjectName] = useState('');
  const [projectMembersInput, setProjectMembersInput] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [projectClient, setProjectClient] = useState('');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');

  const [newTaskSetName, setNewTaskSetName] = useState('');
  const [newTaskSetColor, setNewTaskSetColor] = useState(TASK_SET_COLORS[0]);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskProject, setNewTaskProject] = useState('');

  // Task Groups State
  const [taskGroups, setTaskGroups] = useState([]);
  const [showGroupCreate, setShowGroupCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  // Inline Task States — inlineCreateGroupId: undefined=closed, null=standalone, string=groupId
  const [inlineCreateGroupId, setInlineCreateGroupId] = useState(undefined);
  const [showInlineCreate, setShowInlineCreate] = useState(false);
  const [inlineTaskTitle, setInlineTaskTitle] = useState('');
  const [inlineTaskDescription, setInlineTaskDescription] = useState('');
  const [inlineTaskStartDate, setInlineTaskStartDate] = useState('');
  const [inlineTaskDueDate, setInlineTaskDueDate] = useState('');
  const [inlineTaskAssignees, setInlineTaskAssignees] = useState([]);
  const [activePicker, setActivePicker] = useState(null); // 'startDate' | 'dueDate' | 'assignee'

  // View Editor State
  const [activeViewFields, setActiveViewFields] = useState(DEFAULT_VIEW_FIELDS);

  // Task Drawer State
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDrawer, setShowTaskDrawer] = useState(false);

  // Date Picker State
  const [datePickerState, setDatePickerState] = useState({
    show: false,
    type: null, // 'startDate' | 'dueDate'
    value: null,
    position: { top: 0, left: 0 },
    disabledDate: () => false,
  });

  const handleOpenDatePicker = (type, rect) => {
    const value = selectedTask ? (type === 'startDate' ? selectedTask.startDate : selectedTask.dueDate) : null;
    
    const isStartDateDisabled = (date) => {
      const baseline = value ? new Date(value) : new Date();
      const fifteenDaysAgo = new Date(baseline);
      fifteenDaysAgo.setDate(baseline.getDate() - 15);
      const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const minDate = new Date(fifteenDaysAgo.getFullYear(), fifteenDaysAgo.getMonth(), fifteenDaysAgo.getDate());
      const maxDate = new Date(baseline.getFullYear(), baseline.getMonth(), baseline.getDate());
      return compareDate < minDate || compareDate > maxDate;
    };

    const isDueDateDisabled = (date) => {
      const baseline = value ? new Date(value) : new Date();
      const fifteenDaysAfter = new Date(baseline);
      fifteenDaysAfter.setDate(baseline.getDate() + 15);
      const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const minDate = new Date(baseline.getFullYear(), baseline.getMonth(), baseline.getDate());
      const maxDate = new Date(fifteenDaysAfter.getFullYear(), fifteenDaysAfter.getMonth(), fifteenDaysAfter.getDate());
      return compareDate < minDate || compareDate > maxDate;
    };

    // Center picker on the clicked element, but clamp to viewport
    const pickerWidth = 480;
    const idealLeft = rect.left + rect.width / 2 - pickerWidth / 2;
    const left = Math.max(10, Math.min(idealLeft, window.innerWidth - pickerWidth - 10));
    const top = rect.bottom + 8;

    setDatePickerState({
      show: true,
      type,
      value,
      position: { top, left },
      disabledDate: type === 'startDate' ? isStartDateDisabled : isDueDateDisabled,
    });
  };

  const handleDateChange = async (newValue) => {
    if (!selectedTask || !datePickerState.type) return;

    const updateData = {};
    if (datePickerState.type === 'startDate') updateData.scheduledDate = newValue;
    if (datePickerState.type === 'dueDate') updateData.dueDate = newValue;

    try {
      const res = await plutioTasksAPI.update(selectedTask.id, updateData);
      if (res.data.success) {
        handleUpdateTaskInList(selectedTask.id, updateData);
      }
    } catch (error) {
      console.error('Failed to update task date:', error);
    } finally {
      setDatePickerState({ ...datePickerState, show: false });
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowTaskDrawer(true);
  };

  const handleUpdateTaskInList = (taskId, updatedFields) => {
    setTasks(prev => prev.map(t => t.id === taskId || t._id === taskId ? { ...t, ...updatedFields } : t));
    setSelectedTask(prev => prev && (prev.id === taskId || prev._id === taskId) ? { ...prev, ...updatedFields } : prev);
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !currentBoardId) return;
    try {
      const res = await plutioTaskGroupsAPI.create(currentBoardId, { name: newGroupName.trim() });
      if (res.data.success) {
        setTaskGroups(prev => [...prev, res.data.data]);
        setNewGroupName('');
        setShowGroupCreate(false);
      }
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  };

  const resetInlineCreate = () => {
    setInlineCreateGroupId(undefined);
    setShowInlineCreate(false);
    setInlineTaskTitle('');
    setInlineTaskDescription('');
    setInlineTaskStartDate('');
    setInlineTaskDueDate('');
    setInlineTaskAssignees([]);
    setActivePicker(null);
  };

  const handleInlineCreateTask = async (groupId) => {
    if (!inlineTaskTitle.trim() || !currentBoardId) return;
    try {
      const res = await plutioTasksAPI.create(currentBoardId, {
        title: inlineTaskTitle.trim(),
        description: inlineTaskDescription,
        assignees: inlineTaskAssignees.map(a => a.id || a._id),
        scheduledDate: parsePlutioDate(inlineTaskStartDate),
        dueDate: parsePlutioDate(inlineTaskDueDate),
        group: groupId || null,
      });
      if (res.data.success) {
        const t = res.data.data;
        setTasks(prev => [...prev, {
          id: t._id,
          title: t.title,
          description: t.description,
          project: currentBoard?.name || 'General',
          assignees: t.assignees || [],
          startDate: t.scheduledDate || '',
          dueDate: t.dueDate || '',
          taskSetId: currentBoardId,
          groupId: groupId || null,
          number: t.order?.toString().padStart(3, '0') || '001'
        }]);
        resetInlineCreate();
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  // Profile Modal State
  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileCompany, setProfileCompany] = useState('');
  const [profileRole, setProfileRole] = useState('');
  const [isManager, setIsManager] = useState(false);
  const [inviteToWorkspace, setInviteToWorkspace] = useState(false);

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const [taskSetsRes, projectsRes] = await Promise.all([
          plutioBoardsAPI.getAll(),
          plutioBoardsAPI.getProjects(),
        ]);

        if (taskSetsRes.data.success) {
          setTaskSets(taskSetsRes.data.data.map(b => ({
            id: b._id,
            name: b.name,
            color: b.color || '#6d28d9',
          })));
        }

        if (projectsRes.data.success) {
          setProjects(projectsRes.data.data.map(b => ({
            id: b._id,
            name: b.name,
            color: b.color || '#6d28d9',
            client: b.client || '',
            startDate: b.startDate || null,
            deadline: b.deadline || null,
            members: b.members || [],
          })));
        }
      } catch (error) {
        console.error('Failed to fetch boards:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBoards();
  }, []);

  // Determine active view
  const getView = () => {
    const p = location.pathname;
    if (p.includes('/board/'))    return 'board';
    if (p.endsWith('/my'))        return 'my';
    if (p.endsWith('/delegated')) return 'delegated';
    if (p.endsWith('/following')) return 'following';
    if (p.endsWith('/today'))     return 'today';
    return 'all';
  };
  const view = getView();
  
  const currentBoardId = view === 'board' ? location.pathname.split('/board/')[1] : null;

  useEffect(() => {
    const fetchTasks = async () => {
      if (!currentBoardId) {
        // Fetch all tasks for 'all' view
        if (view === 'all') {
          try {
            const res = await plutioTasksAPI.getAll();
            if (res.data.success) {
              setTasks(res.data.data.map(t => ({
                id: t._id,
                title: t.title,
                description: t.description,
                project: t.board?.name || 'General',
                assignees: t.assignees || [],
                startDate: t.scheduledDate || '',
                dueDate: t.dueDate || '',
                taskSetId: t.board?._id || t.board,
                number: t.order?.toString().padStart(3, '0') || '001'
              })));
            }
          } catch (error) {
            console.error('Failed to fetch all tasks:', error);
          }
        }
        return;
      }

      try {
        const [tasksRes, groupsRes] = await Promise.all([
          plutioTasksAPI.getByBoard(currentBoardId),
          plutioTaskGroupsAPI.getByBoard(currentBoardId),
        ]);
        if (tasksRes.data.success) {
          const formattedTasks = tasksRes.data.data.map(t => ({
            id: t._id,
            title: t.title,
            description: t.description,
            project: t.board?.name || 'General',
            assignees: t.assignees || [],
            startDate: t.scheduledDate || '',
            dueDate: t.dueDate || '',
            taskSetId: currentBoardId,
            groupId: t.group ? (t.group._id || t.group) : null,
            number: t.order?.toString().padStart(3, '0') || '001'
          }));
          setTasks(formattedTasks);
        }
        if (groupsRes.data.success) {
          setTaskGroups(groupsRes.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      }
    };
    fetchTasks();
    if (!currentBoardId) setTaskGroups([]);
  }, [currentBoardId, view]);

  useEffect(() => {
     const handleClickOutside = (event) => {
       if (pickerRef.current && !pickerRef.current.contains(event.target)) {
         setActivePicker(null);
       }
       if (actionsRef.current && !actionsRef.current.contains(event.target)) {
          setShowActionsDropdown(false);
        }
        if (roleRef.current && !roleRef.current.contains(event.target)) {
          setShowRoleDropdown(false);
        }
      };
     document.addEventListener("mousedown", handleClickOutside);
     return () => document.removeEventListener("mousedown", handleClickOutside);
   }, []);
 
   const filteredMembers = projectMembersInput.trim()
     ? members.filter(m => {
         const name = m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim();
         return name.toLowerCase().includes(projectMembersInput.toLowerCase());
       })
     : [];
 
   const handleCreateProject = async (e) => {
     e.preventDefault();
     if (!newProjectName.trim()) return;

     try {
       const res = await plutioBoardsAPI.create({
         name: newProjectName.trim(),
         color: '#6d28d9',
         type: 'project',
         members: selectedMembers.map(m => m.id || m._id),
         client: projectClient.trim(),
         startDate: startDate || null,
         deadline: deadline || null,
       });

       if (res.data.success) {
         const d = res.data.data;
         const newProject = {
           id: d._id,
           name: d.name,
           color: d.color,
           client: d.client,
           startDate: d.startDate,
           deadline: d.deadline,
           members: selectedMembers,
         };
         setProjects(prev => [...prev, newProject]);
         setNewProjectName('');
         setProjectMembersInput('');
         setSelectedMembers([]);
         setProjectClient('');
         setStartDate('');
         setDeadline('');
         setShowProjectModal(false);
       }
     } catch (error) {
       console.error('Failed to create project:', error);
     }
   };
 
   const openProfileModal = (nameFromInput) => {
     setProfileFirstName(nameFromInput);
     setShowProfileModal(true);
   };
 
   const handleCreateProfile = async (e) => {
     e.preventDefault();
     if (!profileFirstName.trim()) return;
     
     try {
       const res = await plutioContactsAPI.create({
         firstName: profileFirstName.trim(),
         lastName: profileLastName.trim(),
         email: profileEmail,
         phone: profilePhone,
         company: profileCompany,
         role: profileRole || 'Client',
         status: 'Active',
         avatarColor: TASK_SET_COLORS[Math.floor(Math.random() * TASK_SET_COLORS.length)]
       });
       
       if (res.data.success) {
         const newContact = res.data.data;
         const formattedMember = {
           id: newContact._id,
           name: `${newContact.firstName} ${newContact.lastName}`.trim(),
           email: newContact.email,
           role: newContact.role,
           company: newContact.company,
           status: newContact.status,
           phone: newContact.phone
         };
         setMembers(prev => [...prev, formattedMember]);
         setSelectedMembers(prev => [...prev, formattedMember]);
         
         setProfileFirstName('');
         setProfileLastName('');
         setProfileEmail('');
         setProfilePhone('');
         setProfileCompany('');
         setProfileRole('');
         setShowRoleDropdown(false);
         setShowProfileModal(false);
       }
     } catch (error) {
       console.error('Failed to create contact:', error);
       alert(error.response?.data?.message || 'Failed to create contact');
     }
   };
 
  const currentBoard = taskSets.find(s => s.id === currentBoardId);

  const handleCreateTaskSet = async (e) => {
    e.preventDefault();
    if (!newTaskSetName.trim()) return;
    
    try {
      const res = await plutioBoardsAPI.create({
        name: newTaskSetName.trim(),
        color: newTaskSetColor,
        type: 'taskset',
      });
      
      if (res.data.success) {
        const newSet = { 
          id: res.data.data._id, 
          name: res.data.data.name, 
          color: res.data.data.color 
        };
        setTaskSets([...taskSets, newSet]);
        setNewTaskSetName('');
        setNewTaskSetColor(TASK_SET_COLORS[0]);
        setShowTaskSetModal(false);
        navigate(`/plutiocopy/tasks/board/${newSet.id}`);
      }
    } catch (error) {
      console.error('Failed to create task set:', error);
    }
  };

  const handleDeleteBoard = async () => {
    if (!currentBoardId) return;
    try {
      const res = await plutioBoardsAPI.delete(currentBoardId);
      if (res.data.success) {
        setTaskSets(taskSets.filter(s => s.id !== currentBoardId));
        setShowDeleteModal(false);
        navigate('/plutiocopy/tasks');
      }
    } catch (error) {
      console.error('Failed to delete board:', error);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskName.trim() || !currentBoardId) return;
    
    try {
      const res = await plutioTasksAPI.create(currentBoardId, {
        title: newTaskName.trim(),
        board: currentBoardId
      });
      
      if (res.data.success) {
        const t = res.data.data;
        const newTask = { 
          id: t._id, 
          title: t.title, 
          project: currentBoard?.name || 'General',
          assignee: '',
          startDate: '',
          dueDate: '',
          taskSetId: currentBoardId,
          number: t.order?.toString().padStart(3, '0') || '001'
        };
        setTasks(prevTasks => [...prevTasks, newTask]);
        setNewTaskName('');
        setNewTaskProject('');
        setShowTaskModal(false);
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const viewMeta = {
    all:       { label: 'All tasks',  breadcrumb: 'Tasks / All tasks' },
    my:        { label: 'My tasks',   breadcrumb: 'Tasks / My tasks' },
    delegated: { label: 'Delegated',  breadcrumb: 'Tasks / Delegated' },
    following: { label: 'Following',  breadcrumb: 'Tasks / Following' },
    today:     { label: 'Today',      breadcrumb: 'Tasks / Today' },
    board:     { label: currentBoard?.name || 'Task set', breadcrumb: `Tasks / Task sets / ${currentBoard?.name || ''}` }
  };

  const allTasksCols = [
    { key: 'title',     label: 'Task name' },
    { key: 'project',   label: 'Project' },
    { key: 'assignee',  label: 'Assignee' },
    { key: 'startDate', label: 'Start date' },
    { key: 'dueDate',   label: 'Due date' },
  ];

  const renderContent = () => {
    if (view === 'board' && !currentBoard) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>Page Not Found</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => navigate('/plutiocopy/home')} style={{ padding: '10px 24px', background: '#1f2937', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Go back</button>
            <button onClick={logout} style={{ padding: '10px 24px', background: '#1f2937', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Logout</button>
          </div>
        </div>
      );
    }

    switch (view) {
      case 'board':
        // Inline create card JSX — reused per column
        const renderInlineCard = (groupId) => {
          const isOpen = inlineCreateGroupId === groupId;
          return isOpen ? (
            <div style={{ position: 'relative', marginBottom: '8px', zIndex: 51 }}>
              <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', inset: 0, zIndex: 50 }} onMouseDown={() => resetInlineCreate()} />
              <div style={{
                background: '#fff', borderRadius: '12px', border: '1.5px solid #6d28d9',
                padding: '20px', width: '260px', boxShadow: '0 4px 24px rgba(109,40,217,0.08)',
                position: 'relative', boxSizing: 'border-box', zIndex: 51
              }}>
                {(inlineTaskTitle.trim() || inlineTaskDescription.trim()) && (
                  <button onClick={() => handleInlineCreateTask(groupId)} style={{
                    position: 'absolute', top: '20px', right: '16px',
                    background: '#1f2937', color: '#fff', border: 'none',
                    borderRadius: '4px', padding: '3px 8px', fontSize: '10px',
                    fontWeight: '700', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', gap: '4px', zIndex: 10
                  }}>
                    Create <Icon d={ICONS.enter} size={9} color="#fff" />
                  </button>
                )}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                  <Icon d={ICONS.squarePlus} size={18} color="#1f2937" style={{ marginTop: '2px' }} />
                  <textarea autoFocus rows={1} value={inlineTaskTitle}
                    onChange={(e) => { setInlineTaskTitle(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                    placeholder="Type title or /template"
                    onKeyDown={(e) => { if (e.key === 'Escape') resetInlineCreate(); }}
                    style={{ width: '100%', border: 'none', outline: 'none', fontSize: '14px', color: '#4f46e5', fontWeight: '700', background: 'transparent', fontFamily: 'inherit', paddingRight: '65px', resize: 'none', minHeight: '20px', overflow: 'hidden', lineHeight: '1.4' }}
                  />
                </div>
                <div style={{ marginBottom: '16px', paddingLeft: '26px' }}>
                  <textarea value={inlineTaskDescription}
                    onChange={(e) => { setInlineTaskDescription(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                    placeholder="Description"
                    style={{ width: '100%', border: 'none', outline: 'none', fontSize: '12px', color: '#4b5563', resize: 'none', minHeight: '20px', padding: 0, background: 'transparent', fontFamily: 'inherit', lineHeight: '1.5', overflow: 'hidden' }}
                  />
                </div>
                <div ref={pickerRef} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ position: 'relative' }}>
                    <button onClick={() => setActivePicker(activePicker === 'startDate' ? null : 'startDate')} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px', background: '#fff', cursor: 'pointer', display: 'flex', transition: 'all 0.2s', color: activePicker === 'startDate' || inlineTaskStartDate ? '#6d28d9' : '#9ca3af', alignItems: 'center', gap: '8px' }}>
                      <Icon d={ICONS.calendar} size={20} />
                      {inlineTaskStartDate && <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{inlineTaskStartDate}</span>}
                    </button>
                    {activePicker === 'startDate' && <DatePicker value={inlineTaskStartDate} onChange={setInlineTaskStartDate} onClose={() => setActivePicker(null)} title="Start Date" />}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <button onClick={() => setActivePicker(activePicker === 'dueDate' ? null : 'dueDate')} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px', background: '#fff', cursor: 'pointer', display: 'flex', transition: 'all 0.2s', color: activePicker === 'dueDate' || inlineTaskDueDate ? '#6d28d9' : '#9ca3af', alignItems: 'center', gap: '8px' }}>
                      <Icon d={ICONS.clock} size={20} />
                      {inlineTaskDueDate && <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{inlineTaskDueDate}</span>}
                    </button>
                    {activePicker === 'dueDate' && <DatePicker value={inlineTaskDueDate} onChange={setInlineTaskDueDate} onClose={() => setActivePicker(null)} title="Due Date" />}
                  </div>
                  <div style={{ position: 'relative' }}>
                    {inlineTaskAssignees.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', marginRight: '4px' }}>
                        {inlineTaskAssignees.map((asg, idx) => (
                          <div key={idx} style={{ width: '24px', height: '24px', borderRadius: '50%', background: asg.avatarColor || '#6d28d9', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', border: '2px solid #fff', marginLeft: idx === 0 ? 0 : '-8px', zIndex: inlineTaskAssignees.length - idx }}>
                            {(asg.name || `${asg.firstName} ${asg.lastName}`).substring(0, 2).toUpperCase()}
                          </div>
                        ))}
                      </div>
                    )}
                    <button onClick={() => setActivePicker(activePicker === 'assignee' ? null : 'assignee')} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px', background: '#fff', cursor: 'pointer', display: 'flex', transition: 'all 0.2s', color: activePicker === 'assignee' ? '#6d28d9' : '#9ca3af' }}>
                      <Icon d={ICONS.assignee} size={20} />
                    </button>
                    {activePicker === 'assignee' && (
                      <AssigneePicker
                        members={user ? [{ ...user, id: user._id || user.id }, ...members] : members}
                        selectedIds={inlineTaskAssignees.map(a => a.id || a._id)}
                        onSelect={(m) => {
                          const mId = m.id || m._id;
                          setInlineTaskAssignees(prev => prev.find(a => (a.id || a._id) === mId) ? prev.filter(a => (a.id || a._id) !== mId) : [...prev, m]);
                        }}
                        onClose={() => setActivePicker(null)}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null;
        };

        return (
          <>
            <Toolbar onCreateTask={() => setShowTaskModal(true)} hideCreate={true} activeViewFields={activeViewFields} setActiveViewFields={setActiveViewFields} />
            <div style={{ padding: '24px 40px 160px', flex: 1, background: '#f5f5f8', overflowX: 'auto', overflowY: 'auto' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', minWidth: 'max-content' }}>

                {/* ── Standalone tasks column ── */}
                <div style={{ width: '280px', flexShrink: 0 }}>
                  {/* Create task button */}
                  <div onClick={() => { resetInlineCreate(); setInlineCreateGroupId(null); }}
                    style={{ background: '#fff', borderRadius: '12px', border: '1.5px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', marginBottom: '8px', color: '#1f2937', cursor: 'pointer', fontWeight: '700' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '4px', border: '1.5px solid #6d28d9' }}>
                      <Icon d={ICONS.plus} size={12} color="#6d28d9" />
                    </div>
                    <span style={{ fontSize: '14px' }}>Create task</span>
                  </div>
                  {renderInlineCard(null)}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {tasks.filter(t => String(t.taskSetId) === String(currentBoardId) && !t.groupId).map(task => (
                      <TaskCard key={task.id} task={task} onClick={handleTaskClick} onDelete={async (id) => { await plutioTasksAPI.delete(id); setTasks(prev => prev.filter(t => t.id !== id)); }} />
                    ))}
                  </div>
                </div>

                {/* ── Task group columns ── */}
                {taskGroups.map(group => (
                  <div key={group._id} style={{ width: '280px', flexShrink: 0 }}>
                    {/* Group header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', padding: '10px 14px', background: '#fff', borderRadius: '12px', border: '1.5px solid #e5e7eb' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: '2px solid #6b7280', background: 'transparent', flexShrink: 0 }} />
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#1f2937', flex: 1 }}>{group.name}</span>
                      <button onClick={async () => {
                        if (!window.confirm(`Delete group "${group.name}"?`)) return;
                        await plutioTaskGroupsAPI.delete(group._id);
                        setTaskGroups(prev => prev.filter(g => g._id !== group._id));
                        setTasks(prev => prev.map(t => t.groupId === group._id ? { ...t, groupId: null } : t));
                      }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', padding: '2px', display: 'flex' }}>
                        <Icon d={ICONS.close} size={12} />
                      </button>
                    </div>
                    {/* Create task inside group */}
                    <div onClick={() => { resetInlineCreate(); setInlineCreateGroupId(group._id); }}
                      style={{ background: '#fff', borderRadius: '12px', border: '1.5px dashed #d1d5db', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', marginBottom: '8px', color: '#6b7280', cursor: 'pointer' }}>
                      <Icon d={ICONS.plus} size={14} color="#6b7280" />
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>Create task</span>
                    </div>
                    {renderInlineCard(group._id)}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {tasks.filter(t => String(t.taskSetId) === String(currentBoardId) && t.groupId === group._id).map(task => (
                        <TaskCard key={task.id} task={task} onClick={handleTaskClick} onDelete={async (id) => { await plutioTasksAPI.delete(id); setTasks(prev => prev.filter(t => t.id !== id)); }} />
                      ))}
                    </div>
                  </div>
                ))}

                {/* ── Create task group column ── */}
                <div style={{ width: '280px', flexShrink: 0 }}>
                  {showGroupCreate ? (
                    <div style={{ position: 'relative', zIndex: 51 }}>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onMouseDown={() => { setShowGroupCreate(false); setNewGroupName(''); }} />
                    <div style={{ position: 'relative', zIndex: 51, background: '#fff', borderRadius: '12px', border: '1.5px solid #6d28d9', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: '2px solid #6d28d9', flexShrink: 0 }} />
                      <input
                        autoFocus
                        value={newGroupName}
                        onChange={e => setNewGroupName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleCreateGroup(); if (e.key === 'Escape') { setShowGroupCreate(false); setNewGroupName(''); } }}
                        placeholder="Type title or /template"
                        style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', fontWeight: '700', color: '#4f46e5', background: 'transparent', fontFamily: 'inherit', paddingRight: newGroupName.trim() ? '72px' : '8px' }}
                      />
                      {newGroupName.trim() && (
                        <button onClick={handleCreateGroup} style={{
                          position: 'absolute', top: '50%', right: '12px', transform: 'translateY(-50%)',
                          background: '#1f2937', color: '#fff', border: 'none',
                          borderRadius: '4px', padding: '3px 8px', fontSize: '10px',
                          fontWeight: '700', cursor: 'pointer', display: 'flex',
                          alignItems: 'center', gap: '4px'
                        }}>
                          Create <Icon d={ICONS.enter} size={9} color="#fff" />
                        </button>
                      )}
                    </div>
                    </div>
                  ) : (
                    <div onClick={() => setShowGroupCreate(true)}
                      style={{ background: '#fff', borderRadius: '12px', border: '1.5px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', color: '#6b7280', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '50%', border: '1.5px solid #d1d5db' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#d1d5db' }} />
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '600' }}>Create task group</span>
                    </div>
                  )}
                </div>

              </div>
            </div>

                {/* OLD inline create — removed, now handled per-column via renderInlineCard */}
                {false && (
                  <div style={{ position: 'relative', marginBottom: '16px' }}>
                    <div style={{
                      background: '#fff', borderRadius: '12px', border: '1.5px solid #6d28d9',
                      padding: '20px', width: '280px', boxShadow: '0 4px 24px rgba(109, 40, 217, 0.08)',
                      position: 'relative', boxSizing: 'border-box'
                    }}>
                      {/* Absolute Positioned Create Button */}
                      {(inlineTaskTitle.trim() || inlineTaskDescription.trim()) && (
                        <button 
                          onClick={async () => {
                            if (!inlineTaskTitle.trim() || !currentBoardId) return;
                            
                            try {
                              const res = await plutioTasksAPI.create(currentBoardId, {
                                title: inlineTaskTitle.trim(),
                                description: inlineTaskDescription,
                                assignees: inlineTaskAssignees.map(a => a.id || a._id),
                                scheduledDate: parsePlutioDate(inlineTaskStartDate),
                                dueDate: parsePlutioDate(inlineTaskDueDate),
                                board: currentBoardId
                              });
                              
                              if (res.data.success) {
                                const t = res.data.data;
                                const newTask = {
                                  id: t._id,
                                  title: t.title,
                                  description: t.description,
                                  project: currentBoard?.name || 'General',
                                  assignees: t.assignees || [],
                                  startDate: t.scheduledDate || '',
                                  dueDate: t.dueDate || '',
                                  taskSetId: currentBoardId,
                                  number: t.order?.toString().padStart(3, '0') || '001'
                                };
                                setTasks(prevTasks => [...prevTasks, newTask]);
                                setShowInlineCreate(false);
                                setInlineTaskTitle('');
                                setInlineTaskDescription('');
                                setInlineTaskStartDate('');
                                setInlineTaskDueDate('');
                                setInlineTaskAssignees([]);
                              }
                            } catch (error) {
                              console.error('Failed to create inline task:', error);
                            }
                          }}
                          style={{ 
                            position: 'absolute', top: '20px', right: '16px',
                            background: '#1f2937', color: '#fff', border: 'none', 
                            borderRadius: '4px', padding: '3px 8px', fontSize: '10px', 
                            fontWeight: '700', cursor: 'pointer', display: 'flex', 
                            alignItems: 'center', gap: '4px', zIndex: 10
                          }}
                        >
                          Create <Icon d={ICONS.enter} size={9} color="#fff" />
                        </button>
                      )}

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                        <Icon d={ICONS.squarePlus} size={18} color="#1f2937" style={{ marginTop: '2px' }} />
                        <div style={{ flex: 1 }}>
                          <textarea 
                            autoFocus
                            rows={1}
                            value={inlineTaskTitle}
                            onChange={(e) => {
                              setInlineTaskTitle(e.target.value);
                              e.target.style.height = 'auto';
                              e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            placeholder="Type title or /template"
                            style={{ 
                              width: '100%', border: 'none', outline: 'none', fontSize: '14px', 
                              color: '#4f46e5', fontWeight: '700', background: 'transparent',
                              fontFamily: 'inherit', paddingRight: '65px', resize: 'none',
                              minHeight: '20px', overflow: 'hidden', lineHeight: '1.4'
                            }}
                          />
                        </div>
                      </div>
                      
                      <div style={{ marginBottom: '16px', paddingLeft: '26px' }}>
                        <textarea 
                          value={inlineTaskDescription}
                          onChange={(e) => {
                            setInlineTaskDescription(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                          }}
                          placeholder="Description"
                          style={{ 
                            width: '100%', border: 'none', outline: 'none', fontSize: '12px', 
                            color: '#4b5563', resize: 'none', minHeight: '20px', padding: 0,
                            background: 'transparent', fontFamily: 'inherit', lineHeight: '1.5',
                            overflow: 'hidden'
                          }}
                        />
                      </div>

                      <div ref={pickerRef} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        {/* Date Pickers */}
                        <div style={{ position: 'relative' }}>
                          <button 
                            onClick={() => setActivePicker(activePicker === 'startDate' ? null : 'startDate')}
                            style={{ 
                              border: '1px solid #e5e7eb', 
                              borderRadius: '8px', 
                              padding: '8px', 
                              background: '#fff',
                              cursor: 'pointer', 
                              display: 'flex', 
                              transition: 'all 0.2s',
                              color: activePicker === 'startDate' || inlineTaskStartDate ? '#6d28d9' : '#9ca3af',
                              alignItems: 'center', gap: '8px'
                            }}
                          >
                            <Icon d={ICONS.calendar} size={20} />
                            {inlineTaskStartDate && (
                              <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>
                                {inlineTaskStartDate}
                              </span>
                            )}
                          </button>
                          {activePicker === 'startDate' && (
                            <DatePicker 
                              value={inlineTaskStartDate} 
                              onChange={setInlineTaskStartDate} 
                              onClose={() => setActivePicker(null)} 
                              title="Start Date"
                            />
                          )}
                        </div>

                        <div style={{ position: 'relative' }}>
                          <button 
                            onClick={() => setActivePicker(activePicker === 'dueDate' ? null : 'dueDate')}
                            style={{ 
                              border: '1px solid #e5e7eb', 
                              borderRadius: '8px', 
                              padding: '8px', 
                              background: '#fff',
                              cursor: 'pointer', 
                              display: 'flex', 
                              transition: 'all 0.2s',
                              color: activePicker === 'dueDate' || inlineTaskDueDate ? '#6d28d9' : '#9ca3af',
                              alignItems: 'center', gap: '8px'
                            }}
                          >
                            <Icon d={ICONS.clock} size={20} />
                            {inlineTaskDueDate && (
                              <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>
                                {inlineTaskDueDate}
                              </span>
                            )}
                          </button>
                          {activePicker === 'dueDate' && (
                            <DatePicker 
                              value={inlineTaskDueDate} 
                              onChange={setInlineTaskDueDate} 
                              onClose={() => setActivePicker(null)} 
                              title="Due Date"
                            />
                          )}
                        </div>

                        {/* Assignee Picker */}
                        <div style={{ position: 'relative' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {inlineTaskAssignees.length > 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', marginRight: '4px' }}>
                                {inlineTaskAssignees.map((asg, idx) => (
                                  <div 
                                    key={idx}
                                    style={{ 
                                      width: '24px', height: '24px', borderRadius: '50%', 
                                      background: asg.avatarColor || '#6d28d9', color: '#fff', 
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                      fontSize: '10px', fontWeight: '700', border: '2px solid #fff',
                                      marginLeft: idx === 0 ? 0 : '-8px',
                                      zIndex: inlineTaskAssignees.length - idx
                                    }}
                                  >
                                    {(asg.name || `${asg.firstName} ${asg.lastName}`).substring(0, 2).toUpperCase()}
                                  </div>
                                ))}
                              </div>
                            )}
                            <button 
                              onClick={() => setActivePicker(activePicker === 'assignee' ? null : 'assignee')}
                              style={{ 
                                border: '1px solid #e5e7eb', 
                                borderRadius: '8px', 
                                padding: '8px', 
                                background: '#fff',
                                cursor: 'pointer', 
                                display: 'flex', 
                                transition: 'all 0.2s',
                                color: activePicker === 'assignee' ? '#6d28d9' : '#9ca3af'
                              }}
                            >
                              <Icon d={ICONS.assignee} size={20} />
                            </button>
                          </div>
                          {activePicker === 'assignee' && (
                            <AssigneePicker 
                              members={user ? [{ ...user, id: user._id || user.id }, ...members] : members} 
                              selectedIds={inlineTaskAssignees.map(a => a.id || a._id)}
                              onSelect={(m) => {
                                const mId = m.id || m._id;
                                if (inlineTaskAssignees.find(a => (a.id || a._id) === mId)) {
                                  setInlineTaskAssignees(inlineTaskAssignees.filter(a => (a.id || a._id) !== mId));
                                } else {
                                  setInlineTaskAssignees([...inlineTaskAssignees, m]);
                                }
                              }} 
                              onClose={() => setActivePicker(null)} 
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

          </>
        );
      case 'all':
        return (
          <>
            <Toolbar onCreateTask={() => setShowTaskModal(true)} hideCreate={true} activeViewFields={activeViewFields} setActiveViewFields={setActiveViewFields} />
            <TasksTable columns={allTasksCols} rows={tasks} onRowClick={handleTaskClick} />
          </>
        );
      case 'my':
      case 'delegated':
      case 'today':
        return (
          <EmptyState
            message="No tasks yet"
            sub="All tasks will appear here once added."
          />
        );
      case 'following':
        return (
          <>
            <Toolbar onCreateTask={() => setShowTaskModal(true)} hideCreate={true} activeViewFields={activeViewFields} setActiveViewFields={setActiveViewFields} />
            <TasksTable columns={allTasksCols} rows={tasks} onRowClick={handleTaskClick} />
          </>
        );
      default:
        return null;
    }
  };

  const middlePanel = (
    <TasksMiddlePanel
      activeView={view}
      projects={projects}
      taskSets={taskSets}
      currentBoardId={currentBoardId}
      onNavigate={(path) => navigate(path)}
      onCreateProject={() => setShowProjectModal(true)}
      onCreateTaskSet={() => setShowTaskSetModal(true)}
    />
  );

  return (
    <PlutioCopyLayout middlePanel={middlePanel}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Breadcrumb + Actions */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px 12px', background: '#fff',
          borderBottom: '1px solid #e0e0ec',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {viewMeta[view].breadcrumb.split(' / ').map((part, i, arr) => {
              const isLast = i === arr.length - 1;
              return (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isLast && view === 'board' && currentBoard && (
                    <div style={{ 
                      width: '12px', height: '12px', borderRadius: '50%', 
                      background: currentBoard.color || '#6d28d9', flexShrink: 0 
                    }} />
                  )}
                  <span style={{
                    fontSize: '20px',
                    fontWeight: '800',
                    color: isLast ? '#111827' : '#9ca3af',
                  }}>
                    {part}
                  </span>
                  {!isLast && (
                    <span style={{ color: '#d1d5db', fontSize: '20px', fontWeight: '400' }}>/</span>
                  )}
                </span>
              );
            })}
            <Icon d={ICONS.info} size={16} color="#c4b5fd" style={{ marginLeft: '4px' }} />
          </div>

          {view === 'board' && (
            <div ref={actionsRef} style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '6px 14px', border: '1px solid #e5e7eb', borderRadius: '6px',
                  background: '#fff', fontSize: '13px', color: '#374151', cursor: 'pointer',
                }}
              >
                Actions
                <Icon d={ICONS.chevDown} size={14} color="#6b7280" />
              </button>

              {showActionsDropdown && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                  background: '#fff', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  border: '1px solid #f0f0f7', width: '220px', zIndex: 1000, padding: '8px',
                }}>
                  <div style={{ display: 'flex', gap: '6px', padding: '8px 12px', borderBottom: '1px solid #f3f4f6', marginBottom: '4px' }}>
                    {TASK_SET_COLORS.slice(0, 6).map(c => (
                      <div key={c} style={{ width: '12px', height: '12px', borderRadius: '50%', background: c }} />
                    ))}
                  </div>
                  {[
                    { label: 'Rename', icon: 'rename' },
                    { label: 'Default settings', icon: 'settings' },
                    { label: 'Duplicate', icon: 'duplicate' },
                    { label: 'Copy', icon: 'copy' },
                    { label: 'Move', icon: 'move' },
                    { label: 'Save to templates', icon: 'template' },
                    { label: 'Apply template', icon: 'template' },
                    { label: 'Export task board', icon: 'export' },
                    { label: 'Archive task board', icon: 'archive' },
                    { label: 'Delete task board', icon: 'delete', color: '#ef4444' },
                  ].map((act) => (
                    <button
                      key={act.label}
                      onClick={() => {
                        setShowActionsDropdown(false);
                        if (act.label === 'Delete task board') setShowDeleteModal(true);
                      }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '8px 12px', borderRadius: '8px', border: 'none',
                        background: 'none', cursor: 'pointer', fontSize: '13px',
                        color: act.color || '#374151', textAlign: 'left',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <Icon d={ICONS[act.icon]} size={14} color={act.color || "#6b7280"} />
                      {act.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#f5f5f8' }}>
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <div style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #6d28d9', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : renderContent()}
        </div>

        {/* Create Project Modal */}
        {showProjectModal && (
          <Modal 
            title="Create project" 
            onClose={() => setShowProjectModal(false)}
            footer={
              <>
                <button onClick={() => setShowProjectModal(false)} style={{ background: '#f3f4f6', border: 'none', padding: '10px 24px', borderRadius: '8px', color: '#4b5563', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleCreateProject} style={{ background: '#22c55e', border: 'none', padding: '10px 24px', borderRadius: '8px', color: '#fff', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Create project <Icon d={ICONS.arrowRight} size={16} color="#fff" />
                </button>
              </>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Project name */}
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 16px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Project name</label>
                <input 
                  autoFocus 
                  value={newProjectName} 
                  onChange={(e) => setNewProjectName(e.target.value)} 
                  placeholder="New project" 
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: '15px', fontWeight: '500', color: '#1f2937' }} 
                />
              </div>

              {/* Project members */}
              <div style={{ position: 'relative' }}>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Project members</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {selectedMembers.map(m => {
                        const mName = m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim() || m.email || 'Member';
                        return (
                        <div key={m.id || m._id} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f3f4f6', padding: '2px 8px', borderRadius: '16px', fontSize: '13px' }}>
                          {mName}
                          <button onClick={() => setSelectedMembers(selectedMembers.filter(sm => (sm.id || sm._id) !== (m.id || m._id)))} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, color: '#9ca3af' }}><Icon d={ICONS.close} size={14} /></button>
                        </div>
                        );
                      })}
                      <input 
                        value={projectMembersInput}
                        onChange={(e) => setProjectMembersInput(e.target.value)}
                        placeholder={selectedMembers.length === 0 ? "Select members" : ""}
                        style={{ border: 'none', outline: 'none', fontSize: '15px', color: '#1f2937', minWidth: '100px', background: 'transparent' }} 
                      />
                    </div>
                  </div>
                  <Icon d={ICONS.info} size={16} color="#3b82f6" />
                </div>

                {/* Suggestions dropdown */}
                {projectMembersInput.trim() && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                    background: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    border: '1px solid #e5e7eb', zIndex: 1000, overflow: 'hidden'
                  }}>
                    {filteredMembers.map(m => {
                      const mId = m.id || m._id;
                      const mName = m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim() || m.email || 'Member';
                      return (
                      <div
                        key={mId}
                        onClick={() => {
                          if (!selectedMembers.find(sm => (sm.id || sm._id) === mId)) {
                            setSelectedMembers([...selectedMembers, { ...m, id: mId, name: mName }]);
                          }
                          setProjectMembersInput('');
                        }}
                        style={{ padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f3f4f6' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                      >
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: m.avatarColor || '#6d28d9', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>{mName.charAt(0).toUpperCase()}</div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>{mName}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>{m.email}</div>
                        </div>
                        <Icon d={ICONS.enter} size={14} color="#9ca3af" style={{ marginLeft: 'auto' }} />
                      </div>
                      );
                    })}
                    {/* Create new suggestion */}
                    <div 
                      onClick={() => openProfileModal(projectMembersInput)}
                      style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', color: '#1f2937' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon d={ICONS.plus} size={14} color="#1f2937" />
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '600' }}>Create {projectMembersInput}</span>
                      <Icon d={ICONS.enter} size={14} color="#9ca3af" style={{ marginLeft: 'auto' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Project client */}
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Project client</label>
                  <input 
                    value={projectClient} 
                    onChange={(e) => setProjectClient(e.target.value)} 
                    placeholder="Select client" 
                    style={{ width: '100%', border: 'none', outline: 'none', fontSize: '15px', color: '#1f2937' }} 
                  />
                </div>
                <Icon d={ICONS.info} size={16} color="#3b82f6" />
              </div>

              {/* Dates */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Start date</label>
                  <input 
                    type="date"
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                    style={{ width: '100%', border: 'none', outline: 'none', fontSize: '14px', color: '#1f2937' }} 
                  />
                </div>
                <div style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Deadline</label>
                  <input 
                    type="date"
                    value={deadline} 
                    onChange={(e) => setDeadline(e.target.value)} 
                    style={{ width: '100%', border: 'none', outline: 'none', fontSize: '14px', color: '#1f2937' }} 
                  />
                </div>
              </div>

              {/* More options */}
              <div style={{ marginTop: '12px' }}>
                <span style={{ fontSize: '13px', color: '#6b7280', display: 'block', marginBottom: '16px' }}>More options</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 16px' }}>
                    <input disabled placeholder="Select template" style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent' }} />
                  </div>
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1f2937' }}>
                      <Icon d={ICONS.plus} size={14} />
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>Add custom field</span>
                    </div>
                    <Icon d={ICONS.info} size={16} color="#3b82f6" />
                  </div>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* Create Profile Modal */}
        {showProfileModal && (
          <Modal 
            title="Create profile" 
            onClose={() => setShowProfileModal(false)}
            footer={
              <>
                <button onClick={() => setShowProfileModal(false)} style={{ 
                  background: 'none', border: 'none', padding: '10px 24px', 
                  borderRadius: '8px', color: '#6b7280', fontWeight: '600', 
                  cursor: 'pointer', fontSize: '15px' 
                }}>Cancel</button>
                <button 
                  onClick={handleCreateProfile} 
                  style={{ 
                    background: profileFirstName.trim() ? '#22c55e' : '#f3f4f6', 
                    border: 'none', padding: '12px 32px', borderRadius: '8px', 
                    color: profileFirstName.trim() ? '#fff' : '#9ca3af', 
                    fontWeight: '600', cursor: profileFirstName.trim() ? 'pointer' : 'not-allowed', 
                    display: 'flex', alignItems: 'center', gap: '8px',
                    transition: 'all 0.2s', fontSize: '15px', minWidth: '240px',
                    justifyContent: 'center'
                  }}
                  disabled={!profileFirstName.trim()}
                >
                  {profileFirstName.trim() ? 'Create profile' : 'Enter first name to continue'} <Icon d={ICONS.arrowRight} size={16} color="currentColor" />
                </button>
              </>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ flex: 1, padding: '10px 14px', borderRight: '1px solid #e5e7eb' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>First name*</label>
                  <input 
                    autoFocus
                    value={profileFirstName} 
                    onChange={(e) => setProfileFirstName(e.target.value)} 
                    style={{ width: '100%', border: 'none', outline: 'none', fontSize: '15px', color: '#111827' }} 
                  />
                </div>
                <div style={{ flex: 1, padding: '10px 14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>Last name</label>
                  <input 
                    value={profileLastName} 
                    onChange={(e) => setProfileLastName(e.target.value)} 
                    style={{ width: '100%', border: 'none', outline: 'none', fontSize: '15px', color: '#111827' }} 
                  />
                </div>
              </div>

              <div ref={roleRef} style={{ position: 'relative' }}>
                <div 
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                >
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>User role</label>
                    <div style={{ fontSize: '15px', color: '#111827', fontWeight: '500' }}>{profileRole || 'Client'}</div>
                  </div>
                  <Icon d={ICONS.help} size={16} color="#3b82f6" />
                </div>

                {showRoleDropdown && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                    background: '#fff', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    border: '1px solid #e5e7eb', zIndex: 1000, overflow: 'hidden'
                  }}>
                    {ROLES.map(role => (
                      <div 
                        key={role}
                        onClick={() => {
                          setProfileRole(role);
                          setShowRoleDropdown(false);
                        }}
                        style={{ 
                          padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          fontSize: '14px', color: (profileRole || 'Client') === role ? '#111827' : '#6b7280',
                          background: '#fff', borderBottom: '1px solid #f3f4f6'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                      >
                        <span>{role}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {role === 'Client' && <Icon d={ICONS.enter} size={14} color="#d1d5db" />}
                          {(profileRole || 'Client') === role && <Icon d={ICONS.check} size={14} color="#6d28d9" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '10px 14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>Email address</label>
                <input 
                  value={profileEmail} 
                  onChange={(e) => setProfileEmail(e.target.value)} 
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: '15px', color: '#111827' }} 
                />
              </div>

              <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '10px 14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>Phone number</label>
                <input 
                  value={profilePhone} 
                  onChange={(e) => setProfilePhone(e.target.value)} 
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: '15px', color: '#111827' }} 
                />
              </div>

              <div style={{ display: 'flex', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ flex: 2, padding: '10px 14px', borderRight: '1px solid #e5e7eb' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>Company name</label>
                  <input 
                    value={profileCompany} 
                    onChange={(e) => setProfileCompany(e.target.value)} 
                    style={{ width: '100%', border: 'none', outline: 'none', fontSize: '15px', color: '#111827' }} 
                  />
                </div>
                <div style={{ flex: 1, padding: '10px 14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>Role</label>
                  <input 
                    value={profileRole} 
                    onChange={(e) => setProfileRole(e.target.value)} 
                    style={{ width: '100%', border: 'none', outline: 'none', fontSize: '15px', color: '#111827' }} 
                  />
                </div>
              </div>

              <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#111827' }}>
                  <Icon d={ICONS.plus} size={14} />
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>Add custom field</span>
                </div>
                <Icon d={ICONS.help} size={16} color="#3b82f6" />
              </div>

              <div style={{ marginTop: '8px', borderTop: '1px dashed #e5e7eb', paddingTop: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#9ca3af', display: 'block', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>More options</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <button 
                        onClick={() => setIsManager(!isManager)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                      >
                        <Icon d={isManager ? ICONS.toggleOn : ICONS.toggleOff} size={32} color={isManager ? '#22c55e' : '#d1d5db'} />
                      </button>
                      <span style={{ fontSize: '15px', fontWeight: '600', color: '#374151' }}>Manager</span>
                      <Icon d={ICONS.help} size={16} color="#3b82f6" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <button 
                        onClick={() => setInviteToWorkspace(!inviteToWorkspace)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                      >
                        <Icon d={inviteToWorkspace ? ICONS.toggleOn : ICONS.toggleOff} size={32} color={inviteToWorkspace ? '#22c55e' : '#d1d5db'} />
                      </button>
                      <span style={{ fontSize: '15px', fontWeight: '600', color: '#374151' }}>Invite to workspace</span>
                      <Icon d={ICONS.help} size={16} color="#3b82f6" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* Create Task Set Modal */}
        {showTaskSetModal && (
          <Modal 
            title="Create task set" 
            onClose={() => setShowTaskSetModal(false)}
            footer={
              <>
                <button onClick={() => setShowTaskSetModal(false)} style={{ background: '#f3f4f6', border: 'none', padding: '10px 20px', borderRadius: '8px', color: '#4b5563', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleCreateTaskSet} style={{ background: '#22c55e', border: 'none', padding: '10px 20px', borderRadius: '8px', color: '#fff', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Create <Icon d={ICONS.arrowRight} size={16} color="#fff" />
                </button>
              </>
            }
          >
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>Tasks set name</label>
              <input autoFocus value={newTaskSetName} onChange={(e) => setNewTaskSetName(e.target.value)} placeholder="New task set" style={{ width: '100%', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', fontSize: '15px' }} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {TASK_SET_COLORS.map(color => (
                  <button key={color} onClick={() => setNewTaskSetColor(color)} style={{ width: '24px', height: '24px', borderRadius: '50%', background: color, border: newTaskSetColor === color ? '2px solid #000' : 'none', cursor: 'pointer', padding: 0 }} />
                ))}
              </div>
            </div>
            <div style={{ borderTop: '1px dashed #e5e7eb', paddingTop: '16px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280', display: 'block', marginBottom: '12px' }}>More options</span>
              <div style={{ position: 'relative' }}>
                <input disabled placeholder="Select template" style={{ width: '100%', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb', cursor: 'not-allowed', boxSizing: 'border-box' }} />
              </div>
            </div>
          </Modal>
        )}

        {/* Warning Delete Modal */}
        {showDeleteModal && (
          <Modal 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444' }}>
                <Icon d={ICONS.warning} size={24} color="#ef4444" />
                <span>Warning</span>
              </div>
            } 
            onClose={() => setShowDeleteModal(false)}
            width="440px"
          >
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.5', margin: '0 0 16px' }}>
                This task board and everything included within, unless un-checked from the list below will be permanently deleted.
              </p>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#1f2937', fontWeight: '600', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ width: '16px', height: '16px', accentColor: '#1f2937' }} />
                Time entries
              </label>
            </div>
            <p style={{ fontSize: '15px', fontWeight: '700', color: '#1f2937', marginBottom: '20px' }}>
              Are you sure you want to delete {currentBoard?.name}?
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowDeleteModal(false)} style={{ flex: 1, padding: '12px', background: '#1f2937', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>No</button>
              <button onClick={handleDeleteBoard} style={{ flex: 1, padding: '12px', background: '#1f2937', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Yes</button>
            </div>
          </Modal>
        )}

        {/* Create Task Modal */}
        {showTaskModal && (
          <Modal title="Create New Task" onClose={() => setShowTaskModal(false)}>
            <form onSubmit={handleCreateTask}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Task Name</label>
                <input autoFocus value={newTaskName} onChange={(e) => setNewTaskName(e.target.value)} placeholder="What needs to be done?" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Select Project</label>
                <select value={newTaskProject} onChange={(e) => setNewTaskProject(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', background: '#fff' }}>
                  <option value="">None (General)</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" style={{ width: '100%', padding: '10px', background: '#6d28d9', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Create Task</button>
            </form>
          </Modal>
        )}

        {showTaskDrawer && (
          <>
            {/* Overlay */}
            <div 
              onClick={() => setShowTaskDrawer(false)}
              style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.02)', zIndex: 9999
              }} 
            />
            
            {/* Drawer */}
            <div style={{
              position: 'fixed', top: 0, right: 0, bottom: 0,
              width: '460px', background: '#fff', zIndex: 10000,
              boxShadow: '-10px 0 40px rgba(0,0,0,0.05)',
              display: 'flex', flexDirection: 'column',
              borderLeft: '1px solid #f0f0f5',
              animation: 'slideIn 0.3s ease-out'
            }}>
              <style>{`
                @keyframes slideIn {
                  from { transform: translateX(100%); }
                  to { transform: translateX(0); }
                }
              `}</style>
              <TaskDrawer
                task={selectedTask}
                onUpdateTask={handleUpdateTaskInList}
                onOpenDatePicker={handleOpenDatePicker}
                onClose={() => setShowTaskDrawer(false)}
                members={user ? [{ ...user, id: user._id || user.id, name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() }, ...members] : members}
                activeViewFields={activeViewFields}
                allTasks={tasks}
                taskSets={taskSets}
                projects={projects}
              />
            </div>
          </>
        )}

        {/* Global Date Picker */}
        {datePickerState.show && (
          <>
            <div onClick={() => setDatePickerState({ ...datePickerState, show: false })} style={{ position: 'fixed', inset: 0, zIndex: 999998 }} />
            <div style={{
              position: 'fixed',
              top: Math.min(datePickerState.position.top, window.innerHeight - 560),
              left: Math.max(10, Math.min(datePickerState.position.left, window.innerWidth - 490)),
              zIndex: 999999,
            }}>
              <DatePicker
                value={datePickerState.value}
                onChange={handleDateChange}
                onClose={() => setDatePickerState({ ...datePickerState, show: false })}
                title={datePickerState.type === 'startDate' ? 'Start Date' : 'Due Date'}
                disabledDate={datePickerState.disabledDate}
              />
            </div>
          </>
        )}
      </div>
    </PlutioCopyLayout>
  );
};

export default Tasks;
