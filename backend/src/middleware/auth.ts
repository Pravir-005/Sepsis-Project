import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { findUserById } from '../db/database';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        username: string;
        role: string;
        name: string;
    };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'Authorization token required' });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const secret = process.env.JWT_SECRET || 'fallback_secret';
        const decoded = jwt.verify(token, secret) as { id: string; username: string; role: string; name: string };

        const user = findUserById(decoded.id);
        if (!user) {
            res.status(401).json({ success: false, message: 'User not found' });
            return;
        }

        req.user = { id: decoded.id, username: decoded.username, role: decoded.role, name: decoded.name };
        next();
    } catch {
        res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
}

export function requireRole(...roles: string[]) {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({ success: false, message: 'Insufficient permissions' });
            return;
        }
        next();
    };
}
