import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
    console.error('[ERROR]', err.message, err.stack);
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    });
}

export function notFound(req: Request, res: Response): void {
    res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` });
}
