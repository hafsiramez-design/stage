// db.js — Hybrid Client with Centralized API + Bulletproof Offline Fallback
import { SERVER_URL } from '../config/api';
import { COUNTRIES } from '../data/countries';

// In-Memory Local Fallback Store
const fallbackStore = {
  users: [
    {
      id: 'usr_admin_seed',
      email: 'hafsiramez@gmail.com',
      username: 'AdminRamez',
      password: 'hafsi0123',
      role: 'admin',
      status: 'active',
      photo: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr_client_seed',
      email: 'ramezhafsi16@gmail.com',
      username: 'ClientRamez',
      password: 'hafsi0123',
      role: 'client',
      status: 'active',
      photo: null,
      createdAt: new Date().toISOString(),
    },
  ],
  events: [
    { id: 'fr1', countryId: 'fr', title: 'Paris Fashion Week', date: 'Sep 23, 2025', location: 'Paris', category: 'Fashion', description: "The world's most prestigious fashion event.", photo: null },
    { id: 'fr2', countryId: 'fr', title: 'Cannes Film Festival', date: 'May 14, 2025', location: 'Cannes', category: 'Culture', description: "International film festival celebrating cinema.", photo: null },
    { id: 'us1', countryId: 'us', title: 'Coachella Valley Music Festival', date: 'Apr 11, 2025', location: 'California', category: 'Music', description: 'Iconic annual music festival.', photo: null },
  ],
  countries: COUNTRIES,
  subscriptions: [],
  messages: [],
  comments: [],
  reactions: {},
};

const STORAGE_KEY = 'WORLD_EVENTS_PERSISTENT_STORE_V1';

export function saveFallbackStore() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fallbackStore));
    }
  } catch (e) {
    console.warn('Could not save fallbackStore to localStorage:', e);
  }
}

export function loadFallbackStore() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.users && Array.isArray(parsed.users)) {
          parsed.users.forEach(u => {
            if (!fallbackStore.users.some(existing => existing.id === u.id || existing.email === u.email)) {
              fallbackStore.users.push(u);
            }
          });
        }
        if (parsed.events && Array.isArray(parsed.events)) {
          parsed.events.forEach(ev => {
            if (!fallbackStore.events.some(existing => existing.id === ev.id)) {
              fallbackStore.events.push(ev);
            }
          });
        }
        if (parsed.subscriptions && Array.isArray(parsed.subscriptions)) {
          fallbackStore.subscriptions = parsed.subscriptions;
        }
        if (parsed.messages && Array.isArray(parsed.messages)) {
          fallbackStore.messages = parsed.messages;
        }
        if (parsed.comments && Array.isArray(parsed.comments)) {
          fallbackStore.comments = parsed.comments;
        }
        if (parsed.reactions && typeof parsed.reactions === 'object') {
          fallbackStore.reactions = parsed.reactions;
        }
      }
    }
  } catch (e) {
    console.warn('Could not load fallbackStore from localStorage:', e);
  }
}

// Auto-load persisted store immediately
loadFallbackStore();

