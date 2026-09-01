const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// ═══════════════════════════════════════════════════════════════════
// DATABASE — JSON file-based persistent storage
// ═══════════════════════════════════════════════════════════════════
const DB_PATH = path.join(__dirname, 'database.json');

const DEFAULT_COUNTRIES = [
  { id:'fr', name:'France', flag:'🇫🇷', flagColors:['#002395','#ED2939','#FFFFFF'] },
  { id:'br', name:'Brazil', flag:'🇧🇷', flagColors:['#009C3B','#FEDF00','#002776'] },
  { id:'jp', name:'Japan', flag:'🇯🇵', flagColors:['#BC002D','#FFFFFF','#BC002D'] },
  { id:'us', name:'USA', flag:'🇺🇸', flagColors:['#3C3B6E','#B22234','#FFFFFF'] },
  { id:'de', name:'Germany', flag:'🇩🇪', flagColors:['#DD0000','#FFCE00','#000000'] },
  { id:'it', name:'Italy', flag:'🇮🇹', flagColors:['#009246','#CE2B37','#FFFFFF'] },
  { id:'gb', name:'United Kingdom', flag:'🇬🇧', flagColors:['#012169','#C8102E','#FFFFFF'] },
  { id:'ca', name:'Canada', flag:'🇨🇦', flagColors:['#FF0000','#FFFFFF','#FF0000'] },
  { id:'au', name:'Australia', flag:'🇦🇺', flagColors:['#00008B','#CC0000','#FFFFFF'] },
  { id:'mx', name:'Mexico', flag:'🇲🇽', flagColors:['#006847','#CE1126','#FFFFFF'] },
  { id:'kr', name:'South Korea', flag:'🇰🇷', flagColors:['#CD2E3A','#003478','#FFFFFF'] },
  { id:'sa', name:'Saudi Arabia', flag:'🇸🇦', flagColors:['#006C35','#FFFFFF','#006C35'] },
];

