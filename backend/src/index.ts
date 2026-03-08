import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import morgan from 'morgan';
import { Server as IOServer } from 'socket.io';

import authRouter from './routes/auth';
import patientsRouter from './routes/patients';
import alertsRouter from './routes/alerts';
import analyticsRouter from './routes/analytics';
import vitalsRouter from './routes/vitals';
import settingsRouter from './routes/settings';

import { errorHandler, notFound } from './middleware/errorHandler';
import { initLiveUpdates } from './services/liveUpdates';

// ─── App Setup ────────────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// ─── Socket.IO ────────────────────────────────────────────────────────────────
const io = new IOServer(server, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'SepsisAI Clinical Platform API',
        version: '1.0.0',
        uptime: Math.floor(process.uptime()),
    });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/patients', patientsRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/vitals', vitalsRouter);
app.use('/api/settings', settingsRouter);

// ─── Root redirect → frontend ─────────────────────────────────────────────────
app.get('/', (_req, res) => {
    res.redirect('http://localhost:5173');
});

// ─── 404 + Error Handlers ─────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '4000', 10);

server.listen(PORT, () => {
    console.log('\n╔══════════════════════════════════════════════╗');
    console.log(`║  SepsisAI Clinical Platform — Backend API   ║`);
    console.log(`║  http://localhost:${PORT}                      ║`);
    console.log('╠══════════════════════════════════════════════╣');
    console.log('║  Routes:                                     ║');
    console.log('║   POST  /api/auth/login                      ║');
    console.log('║   GET   /api/patients                        ║');
    console.log('║   GET   /api/patients/:id                    ║');
    console.log('║   PUT   /api/patients/:id/vitals             ║');
    console.log('║   GET   /api/alerts                          ║');
    console.log('║   PATCH /api/alerts/:id/dismiss              ║');
    console.log('║   GET   /api/analytics/summary               ║');
    console.log('║   GET   /api/vitals/live                     ║');
    console.log('║   WS    socket.io  →  vitals:update          ║');
    console.log('╚══════════════════════════════════════════════╝\n');

    // Start Socket.IO live broadcaster
    initLiveUpdates(io);
});

// Graceful shutdown
process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));
