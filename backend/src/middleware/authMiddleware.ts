import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  uid: string;
  email: string;
}

// Extend Express Request globally so all controllers get req.user without casting
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization token.' });
    return;
  }

  const token = header.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'Missing or invalid authorization token.' });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Fail loudly rather than letting jwt.verify throw an opaque error.
    console.error('JWT_SECRET is not set.');
    res.status(500).json({ error: 'Server misconfiguration.' });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as JwtPayload;
    if (typeof payload.uid !== 'string' || typeof payload.email !== 'string') {
      res.status(401).json({ error: 'Token expired or invalid.' });
      return;
    }
    req.user = { uid: payload.uid, email: payload.email };
    next();
  } catch {
    res.status(401).json({ error: 'Token expired or invalid.' });
  }
}