const DEFAULT_EVENTS = [
  { id:'fr1', countryId:'fr', title:'Paris Fashion Week', date:'Sep 23, 2025', location:'Paris', category:'Fashion', description:"The world's most prestigious fashion event.", photo:null, latitude:48.8566, longitude:2.3522 },
  { id:'fr2', countryId:'fr', title:'Cannes Film Festival', date:'May 14, 2025', location:'Cannes', category:'Culture', description:"International film festival celebrating cinema.", photo:null, latitude:43.5528, longitude:7.0174 },
  { id:'fr3', countryId:'fr', title:'Tour de France', date:'Jul 5, 2025', location:'Nationwide', category:'Sports', description:'The most prestigious cycling race in the world.', photo:null, latitude:48.8566, longitude:2.3522 },
  { id:'fr4', countryId:'fr', title:'Bastille Day Celebration', date:'Jul 14, 2025', location:'Paris', category:'National', description:"France's National Day with fireworks.", photo:null, latitude:48.8566, longitude:2.3522 },
  { id:'br1', countryId:'br', title:'Rio Carnival', date:'Feb 28, 2025', location:'Rio de Janeiro', category:'Festival', description:"The world's biggest carnival.", photo:null, latitude:-22.9068, longitude:-43.1729 },
  { id:'br2', countryId:'br', title:'São Paulo Art Biennial', date:'Sep 6, 2025', location:'São Paulo', category:'Art', description:'Important contemporary art event.', photo:null, latitude:-23.5505, longitude:-46.6333 },
  { id:'br3', countryId:'br', title:'Amazon Film Festival', date:'Nov 10, 2025', location:'Manaus', category:'Culture', description:'Film festival celebrating Amazonian culture.', photo:null, latitude:-3.119, longitude:-60.0217 },
  { id:'br4', countryId:'br', title:'Lollapalooza Brasil', date:'Mar 28, 2025', location:'São Paulo', category:'Music', description:'Massive rock and pop music festival.', photo:null, latitude:-23.5505, longitude:-46.6333 },
  { id:'jp1', countryId:'jp', title:'Cherry Blossom Festival', date:'Mar 25, 2025', location:'Tokyo', category:'Nature', description:'Hanami season celebrated across Japan.', photo:null, latitude:35.6762, longitude:139.6503 },
  { id:'jp2', countryId:'jp', title:'Gion Matsuri', date:'Jul 1, 2025', location:'Kyoto', category:'Festival', description:"One of Japan's most famous festivals.", photo:null, latitude:35.0116, longitude:135.7681 },
  { id:'jp3', countryId:'jp', title:'Tokyo Game Show', date:'Sep 25, 2025', location:'Tokyo', category:'Technology', description:'Biggest video game expo in Asia.', photo:null, latitude:35.6762, longitude:139.6503 },
  { id:'jp4', countryId:'jp', title:'Fuji Rock Festival', date:'Jul 25, 2025', location:'Niigata', category:'Music', description:"Japan's premier outdoor music festival.", photo:null, latitude:36.9375, longitude:138.8569 },
  { id:'us1', countryId:'us', title:'Coachella Valley Music Festival', date:'Apr 11, 2025', location:'California', category:'Music', description:'Iconic annual music and arts festival.', photo:null, latitude:33.6803, longitude:-116.2379 },
  { id:'us2', countryId:'us', title:'Super Bowl LIX', date:'Feb 9, 2025', location:'New Orleans', category:'Sports', description:"NFL championship game.", photo:null, latitude:29.9511, longitude:-90.0715 },
  { id:'us3', countryId:'us', title:'New York Fashion Week', date:'Feb 7, 2025', location:'New York', category:'Fashion', description:"Top fashion houses runway shows.", photo:null, latitude:40.7128, longitude:-74.006 },
  { id:'us4', countryId:'us', title:'Sundance Film Festival', date:'Jan 23, 2025', location:'Utah', category:'Culture', description:'Most important independent film festival.', photo:null, latitude:40.6461, longitude:-111.498 },
  { id:'de1', countryId:'de', title:'Oktoberfest', date:'Sep 20, 2025', location:'Munich', category:'Festival', description:"World's largest beer festival.", photo:null, latitude:48.1351, longitude:11.582 },
  { id:'de2', countryId:'de', title:'Berlin Film Festival', date:'Feb 13, 2025', location:'Berlin', category:'Culture', description:'Leading world film festival.', photo:null, latitude:52.52, longitude:13.405 },
  { id:'de3', countryId:'de', title:'Christmas Markets', date:'Nov 28, 2025', location:'Nationwide', category:'Festival', description:"Germany's magical Christmas markets.", photo:null, latitude:50.1109, longitude:8.6821 },
  { id:'de4', countryId:'de', title:'Rock am Ring', date:'Jun 6, 2025', location:'Nürburg', category:'Music', description:"Europe's biggest rock music festival.", photo:null, latitude:50.3325, longitude:6.9431 },
  { id:'it1', countryId:'it', title:'Venice Carnival', date:'Feb 22, 2025', location:'Venice', category:'Festival', description:'World-famous carnival with masquerade balls.', photo:null, latitude:45.4408, longitude:12.3155 },
  { id:'it2', countryId:'it', title:'Venice Biennale', date:'May 10, 2025', location:'Venice', category:'Art', description:"World's most prestigious contemporary art exhibition.", photo:null, latitude:45.4408, longitude:12.3155 },
  { id:'it3', countryId:'it', title:'Milan Fashion Week', date:'Sep 16, 2025', location:'Milan', category:'Fashion', description:"Italy's premier fashion event.", photo:null, latitude:45.4642, longitude:9.19 },
  { id:'it4', countryId:'it', title:'Palio di Siena', date:'Jul 2, 2025', location:'Siena', category:'Sports', description:'Thrilling medieval horse race.', photo:null, latitude:43.3188, longitude:11.3308 },
  { id:'gb1', countryId:'gb', title:'Glastonbury Festival', date:'Jun 25, 2025', location:'Somerset', category:'Music', description:'Most iconic music festival in the world.', photo:null, latitude:51.1537, longitude:-2.5859 },
  { id:'gb2', countryId:'gb', title:'Wimbledon Championships', date:'Jun 30, 2025', location:'London', category:'Sports', description:'Most prestigious tennis Grand Slam.', photo:null, latitude:51.4341, longitude:-0.2143 },
  { id:'gb3', countryId:'gb', title:'Notting Hill Carnival', date:'Aug 25, 2025', location:'London', category:'Festival', description:"Europe's biggest street festival.", photo:null, latitude:51.5172, longitude:-0.2047 },
  { id:'gb4', countryId:'gb', title:'Edinburgh Fringe Festival', date:'Aug 1, 2025', location:'Edinburgh', category:'Arts', description:"World's largest arts festival.", photo:null, latitude:55.9533, longitude:-3.1883 },
  { id:'ca1', countryId:'ca', title:'Toronto Int. Film Festival', date:'Sep 4, 2025', location:'Toronto', category:'Culture', description:'Major awards season launch pad.', photo:null, latitude:43.6532, longitude:-79.3832 },
  { id:'ca2', countryId:'ca', title:'Montreal Jazz Festival', date:'Jun 26, 2025', location:'Montreal', category:'Music', description:"World's largest jazz festival.", photo:null, latitude:45.5017, longitude:-73.5673 },
  { id:'ca3', countryId:'ca', title:'Calgary Stampede', date:'Jul 4, 2025', location:'Calgary', category:'Festival', description:'Greatest outdoor show on Earth.', photo:null, latitude:51.0447, longitude:-114.0719 },
  { id:'ca4', countryId:'ca', title:'Ottawa Tulip Festival', date:'May 9, 2025', location:'Ottawa', category:'Nature', description:"North America's largest tulip festival.", photo:null, latitude:45.4215, longitude:-75.6972 },
  { id:'au1', countryId:'au', title:'Australian Open', date:'Jan 12, 2025', location:'Melbourne', category:'Sports', description:'First Grand Slam of the year.', photo:null, latitude:-37.8136, longitude:144.9631 },
  { id:'au2', countryId:'au', title:'Sydney Festival', date:'Jan 8, 2025', location:'Sydney', category:'Arts', description:'Major arts festival in Sydney.', photo:null, latitude:-33.8688, longitude:151.2093 },
  { id:'au3', countryId:'au', title:'Vivid Sydney', date:'May 23, 2025', location:'Sydney', category:'Festival', description:"World's largest festival of light.", photo:null, latitude:-33.8688, longitude:151.2093 },
  { id:'au4', countryId:'au', title:'Melbourne Cup', date:'Nov 4, 2025', location:'Melbourne', category:'Sports', description:"The race that stops a nation.", photo:null, latitude:-37.8136, longitude:144.9631 },
  { id:'mx1', countryId:'mx', title:'Day of the Dead', date:'Nov 1, 2025', location:'Nationwide', category:'National', description:"Mexico's most iconic celebration.", photo:null, latitude:19.4326, longitude:-99.1332 },
  { id:'mx2', countryId:'mx', title:'Guelaguetza Festival', date:'Jul 21, 2025', location:'Oaxaca', category:'Festival', description:'Celebration of indigenous cultures.', photo:null, latitude:17.0732, longitude:-96.7266 },
  { id:'mx3', countryId:'mx', title:'Mexico City Book Fair', date:'Nov 22, 2025', location:'Mexico City', category:'Culture', description:'Important book fair in Spanish-speaking world.', photo:null, latitude:19.4326, longitude:-99.1332 },
  { id:'mx4', countryId:'mx', title:'Mariachi Festival', date:'Sep 1, 2025', location:'Guadalajara', category:'Music', description:"World's largest gathering of mariachi musicians.", photo:null, latitude:20.6597, longitude:-103.3496 },
  { id:'kr1', countryId:'kr', title:'Busan Int. Film Festival', date:'Oct 1, 2025', location:'Busan', category:'Culture', description:"Asia's premier film festival.", photo:null, latitude:35.1796, longitude:129.0756 },
  { id:'kr2', countryId:'kr', title:'Cherry Blossom Jinhae', date:'Apr 1, 2025', location:'Jinhae', category:'Nature', description:"Korea's largest cherry blossom festival.", photo:null, latitude:35.1553, longitude:128.6645 },
  { id:'kr3', countryId:'kr', title:'K-Pop World Festival', date:'Oct 15, 2025', location:'Seoul', category:'Music', description:'Global K-Pop competition.', photo:null, latitude:37.5665, longitude:126.978 },
  { id:'kr4', countryId:'kr', title:'Seoul Lantern Festival', date:'Nov 1, 2025', location:'Seoul', category:'Festival', description:'Colorful lanterns on Cheonggyecheon Stream.', photo:null, latitude:37.5665, longitude:126.978 },
  { id:'sa1', countryId:'sa', title:'Riyadh Season', date:'Oct 1, 2025', location:'Riyadh', category:'Festival', description:'Massive entertainment festival.', photo:null, latitude:24.7136, longitude:46.6753 },
  { id:'sa2', countryId:'sa', title:'F1 Saudi Arabian Grand Prix', date:'Mar 21, 2025', location:'Jeddah', category:'Sports', description:'Thrilling night race.', photo:null, latitude:21.4858, longitude:39.1925 },
  { id:'sa3', countryId:'sa', title:'Janadriyah Festival', date:'Feb 1, 2025', location:'Riyadh', category:'Culture', description:"Saudi Arabia's largest national festival.", photo:null, latitude:24.7136, longitude:46.6753 },
  { id:'sa4', countryId:'sa', title:'Saudi Cup Horse Race', date:'Feb 22, 2025', location:'Riyadh', category:'Sports', description:"World's richest horse race.", photo:null, latitude:24.7136, longitude:46.6753 },
];