async function apiCall(endpoint, options = {}, useFallback = true) {
  const url = `${SERVER_URL}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  // Strip base64 photo data from body before sending to prevent Android OOM crash
  if (config.body && typeof config.body === 'object') {
    const bodyCopy = { ...config.body };
    if (bodyCopy.photo && typeof bodyCopy.photo === 'string' && bodyCopy.photo.startsWith('data:image')) {
      bodyCopy.photo = null; // Never send base64 to server — store only on device
    }
    config.body = JSON.stringify(bodyCopy);
  }

  // 15 second timeout to handle Render.com cloud cold starts
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  config.signal = controller.signal;

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);
    if (!response.ok) {
      const errText = await response.text();
      let errJson;
      try { errJson = JSON.parse(errText); } catch { errJson = { error: errText }; }
      return errJson;
    }
    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (useFallback) {
      return { _isFallback: true };
    }
    throw error;
  }
}

export async function getDatabase() {
  const res = await apiCall('/api/users');
  if (res._isFallback) {
    return fallbackStore;
  }
  const [eventsRes, countriesRes, subsRes] = await Promise.all([
    apiCall('/api/events'),
    apiCall('/api/countries'),
    apiCall('/api/subscriptions'),
  ]);
  return {
    users: res.users || [],
    events: eventsRes.events || [],
    countries: countriesRes.countries || [],
    subscriptions: subsRes.subscriptions || [],
    messages: [],
  };
}

export async function initDatabase() {
  loadFallbackStore();
  const res = await apiCall('/api/users');
  if (!res._isFallback && res.users && Array.isArray(res.users)) {
    res.users.forEach(u => {
      if (!fallbackStore.users.some(existing => existing.id === u.id || existing.email === u.email)) {
        fallbackStore.users.push(u);
      }
    });
    saveFallbackStore();
  }
  console.log('Database client initialized with server connection and persistent store');
}

// ═══════════════════════════════════════════════════════════════
// COUNTRIES
// ═══════════════════════════════════════════════════════════════
export async function getAllCountriesWithEvents() {
  const res = await apiCall('/api/countries');
  if (res._isFallback || !res.countries) {
    return fallbackStore.countries.map(c => ({
      ...c,
      events: fallbackStore.events.filter(e => e.countryId === c.id),
    }));
  }
  return res.countries;
}

export async function getOrCreateCountryId(countryName) {
  const res = await apiCall('/api/countries/get-or-create', {
    method: 'POST',
    body: { name: countryName },
  });
  if (res._isFallback || !res.id) {
    const norm = (countryName || '').trim().toLowerCase();
    const existing = fallbackStore.countries.find(c => c.name.toLowerCase() === norm);
    if (existing) return existing.id;
    const id = 'c_' + Date.now();
    fallbackStore.countries.push({ id, name: countryName.trim(), flag: '📍', flagColors: ['#6C3FFF', '#2E1E66'] });
    saveFallbackStore();
    return id;
  }
  return res.id;
}

// ═══════════════════════════════════════════════════════════════
// EVENTS
// ═══════════════════════════════════════════════════════════════
export async function getAllEvents() {
  const res = await apiCall('/api/events');
  if (res._isFallback || !res.events) return fallbackStore.events;
  return res.events;
}

export async function getEventsByCountryId(countryId) {
  const res = await apiCall(`/api/events?countryId=${encodeURIComponent(countryId)}`);
  if (res._isFallback || !res.events) return fallbackStore.events.filter(e => e.countryId === countryId);
  return res.events;
}

export async function getEventByDate(date) {
  const res = await apiCall(`/api/events?date=${encodeURIComponent(date)}`);
  if (res._isFallback) return fallbackStore.events.find(e => e.date === date) || null;
  return res.event || null;
}

export async function getEventsByCategory(category) {
  const res = await apiCall(`/api/events?category=${encodeURIComponent(category)}`);
  if (res._isFallback || !res.events) {
    if (category === 'All') return fallbackStore.events;
    return fallbackStore.events.filter(e => e.category === category);
  }
  return res.events;
}

export async function addEvent({ countryId, title, date, location, latitude = null, longitude = null, category, description, photo = null }) {
  // photo can be a local URI (file://) or base64 — never send raw base64 to server (handled in apiCall)
  const res = await apiCall('/api/events', {
    method: 'POST',
    body: { countryId, title, date, location, latitude, longitude, category, description, photo },
  });
  if (res.error === 'DATE_EXISTS') throw new Error('DATE_EXISTS');
  if (res._isFallback) {
    const existing = fallbackStore.events.find(e => e.date === date);
    if (existing) throw new Error('DATE_EXISTS');
    const id = 'ev_' + Date.now();
    const photoToStore = photo && photo.startsWith('data:image') ? null : photo;
    const newEv = { id, countryId, title, date, location, latitude, longitude, category, description, photo: photoToStore };
    fallbackStore.events.push(newEv);
    saveFallbackStore();
    return id;
  }
  if (!res.success) throw new Error(res.error || 'Failed to add event');
  return res.id;
}

export async function updateEvent({ id, countryId, title, date, location, latitude = null, longitude = null, category, description, photo }) {
  const res = await apiCall(`/api/events/${id}`, {
    method: 'PUT',
    body: { countryId, title, date, location, latitude, longitude, category, description, photo },
  });
  if (res._isFallback) {
    const idx = fallbackStore.events.findIndex(e => e.id === id);
    if (idx !== -1) {
      fallbackStore.events[idx] = { ...fallbackStore.events[idx], countryId, title, date, location, latitude, longitude, category, description, photo };
      saveFallbackStore();
    }
    return true;
  }
  return res.success;
}

export async function deleteEvent(eventId) {
  const res = await apiCall(`/api/events/${eventId}`, { method: 'DELETE' });
  if (res._isFallback) {
    const ev = fallbackStore.events.find(e => e.id === eventId);
    fallbackStore.events = fallbackStore.events.filter(e => e.id !== eventId);
    saveFallbackStore();
    return ev || true;
  }
  return res.event || true;
}

// ═══════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════
export async function registerUser({ email, username, photo, password, role = 'client' }) {
  const normEmail = email.trim().toLowerCase();
  const id = 'usr_' + Date.now();
  const user = { id, email: normEmail, username: username.trim(), photo, password, role, status: 'active', createdAt: new Date().toISOString() };

  // Always save user into local persistent fallback store so it is remembered locally immediately
  if (!fallbackStore.users.some(u => u.email === normEmail)) {
    fallbackStore.users.push(user);
    saveFallbackStore();
  }

  const res = await apiCall('/api/auth/register', {
    method: 'POST',
    body: { email, username, photo, password, role },
  });
  if (res.error === 'EMAIL_EXISTS') throw new Error('EMAIL_EXISTS');
  if (res.error === 'USERNAME_EXISTS') throw new Error('USERNAME_EXISTS');
  if (res._isFallback) {
    return id;
  }
  if (!res.success) throw new Error(res.error || 'Registration failed');
  return res.id;
}

export async function getUserByEmail(email) {
  const normEmail = (email || '').trim().toLowerCase();
  const res = await apiCall('/api/auth/login', {
    method: 'POST',
    body: { email: normEmail },
  });
  if (res._isFallback || !res.user) {
    return fallbackStore.users.find(u => u.email === normEmail) || null;
  }
  return res.user;
}

export async function getUserById(id) {
  const res = await apiCall(`/api/users/${id}`);
  if (res._isFallback || !res.user) {
    return fallbackStore.users.find(u => u.id === id) || null;
  }
  return res.user;
}

export async function getAllUsers() {
  const res = await apiCall('/api/users');
  if (res._isFallback || !res.users) return fallbackStore.users;
  return res.users;
}

export async function getAllClientEmails() {
  const res = await apiCall('/api/users/client-emails');
  if (res._isFallback || !res.emails) {
    const emails = fallbackStore.users
      .filter(u => (u.role === 'client' || !u.role) && u.email)
      .map(u => u.email.trim().toLowerCase());
    return Array.from(new Set(emails));
  }
  const emails = res.emails
    .filter(Boolean)
    .map(e => e.trim().toLowerCase());
  return Array.from(new Set(emails));
}

export async function updateUserProfile(userId, { username, password, photo }) {
  const idx = fallbackStore.users.findIndex(u => u.id === userId);
  if (idx !== -1) {
    if (username) fallbackStore.users[idx].username = username.trim();
    if (password) fallbackStore.users[idx].password = password;
    if (photo !== undefined) fallbackStore.users[idx].photo = photo;
    saveFallbackStore();
  }

  const res = await apiCall(`/api/users/${userId}`, {
    method: 'PUT',
    body: { username, password, photo },
  });
  if (res._isFallback || !res.user) {
    return idx !== -1 ? fallbackStore.users[idx] : null;
  }
  return res.user;
}

export async function updateUserPassword(email, newPassword) {
  const idx = fallbackStore.users.findIndex(u => u.email === (email || '').trim().toLowerCase());
  if (idx !== -1) {
    fallbackStore.users[idx].password = newPassword;
    saveFallbackStore();
  }

  const res = await apiCall('/api/users/password-by-email', {
    method: 'POST',
    body: { email, newPassword },
  });
  if (res._isFallback || !res.user) {
    return idx !== -1 ? fallbackStore.users[idx] : null;
  }
  return res.user;
}

export async function closeUserAccount(userId) {
  const res = await apiCall(`/api/users/${userId}/close`, { method: 'PUT' });
  if (res._isFallback) {
    const idx = fallbackStore.users.findIndex(u => u.id === userId);
    if (idx !== -1) { fallbackStore.users[idx].status = 'closed'; saveFallbackStore(); return true; }
    return false;
  }
  return res.success;
}

export async function activateUserAccount(userId) {
  const res = await apiCall(`/api/users/${userId}/activate`, { method: 'PUT' });
  if (res._isFallback) {
    const idx = fallbackStore.users.findIndex(u => u.id === userId);
    if (idx !== -1) { fallbackStore.users[idx].status = 'active'; saveFallbackStore(); return true; }
    return false;
  }
  return res.success;
}

export async function getAdminUser() {
  const res = await apiCall('/api/users/admin');
  if (res._isFallback || !res.user) {
    return fallbackStore.users.find(u => u.role === 'admin') || null;
  }
  return res.user;
}

export async function getAllAdmins() {
  const res = await apiCall('/api/users/admins');
  if (res._isFallback || !res.admins) {
    return fallbackStore.users.filter(u => u.role === 'admin');
  }
  return res.admins;
}

// ═══════════════════════════════════════════════════════════════
// SUBSCRIPTIONS
// ═══════════════════════════════════════════════════════════════
export async function subscribeToEvent({ userId, eventId, username, userEmail, eventTitle }) {
  const res = await apiCall('/api/subscriptions', {
    method: 'POST',
    body: { userId, eventId, username, userEmail, eventTitle },
  });
  if (res._isFallback) {
    const existing = fallbackStore.subscriptions.find(s => s.userId === userId && s.eventId === eventId);
    if (!existing) {
      fallbackStore.subscriptions.push({
        id: 'sub_' + Date.now(), userId, eventId, username: username || '', userEmail: userEmail || '', eventTitle: eventTitle || '',
        status: 'pending', createdAt: new Date().toISOString(),
      });
      saveFallbackStore();
    }
    return true;
  }
  return res.success;
}

export async function getAllSubscriptions() {
  const res = await apiCall('/api/subscriptions?status=pending');
  if (res._isFallback || !res.subscriptions) {
    return fallbackStore.subscriptions.filter(s => s.status === 'pending');
  }
  return res.subscriptions;
}

export async function updateSubscriptionStatus(subId, status) {
  const res = await apiCall(`/api/subscriptions/${subId}`, {
    method: 'PUT',
    body: { status },
  });
  if (res._isFallback || !res.subscription) {
    const idx = fallbackStore.subscriptions.findIndex(s => s.id === subId);
    if (idx !== -1) { fallbackStore.subscriptions[idx].status = status; saveFallbackStore(); return fallbackStore.subscriptions[idx]; }
    return null;
  }
  return res.subscription;
}

export async function getUserSubscriptionStatus({ userId, eventId }) {
  const res = await apiCall(`/api/subscriptions?userId=${encodeURIComponent(userId)}&eventId=${encodeURIComponent(eventId)}`);
  if (res._isFallback) {
    const sub = fallbackStore.subscriptions.find(s => s.userId === userId && s.eventId === eventId);
    return sub ? sub.status : null;
  }
  return res.status || null;
}

export async function unsubscribeFromEvent({ userId, eventId }) {
  const res = await apiCall(`/api/subscriptions?userId=${encodeURIComponent(userId)}&eventId=${encodeURIComponent(eventId)}`, { method: 'DELETE' });
  if (res._isFallback) {
    fallbackStore.subscriptions = fallbackStore.subscriptions.filter(s => !(s.userId === userId && s.eventId === eventId));
    saveFallbackStore();
    return true;
  }
  return res.success;
}

export async function isUserSubscribed({ userId, eventId }) {
  const res = await apiCall(`/api/subscriptions/check?userId=${encodeURIComponent(userId)}&eventId=${encodeURIComponent(eventId)}`);
  if (res._isFallback) {
    return fallbackStore.subscriptions.some(s => s.userId === userId && s.eventId === eventId);
  }
  return res.isSubscribed || false;
}

export async function getSubscriberEmailsForEvent(eventId) {
  const res = await apiCall(`/api/subscriptions/emails/${eventId}`);
  if (res._isFallback || !res.emails) {
    return fallbackStore.subscriptions.filter(s => s.eventId === eventId && s.status === 'accepted').map(s => s.userEmail).filter(Boolean);
  }
  return res.emails;
}

// ═══════════════════════════════════════════════════════════════
// MESSAGES
// ═══════════════════════════════════════════════════════════════
export async function addMessage({ senderId, receiverId, text }) {
  const res = await apiCall('/api/messages', { method: 'POST', body: { senderId, receiverId, text } });
  if (res._isFallback || !res.message) {
    const msg = { id: 'msg_' + Date.now(), senderId, receiverId, text, read: false, createdAt: new Date().toISOString() };
    fallbackStore.messages.push(msg);
    saveFallbackStore();
    return msg;
  }
  return res.message;
}

export async function getMessagesBetweenUsers(userId1, userId2) {
  const res = await apiCall(`/api/messages?user1=${encodeURIComponent(userId1)}&user2=${encodeURIComponent(userId2)}`);
  if (res._isFallback || !res.messages) {
    return fallbackStore.messages.filter(m => (m.senderId === userId1 && m.receiverId === userId2) || (m.senderId === userId2 && m.receiverId === userId1));
  }
  return res.messages;
}

export async function markMessagesAsRead({ senderId, receiverId }) {
  const res = await apiCall('/api/messages/mark-read', { method: 'POST', body: { senderId, receiverId } });
  if (res._isFallback) {
    let updated = false;
    fallbackStore.messages.forEach(m => {
      if (m.senderId === senderId && m.receiverId === receiverId && !m.read) {
        m.read = true;
        updated = true;
      }
    });
    if (updated) saveFallbackStore();
    return true;
  }
  return res.success || true;
}

export async function getUnreadMessageCounts(userId) {
  if (!userId) return { counts: {}, total: 0 };
  const res = await apiCall(`/api/messages/unread-counts?userId=${encodeURIComponent(userId)}`);
  if (res._isFallback || !res.counts) {
    const unread = fallbackStore.messages.filter(m => m.receiverId === userId && !m.read);
    const counts = {};
    unread.forEach(m => {
      counts[m.senderId] = (counts[m.senderId] || 0) + 1;
    });
    return { counts, total: unread.length };
  }
  return { counts: res.counts || {}, total: res.total || 0 };
}

// ═══════════════════════════════════════════════════════════════
// COMMENTS & REACTIONS
// ═══════════════════════════════════════════════════════════════
export async function getCommentsForEvent(eventId) {
  const res = await apiCall(`/api/comments/${eventId}`);
  if (res._isFallback || !res.comments) {
    return (fallbackStore.comments || []).filter(c => c.eventId === eventId);
  }
  return res.comments;
}

export async function addCommentForEvent({ eventId, username, userPhoto = null, text }) {
  const res = await apiCall('/api/comments', { method: 'POST', body: { eventId, username, userPhoto, text } });
  if (res._isFallback || !res.comment) {
    if (!fallbackStore.comments) fallbackStore.comments = [];
    const comment = { id: 'comm_' + Date.now(), eventId, username, userPhoto, text, createdAt: new Date().toISOString() };
    fallbackStore.comments.push(comment);
    saveFallbackStore();
    return comment;
  }
  return res.comment;
}

export async function getReactionsForEvent(eventId) {
  const res = await apiCall(`/api/reactions/${eventId}`);
  if (res._isFallback || !res.reactions) {
    if (!fallbackStore.reactions) fallbackStore.reactions = {};
    return fallbackStore.reactions[eventId] || { Like: 0, Love: 0, Haha: 0, Wow: 0, Sad: 0, Angry: 0 };
  }
  return res.reactions;
}

export async function addReactionForEvent({ eventId, reactionType }) {
  const res = await apiCall('/api/reactions', { method: 'POST', body: { eventId, reactionType } });
  if (res._isFallback || !res.reactions) {
    if (!fallbackStore.reactions) fallbackStore.reactions = {};
    if (!fallbackStore.reactions[eventId]) fallbackStore.reactions[eventId] = { Like: 0, Love: 0, Haha: 0, Wow: 0, Sad: 0, Angry: 0 };
    fallbackStore.reactions[eventId][reactionType] = (fallbackStore.reactions[eventId][reactionType] || 0) + 1;
    saveFallbackStore();
    return fallbackStore.reactions[eventId];
  }
  return res.reactions;
}
