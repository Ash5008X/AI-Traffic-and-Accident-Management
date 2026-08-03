const express = require('express');
const cors = require('cors');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');

// Import Route Handlers
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const alertRoutes = require('./routes/alertRoutes');
const reportRoutes = require('./routes/reportRoutes');
const fieldUnitRoutes = require('./routes/fieldUnitRoutes');
const teamRoutes = require('./routes/teamRoutes');
const memberRoutes = require('./routes/memberRoutes');
const reliefCenterRoutes = require('./routes/reliefCenterRoutes');
const messageRoutes = require('./routes/messageRoutes');

const app = express();

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'NexusTRAFFIC AI Traffic & Incident Management API',
    timestamp: new Date(),
    uptime: Math.round(process.uptime()),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/field-units', fieldUnitRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/relief-centers', reliefCenterRoutes);
app.use('/api/messages', messageRoutes);

// Optional: Serve Frontend Client Build if present
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
});

// Global Error Handling Middleware
app.use(errorHandler);

module.exports = app;