const DEFAULT_DB = {
  users: [
    { id:'usr_admin_seed', email:'hafsiramez@gmail.com', username:'AdminRamez', password:'hafsi0123', role:'admin', status:'active', photo:null, createdAt:new Date().toISOString() },
    { id:'usr_client_seed', email:'ramezhafsi16@gmail.com', username:'ClientRamez', password:'hafsi0123', role:'client', status:'active', photo:null, createdAt:new Date().toISOString() },
  ],
  events: DEFAULT_EVENTS,
  countries: DEFAULT_COUNTRIES,
  subscriptions: [],
  messages: [],
  comments: [],
  reactions: {},
};

let db;

function loadDB() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      db = JSON.parse(raw);
      // Ensure all collections exist
      if (!db.users) db.users = DEFAULT_DB.users;
      if (!db.events) db.events = DEFAULT_DB.events;
      if (!db.countries) db.countries = DEFAULT_DB.countries;
      if (!db.subscriptions) db.subscriptions = [];
      if (!db.messages) db.messages = [];
      if (!db.comments) db.comments = [];
      if (!db.reactions) db.reactions = {};
      console.log(`Database loaded from ${DB_PATH} (${db.users.length} users, ${db.events.length} events)`);
    } else {
      db = JSON.parse(JSON.stringify(DEFAULT_DB));
      saveDB();
      console.log('Database initialized with default data.');
    }
  } catch (e) {
    console.error('Error loading database, starting fresh:', e.message);
    db = JSON.parse(JSON.stringify(DEFAULT_DB));
    saveDB();
  }
}

