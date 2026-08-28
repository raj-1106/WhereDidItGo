"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authMiddleware(req, res, next) {
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
        const payload = jsonwebtoken_1.default.verify(token, secret);
        if (typeof payload.uid !== 'string' || typeof payload.email !== 'string') {
            res.status(401).json({ error: 'Token expired or invalid.' });
            return;
        }
        req.user = { uid: payload.uid, email: payload.email };
        next();
    }
    catch {
        res.status(401).json({ error: 'Token expired or invalid.' });
    }
}
