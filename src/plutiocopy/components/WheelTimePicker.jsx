import React, { useState, useRef, useEffect } from 'react';

/**
 * WheelTimePicker - An iOS-style vertical scroll time picker
 * 
 * @param {string} initialTime - Default time (e.g., "12:00 PM")
 * @param {function} onTimeChange - Callback when time changes
 */
const WheelTimePicker = ({ initialTime = "12:00 PM", onTimeChange }) => {
  const [hour, setHour] = useState(initialTime.split(':')[0] || '12');
  const [minute, setMinute] = useState(initialTime.split(':')[1]?.split(' ')[0] || '00');
  const [period, setPeriod] = useState(initialTime.split(' ')[1] || 'PM');

  const hourRef = useRef(null);
  const minRef = useRef(null);
  const periodRef = useRef(null);

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
  const periods = ['AM', 'PM'];

  const ITEM_HEIGHT = 40; // Height of each time item in px

  // Handle snapping and updating state on scroll
  const handleScroll = (ref, list, setter) => {
    if (!ref.current) return;
    const scrollTop = ref.current.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    if (list[index] && list[index] !== setter) {
      setter(list[index]);
    }
  };

  // Force 1-by-1 stepping on mouse wheel
  const handleWheel = (e, ref, list, selected, setter) => {
    e.preventDefault();
    const direction = e.deltaY > 0 ? 1 : -1;
    const currentIndex = list.indexOf(selected);
    const nextIndex = Math.max(0, Math.min(list.length - 1, currentIndex + direction));
    
    if (currentIndex !== nextIndex) {
      setter(list[nextIndex]);
      if (ref.current) {
        ref.current.scrollTo({
          top: nextIndex * ITEM_HEIGHT,
          behavior: 'smooth'
        });
      }
    }
  };

  // Sync state changes back to parent
  useEffect(() => {
    if (onTimeChange) {
      onTimeChange(`${hour}:${minute} ${period}`);
    }
  }, [hour, minute, period]);

  // Initial scroll positioning
  useEffect(() => {
    const scrollToInitial = (ref, val, list) => {
      const idx = list.indexOf(val);
      if (ref.current && idx !== -1) {
        ref.current.scrollTop = idx * ITEM_HEIGHT;
      }
    };
    scrollToInitial(hourRef, hour, hours);
    scrollToInitial(minRef, minute, minutes);
    scrollToInitial(periodRef, period, periods);
  }, []);

  const ScrollColumn = ({ items, selectedValue, setter, innerRef, type }) => (
    <div 
      ref={innerRef}
      onScroll={() => handleScroll(innerRef, items, setter)}
      onWheel={(e) => handleWheel(e, innerRef, items, selectedValue, setter)}
      className="hide-scrollbar"
      style={{
        flex: 1,
        height: ITEM_HEIGHT * 5, // Show 5 items at once
        overflowY: 'auto',
        scrollSnapType: 'y mandatory',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      {/* Top Padding to center the first item */}
      <div style={{ height: ITEM_HEIGHT * 2, flexShrink: 0 }} />
      
      {items.map((item) => (
        <div
          key={item}
          style={{
            height: ITEM_HEIGHT,
            lineHeight: `${ITEM_HEIGHT}px`,
            fontSize: selectedValue === item ? '18px' : '15px',
            fontWeight: selectedValue === item ? '700' : '400',
            color: selectedValue === item ? '#111827' : '#9ca3af',
            transition: 'all 0.2s ease',
            scrollSnapAlign: 'center',
            scrollSnapStop: 'always',
            cursor: 'pointer',
            width: '100%',
            textAlign: 'center',
            zIndex: 2
          }}
          onClick={() => {
            setter(item);
            innerRef.current.scrollTo({ top: items.indexOf(item) * ITEM_HEIGHT, behavior: 'smooth' });
          }}
        >
          {item}
        </div>
      ))}
      
      {/* Bottom Padding to center the last item */}
      <div style={{ height: ITEM_HEIGHT * 2, flexShrink: 0 }} />
    </div>
  );

  return (
    <div style={{
      width: '260px',
      background: '#fff',
      borderRadius: '16px',
      padding: '12px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
      position: 'relative',
      userSelect: 'none',
      display: 'flex',
      overflow: 'hidden',
      border: '1px solid #f3f4f6'
    }}>
      {/* Top & Bottom Fade Effects */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '40px',
        background: 'linear-gradient(to bottom, rgba(255,255,255,1), rgba(255,255,255,0))',
        zIndex: 5, pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '40px',
        background: 'linear-gradient(to top, rgba(255,255,255,1), rgba(255,255,255,0))',
        zIndex: 5, pointerEvents: 'none'
      }} />

      {/* Centered Selection Bar */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '12px',
        right: '12px',
        height: ITEM_HEIGHT,
        background: '#f5f3ff',
        borderRadius: '8px',
        transform: 'translateY(-50%)',
        zIndex: 1,
        border: '1px solid #ddd6fe'
      }} />

      <ScrollColumn items={hours} selectedValue={hour} setter={setHour} innerRef={hourRef} type="hour" />
      <ScrollColumn items={minutes} selectedValue={minute} setter={setMinute} innerRef={minRef} type="minute" />
      <ScrollColumn items={periods} selectedValue={period} setter={setPeriod} innerRef={periodRef} type="period" />

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default WheelTimePicker;