function saveDB() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving database:', e.message);
  }
}

loadDB();

// ═══════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'World Events Backend', users: db.users.length, events: db.events.length, timestamp: new Date().toISOString() });
});

// ═══════════════════════════════════════════════════════════════════
// EMAIL — Nodemailer Configuration
// ═══════════════════════════════════════════════════════════════════
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: 'hafsiramez@gmail.com', pass: 'ptqc udoj mkyw fvyv' }
});

// ═══════════════════════════════════════════════════════════════════
// AUTH & USER API
// ═══════════════════════════════════════════════════════════════════

// Register
app.post('/api/auth/register', (req, res) => {
  try {
    const { email, username, photo, password, role } = req.body;
    const normEmail = (email || '').trim().toLowerCase();
    if (!normEmail || !username || !password) {
      return res.status(400).json({ success: false, error: 'Email, username and password required' });
    }
    if (db.users.some(u => u.email === normEmail)) {
      return res.status(409).json({ success: false, error: 'EMAIL_EXISTS' });
    }
    if (db.users.some(u => u.username === username.trim())) {
      return res.status(409).json({ success: false, error: 'USERNAME_EXISTS' });
    }
    const id = 'usr_' + Date.now();
    const user = { id, email: normEmail, username: username.trim(), photo: photo || null, password, role: role || 'client', status: 'active', createdAt: new Date().toISOString() };
    db.users.push(user);
    saveDB();
    res.json({ success: true, id, user });
  } catch (e) {
    console.error('Register error:', e);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Login (get user by email)
app.post('/api/auth/login', (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email required' });
    }
    const normEmail = (email || '').trim().toLowerCase();
    const user = db.users.find(u => u.email === normEmail);
    if (!user) {
      return res.status(404).json({ success: false, error: 'USER_NOT_FOUND' });
    }
    res.json({ success: true, user });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get all users
app.get('/api/users', (req, res) => {
  res.json({ success: true, users: db.users });
});

// Update user profile
app.put('/api/users/:id', (req, res) => {
  const { username, password, photo } = req.body;
  const idx = db.users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'User not found' });
  if (username) db.users[idx].username = username.trim();
  if (password) db.users[idx].password = password;
  if (photo !== undefined) db.users[idx].photo = photo;
  saveDB();
  res.json({ success: true, user: db.users[idx] });
});

// Update user password by email
app.post('/api/users/password-by-email', (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ success: false, error: 'Email and newPassword required' });
  }
  const idx = db.users.findIndex(u => u.email === (email || '').trim().toLowerCase());
  if (idx === -1) return res.status(404).json({ success: false, error: 'User not found' });
  db.users[idx].password = newPassword;
  saveDB();
  res.json({ success: true, user: db.users[idx] });
});

// Close user account
app.put('/api/users/:id/close', (req, res) => {
  const idx = db.users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'User not found' });
  db.users[idx].status = 'closed';
  saveDB();
  res.json({ success: true });
});

// Activate user account
app.put('/api/users/:id/activate', (req, res) => {
  const idx = db.users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'User not found' });
  db.users[idx].status = 'active';
  saveDB();
  res.json({ success: true });
});

// Get admin user
app.get('/api/users/admin', (req, res) => {
  const admin = db.users.find(u => u.role === 'admin');
  res.json({ success: true, user: admin || null });
});

// Get all admins
app.get('/api/users/admins', (req, res) => {
  res.json({ success: true, admins: db.users.filter(u => u.role === 'admin') });
});

// Get client emails
app.get('/api/users/client-emails', (req, res) => {
  const clientEmails = db.users
    .filter(u => (u.role === 'client' || !u.role) && u.email)
    .map(u => u.email.trim().toLowerCase());
  const uniqueEmails = Array.from(new Set(clientEmails));
  res.json({ success: true, emails: uniqueEmails });
});

// Get user by ID
app.get('/api/users/:id', (req, res) => {
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  res.json({ success: true, user });
});

// ═══════════════════════════════════════════════════════════════════
// COUNTRIES API
// ═══════════════════════════════════════════════════════════════════
app.get('/api/countries', (req, res) => {
  const countriesWithEvents = db.countries.map(c => ({
    ...c,
    events: db.events.filter(e => e.countryId === c.id),
  }));
  res.json({ success: true, countries: countriesWithEvents });
});

