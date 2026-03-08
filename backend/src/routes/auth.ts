import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByUsername, findUserById, createUser } from '../db/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';


const router = Router();

// POST /api/auth/login
router.post('/login', (req: Request, res: Response): void => {
    const { username, password } = req.body as { username?: string; password?: string };

    if (!username || !password) {
        res.status(400).json({ success: false, message: 'Username and password required' });
        return;
    }

    const user = findUserByUsername(username.toLowerCase());

    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
        return;
    }

    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const expires = process.env.JWT_EXPIRES_IN || '8h';

    const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role, name: user.name },
        secret,
        { expiresIn: expires } as jwt.SignOptions,
    );

    res.json({
        success: true,
        token,
        user: {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            department: user.department,
        },
    });
});

// POST /api/auth/signup
router.post('/signup', (req: Request, res: Response): void => {
    const { username, password, confirmPassword, name, role, department } =
        req.body as {
            username?: string; password?: string; confirmPassword?: string;
            name?: string; role?: string; department?: string;
        };

    if (!username || !password || !name || !role || !department) {
        res.status(400).json({ success: false, message: 'All fields are required' });
        return;
    }
    if (password !== confirmPassword) {
        res.status(400).json({ success: false, message: 'Passwords do not match' });
        return;
    }
    if (password.length < 6) {
        res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        return;
    }
    const validRoles = ['doctor', 'nurse', 'admin'];
    if (!validRoles.includes(role)) {
        res.status(400).json({ success: false, message: 'Invalid role' });
        return;
    }
    const existing = findUserByUsername(username.toLowerCase());
    if (existing) {
        res.status(409).json({ success: false, message: 'Username already taken' });
        return;
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const newUser = createUser({
        id: uuidv4(),
        username: username.toLowerCase(),
        passwordHash,
        role: role as 'doctor' | 'nurse' | 'admin',
        name,
        department,
    });

    if (!newUser) {
        res.status(500).json({ success: false, message: 'Failed to create account' });
        return;
    }

    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const expires = process.env.JWT_EXPIRES_IN || '8h';
    const token = jwt.sign(
        { id: newUser.id, username: newUser.username, role: newUser.role, name: newUser.name },
        secret,
        { expiresIn: expires } as jwt.SignOptions,
    );

    res.status(201).json({
        success: true,
        token,
        user: {
            id: newUser.id,
            username: newUser.username,
            name: newUser.name,
            role: newUser.role,
            department: newUser.department,
        },
    });
});



// GET /api/auth/me
router.get('/me', authenticate, (req: AuthRequest, res: Response): void => {
    const user = findUserById(req.user!.id);
    if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
    }
    res.json({
        success: true,
        user: { id: user.id, username: user.username, name: user.name, role: user.role, department: user.department },
    });
});

// POST /api/auth/logout  (client just discards the token)
router.post('/logout', authenticate, (_req: AuthRequest, res: Response): void => {
    res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
