import axios from 'axios';

// Public booking API — no auth, no token. Used by /book/:slug.
const publicBookingClient = axios.create({
  baseURL: '/api/public/book',
  headers: { 'Content-Type': 'application/json' },
});

export const publicBookingAPI = {
  getHost: (slug) => publicBookingClient.get(`/${slug}`),
  getSlots: (slug, eventTypeId, date) =>
    publicBookingClient.get(`/${slug}/slots`, { params: { eventTypeId, date } }),
  getMonthSlots: (slug, eventTypeId, year, month) =>
    publicBookingClient.get(`/${slug}/slots-month`, { params: { eventTypeId, year, month } }),
  getMonthSlotsDetail: (slug, eventTypeId, year, month) =>
    publicBookingClient.get(`/${slug}/slots-month-detail`, { params: { eventTypeId, year, month } }),
  book: (slug, payload) => publicBookingClient.post(`/${slug}/book`, payload),
};

export default publicBookingClient;