app.post('/api/countries/get-or-create', (req, res) => {
  const { name } = req.body;
  const existing = db.countries.find(c => c.name.toLowerCase() === (name || '').trim().toLowerCase());
  if (existing) return res.json({ success: true, id: existing.id });
  const id = 'c_' + Date.now();
  db.countries.push({ id, name: (name || '').trim(), flag: '📍', flagColors: ['#6C3FFF', '#2E1E66'] });
  saveDB();
  res.json({ success: true, id });
});

// ═══════════════════════════════════════════════════════════════════
// EVENTS API
// ═══════════════════════════════════════════════════════════════════
app.get('/api/events', (req, res) => {
  const { category, countryId, date } = req.query;
  let events = db.events;
  if (category && category !== 'All') events = events.filter(e => e.category === category);
  if (countryId) events = events.filter(e => e.countryId === countryId);
  if (date) {
    const found = events.find(e => e.date === date);
    return res.json({ success: true, event: found || null });
  }
  res.json({ success: true, events });
});

app.post('/api/events', (req, res) => {
  const { countryId, title, date, location, latitude, longitude, category, description, photo } = req.body;
  // Check duplicate date
  const existing = db.events.find(e => e.date === date);
  if (existing) return res.status(409).json({ success: false, error: 'DATE_EXISTS' });
  const id = 'ev_' + Date.now();
  const newEvent = { id, countryId, title, date, location, latitude: latitude || null, longitude: longitude || null, category, description, photo: photo || null };
  db.events.push(newEvent);
  saveDB();
  res.json({ success: true, id, event: newEvent });
});

app.put('/api/events/:id', (req, res) => {
  const { countryId, title, date, location, latitude, longitude, category, description, photo } = req.body;
  const idx = db.events.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Event not found' });
  db.events[idx] = { ...db.events[idx], countryId, title, date, location, latitude: latitude || null, longitude: longitude || null, category, description, photo: photo !== undefined ? photo : db.events[idx].photo };
  saveDB();
  res.json({ success: true, event: db.events[idx] });
});

app.delete('/api/events/:id', (req, res) => {
  const event = db.events.find(e => e.id === req.params.id);
  db.events = db.events.filter(e => e.id !== req.params.id);
  saveDB();
  res.json({ success: true, event: event || null });
});

// ═══════════════════════════════════════════════════════════════════
// SUBSCRIPTIONS API
// ═══════════════════════════════════════════════════════════════════
app.post('/api/subscriptions', (req, res) => {
  const { userId, eventId, username, userEmail, eventTitle } = req.body;
  const existing = db.subscriptions.find(s => s.userId === userId && s.eventId === eventId);
  if (existing) return res.json({ success: true, message: 'Already subscribed' });
  const sub = {
    id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    userId, eventId, username: username || '', userEmail: userEmail || '', eventTitle: eventTitle || '',
    status: 'pending', createdAt: new Date().toISOString(),
  };
  db.subscriptions.push(sub);
  saveDB();
  res.json({ success: true, subscription: sub });
});

app.get('/api/subscriptions', (req, res) => {
  const { userId, eventId, status } = req.query;
  let subs = db.subscriptions;
  if (status) subs = subs.filter(s => s.status === status);
  if (userId && eventId) {
    const sub = subs.find(s => s.userId === userId && s.eventId === eventId);
    return res.json({ success: true, subscription: sub || null, status: sub ? sub.status : null });
  }
  // Enrich with user/event info
  const enriched = subs.map(s => {
    const user = db.users.find(u => u.id === s.userId);
    const event = db.events.find(e => e.id === s.eventId);
    return {
      ...s,
      username: user ? user.username : (s.username || 'Client'),
      userEmail: user ? user.email : (s.userEmail || ''),
      eventTitle: event ? event.title : (s.eventTitle || 'Événement'),
    };
  });
  res.json({ success: true, subscriptions: enriched });
});

app.put('/api/subscriptions/:id', (req, res) => {
  const { status } = req.body;
  const idx = db.subscriptions.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Subscription not found' });
  db.subscriptions[idx].status = status;
  saveDB();
  res.json({ success: true, subscription: db.subscriptions[idx] });
});

app.delete('/api/subscriptions', (req, res) => {
  const { userId, eventId } = req.query;
  db.subscriptions = db.subscriptions.filter(s => !(s.userId === userId && s.eventId === eventId));
  saveDB();
  res.json({ success: true });
});

app.get('/api/subscriptions/emails/:eventId', (req, res) => {
  const emails = db.subscriptions
    .filter(s => s.eventId === req.params.eventId && s.status === 'accepted')
    .map(s => {
      const user = db.users.find(u => u.id === s.userId);
      return user ? user.email : s.userEmail;
    })
    .filter(Boolean);
  res.json({ success: true, emails });
});

app.get('/api/subscriptions/check', (req, res) => {
  const { userId, eventId } = req.query;
  const exists = db.subscriptions.some(s => s.userId === userId && s.eventId === eventId);
  res.json({ success: true, isSubscribed: exists });
});

// ═══════════════════════════════════════════════════════════════════
// MESSAGES API
// ═══════════════════════════════════════════════════════════════════
app.post('/api/messages', (req, res) => {
  const { senderId, receiverId, text } = req.body;
  const id = 'msg_' + Date.now();
  const msg = { id, senderId, receiverId, text, read: false, createdAt: new Date().toISOString() };
  db.messages.push(msg);
  saveDB();
  res.json({ success: true, message: msg });
});

app.get('/api/messages', (req, res) => {
  const { user1, user2 } = req.query;
  const msgs = db.messages.filter(m =>
    (m.senderId === user1 && m.receiverId === user2) || (m.senderId === user2 && m.receiverId === user1)
  );
  res.json({ success: true, messages: msgs });
});

// Endpoint to mark messages from senderId to receiverId as read
app.post('/api/messages/mark-read', (req, res) => {
  const { senderId, receiverId } = req.body;
  let updated = false;
  db.messages.forEach(m => {
    if (m.senderId === senderId && m.receiverId === receiverId && !m.read) {
      m.read = true;
      updated = true;
    }
  });
  if (updated) saveDB();
  res.json({ success: true });
});

// Endpoint to get unread message counts for a user (grouped by senderId)
app.get('/api/messages/unread-counts', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.json({ success: true, counts: {}, total: 0 });

  const unreadMsgs = db.messages.filter(m => m.receiverId === userId && !m.read);
  const counts = {};
  unreadMsgs.forEach(m => {
    counts[m.senderId] = (counts[m.senderId] || 0) + 1;
  });
  res.json({ success: true, counts, total: unreadMsgs.length });
});

// ═══════════════════════════════════════════════════════════════════
// COMMENTS API
// ═══════════════════════════════════════════════════════════════════
app.get('/api/comments/:eventId', (req, res) => {
  const comments = (db.comments || []).filter(c => c.eventId === req.params.eventId);
  res.json({ success: true, comments });
});

app.post('/api/comments', (req, res) => {
  const { eventId, username, userPhoto, text } = req.body;
  if (!db.comments) db.comments = [];
  const comment = { id: 'comm_' + Date.now(), eventId, username, userPhoto: userPhoto || null, text, createdAt: new Date().toISOString() };
  db.comments.push(comment);
  saveDB();
  res.json({ success: true, comment });
});

// ═══════════════════════════════════════════════════════════════════
// REACTIONS API
// ═══════════════════════════════════════════════════════════════════
app.get('/api/reactions/:eventId', (req, res) => {
  if (!db.reactions) db.reactions = {};
  const reactions = db.reactions[req.params.eventId] || { Like: 0, Love: 0, Haha: 0, Wow: 0, Sad: 0, Angry: 0 };
  res.json({ success: true, reactions });
});

app.post('/api/reactions', (req, res) => {
  const { eventId, reactionType } = req.body;
  if (!db.reactions) db.reactions = {};
  if (!db.reactions[eventId]) db.reactions[eventId] = { Like: 0, Love: 0, Haha: 0, Wow: 0, Sad: 0, Angry: 0 };
  db.reactions[eventId][reactionType] = (db.reactions[eventId][reactionType] || 0) + 1;
  saveDB();
  res.json({ success: true, reactions: db.reactions[eventId] });
});

// ═══════════════════════════════════════════════════════════════════
// EMAIL ENDPOINTS (kept identical)
// ═══════════════════════════════════════════════════════════════════

app.post('/api/send-otp-email', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, error: 'Email is required' });
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const mailOptions = {
    from: '"World Events" <hafsiramez@gmail.com>', to: email,
    subject: 'Votre code de vérification - World Events',
    html: `<div style="font-family:Arial;padding:20px;text-align:center;"><h2 style="color:#00FF88;">World Events</h2><p>Voici votre code :</p><h1 style="font-size:36px;letter-spacing:5px;color:#1E293B;">${code}</h1><p style="color:#64748B;">Ce code expire dans 5 minutes.</p></div>`
  };
  try { await transporter.sendMail(mailOptions); console.log(`OTP sent to ${email}`); res.json({ success: true, code }); }
  catch (e) { console.error('OTP email error:', e.message); res.json({ success: true, code, warning: 'fallback' }); }
});

app.post('/api/send-subscription-email', async (req, res) => {
  const { email, eventTitle, username, adminEmail = 'hafsiramez@gmail.com' } = req.body;
  if (!email || !eventTitle) return res.status(400).json({ success: false, error: 'Email and eventTitle required' });
  try {
    await transporter.sendMail({ from: '"World Events" <hafsiramez@gmail.com>', to: email, subject: `📩 Demande transmise: ${eventTitle}`,
      html: `<div style="font-family:Arial;padding:28px;max-width:600px;margin:auto;background:#0B071E;border-radius:16px;border:1px solid rgba(139,92,246,0.3);color:#FFF;"><h2 style="color:#8B5CF6;text-align:center;">World Events</h2><h3 style="color:#F8FAFC;">Bonjour ${username},</h3><p style="color:#CBD5E1;">Votre demande pour <strong>${eventTitle}</strong> a été transmise.</p><div style="background:rgba(139,92,246,0.12);padding:18px;border-radius:12px;text-align:center;margin:20px 0;"><p style="color:#F59E0B;font-weight:bold;">⏳ En attente de validation</p></div></div>` });
    await transporter.sendMail({ from: '"World Events" <hafsiramez@gmail.com>', to: adminEmail, subject: `🔔 Nouvelle demande: ${username} pour ${eventTitle}`,
      html: `<div style="font-family:Arial;padding:24px;max-width:600px;margin:auto;background:#0B071E;border-radius:16px;border:1px solid #8B5CF6;color:#FFF;"><h2 style="color:#8B5CF6;text-align:center;">Nouvelle Demande</h2><p style="color:#E2E8F0;">${username} (${email}) demande: <strong>${eventTitle}</strong></p></div>` });
    res.json({ success: true });
  } catch (e) { console.error('Subscription email error:', e.message); res.json({ success: true, warning: 'fallback' }); }
});

app.post('/api/send-demand-status-email', async (req, res) => {
  const { email, username, eventTitle, status, adminEmail = 'hafsiramez@gmail.com' } = req.body;
  if (!email || !eventTitle || !status) return res.status(400).json({ success: false, error: 'Missing fields' });
  let color = '#8B5CF6', icon = '📋', msg = '';
  if (status === 'accepted') { color = '#10B981'; icon = '✅'; msg = `Votre inscription pour <strong>${eventTitle}</strong> a été <strong>ACCEPTÉE</strong>.<br/><br/><strong style="color:#F59E0B;">📅</strong> Vous recevrez une notification pour la date de paiement.`; }
  else if (status === 'refused') { color = '#FF3D71'; icon = '❌'; msg = `Votre demande pour <strong>${eventTitle}</strong> n'a pas été retenue.`; }
  else if (status === 'waitlist') { color = '#F59E0B'; icon = '⏳'; msg = `Votre demande pour <strong>${eventTitle}</strong> est sur <strong>LISTE D'ATTENTE</strong>.`; }
  try {
    await transporter.sendMail({ from: '"World Events" <hafsiramez@gmail.com>', to: email, subject: `${icon} ${eventTitle} - World Events`,
      html: `<div style="font-family:Arial;padding:28px;max-width:600px;margin:auto;background:#0B071E;border-radius:16px;border:1px solid ${color};color:#FFF;"><h2 style="color:${color};text-align:center;">World Events</h2><h3 style="color:#F8FAFC;">Bonjour ${username || email},</h3><p style="color:#CBD5E1;line-height:1.7;">${msg}</p></div>` });
    res.json({ success: true });
  } catch (e) { console.error('Demand status email error:', e.message); res.json({ success: true, warning: 'fallback' }); }
});

app.post('/api/send-account-blocked-email', async (req, res) => {
  const { email, username, adminEmail = 'hafsiramez@gmail.com' } = req.body;
  if (!email) return res.status(400).json({ success: false, error: 'Email required' });
  try {
    await transporter.sendMail({ from: '"World Events" <hafsiramez@gmail.com>', to: email, subject: 'Compte Fermé - World Events',
      html: `<div style="font-family:Arial;padding:24px;max-width:600px;margin:auto;background:#0F172A;border-radius:12px;border:1px solid #FF4466;color:#FFF;"><h2 style="color:#FF4466;text-align:center;">Compte Fermé</h2><p style="color:#E2E8F0;">Bonjour <strong>${username || email}</strong>, votre compte a été fermé. Contact: ${adminEmail}</p></div>` });
    res.json({ success: true });
  } catch (e) { res.json({ success: true, warning: 'fallback' }); }
});

app.post('/api/send-account-activated-email', async (req, res) => {
  const { email, username, adminEmail = 'hafsiramez@gmail.com' } = req.body;
  if (!email) return res.status(400).json({ success: false, error: 'Email required' });
  try {
    await transporter.sendMail({ from: '"World Events" <hafsiramez@gmail.com>', to: email, subject: '🎉 Compte Activé - World Events',
      html: `<div style="font-family:Arial;padding:24px;max-width:600px;margin:auto;background:#0F172A;border-radius:12px;border:1px solid #10B981;color:#FFF;"><h2 style="color:#10B981;text-align:center;">🎉 Compte Activé</h2><p style="color:#E2E8F0;">Bonjour <strong>${username || email}</strong>, votre compte a été réactivé !</p></div>` });
    res.json({ success: true });
  } catch (e) { res.json({ success: true, warning: 'fallback' }); }
});

app.post('/api/notify-new-event', async (req, res) => {
  const { eventTitle, eventCategory, eventDate, eventLocation, eventDescription, eventPhoto, clientEmails } = req.body;
  if (!clientEmails || clientEmails.length === 0) return res.json({ success: true, sent: 0 });
  try {
    console.log(`[Email] Sending new event notification for "${eventTitle}" to ${clientEmails.length} client(s):`, clientEmails);
    await transporter.sendMail({ from: '"World Events" <hafsiramez@gmail.com>', to: clientEmails.join(','), subject: `🎉 Nouvel événement : ${eventTitle}`,
      html: `<div style="font-family:Arial;padding:28px;max-width:600px;margin:auto;background:#0F172A;border-radius:20px;border:1px solid rgba(108,63,255,0.3);color:#FFF;"><div style="background:linear-gradient(135deg,#6C3FFF,#3B1FA8);padding:30px 28px 20px;text-align:center;border-radius:20px 20px 0 0;"><h1 style="color:#fff;font-size:22px;margin:0;">🌍 World Events</h1></div><div style="padding:28px;"><h2 style="color:#FFF;">${eventTitle}</h2><p style="color:#CBD5E1;">📅 ${eventDate || ''} · 📍 ${eventLocation || ''} · 🏷️ ${eventCategory || ''}</p><p style="color:#94A3B8;">${eventDescription || ''}</p></div></div>` });
    console.log(`[Email] Successfully sent email for "${eventTitle}"`);
    res.json({ success: true, sent: clientEmails.length });
  } catch (e) {
    console.error(`[Email Error] Failed to send new event email for "${eventTitle}":`, e.message);
    res.json({ success: true, sent: 0, warning: e.message });
  }
});

app.post('/api/notify-event-change', async (req, res) => {
  const { eventTitle, eventDate, eventLocation, changeType, clientEmails } = req.body;
  if (!clientEmails || clientEmails.length === 0) return res.json({ success: true, sent: 0 });
  const isDeleted = changeType === 'deleted';
  const color = isDeleted ? '#FF3D71' : '#F59E0B';
  const headline = isDeleted ? '🗑️ Événement Annulé' : '✏️ Événement Modifié';
  const body = isDeleted
    ? `L'événement <strong>${eventTitle}</strong> a été <strong style="color:#FF3D71;">SUPPRIMÉ</strong>.`
    : `L'événement <strong>${eventTitle}</strong> a été modifié. Date: ${eventDate || 'N/A'} — Lieu: ${eventLocation || 'N/A'}.`;
  try {
    console.log(`[Email] Sending event change notification (${changeType}) for "${eventTitle}" to ${clientEmails.length} client(s):`, clientEmails);
    await transporter.sendMail({ from: '"World Events" <hafsiramez@gmail.com>', to: clientEmails.join(','), subject: `${headline} : ${eventTitle}`,
      html: `<div style="font-family:Arial;padding:28px;max-width:600px;margin:auto;background:#0B071E;border-radius:16px;border:2px solid ${color};color:#FFF;"><h2 style="color:${color};text-align:center;">${headline}</h2><h3 style="color:#F8FAFC;text-align:center;">${eventTitle}</h3><p style="color:#CBD5E1;line-height:1.7;">${body}</p></div>` });
    console.log(`[Email] Successfully sent change email for "${eventTitle}"`);
    res.json({ success: true, sent: clientEmails.length });
  } catch (e) {
    console.error(`[Email Error] Failed to send event change email for "${eventTitle}":`, e.message);
    res.json({ success: true, sent: 0, warning: e.message });
  }
});

app.post('/api/send-reset-otp-email', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, error: 'Email required' });
  const code = String(Math.floor(100000 + Math.random() * 900000));
  try {
    console.log(`[Email] Sending OTP reset email to ${email}`);
    await transporter.sendMail({ from: '"World Events" <hafsiramez@gmail.com>', to: email, subject: '🔐 Réinitialisation - World Events',
      html: `<div style="background:#0B071E;padding:40px 20px;font-family:Arial;"><div style="max-width:520px;margin:auto;background:#150D32;border-radius:20px;border:1px solid rgba(139,92,246,0.4);overflow:hidden;"><div style="background:linear-gradient(135deg,#7C3AED,#EC4899);padding:32px 28px;text-align:center;"><h1 style="color:#fff;margin:0;font-size:24px;">🔐 Réinitialisation</h1></div><div style="padding:32px 28px;text-align:center;"><div style="font-size:42px;font-weight:800;letter-spacing:12px;color:#F8FAFC;font-family:monospace;">${code}</div><p style="color:#94A3B8;font-size:12px;">⏱ Valide 10 minutes</p></div></div></div>` });
    console.log(`[Email] OTP email successfully sent to ${email}`);
    res.json({ success: true, code });
  } catch (e) {
    console.error(`[Email Error] Failed to send OTP email to ${email}:`, e.message);
    res.json({ success: true, code, warning: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// SERVE STATIC WEB APP
// ═══════════════════════════════════════════════════════════════════
if (fs.existsSync(path.join(__dirname, 'dist'))) {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    }
    next();
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`World Events Backend running on port ${PORT}`);
  console.log(`Database: ${db.users.length} users, ${db.events.length} events, ${db.subscriptions.length} subscriptions`);
});
