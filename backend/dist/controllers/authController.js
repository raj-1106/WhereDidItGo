"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = '7d';
function signToken(uid, email) {
    const secret = process.env.JWT_SECRET;
    if (!secret)
        throw new Error('JWT_SECRET is not set.');
    return jsonwebtoken_1.default.sign({ uid, email }, secret, { expiresIn: TOKEN_EXPIRY });
}
// POST /api/auth/register
const register = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'email and password are required' });
        }
        if (typeof password !== 'string' || password.length < 8) {
            return res.status(400).json({ error: 'password must be at least 8 characters' });
        }
        const normalizedEmail = String(email).toLowerCase().trim();
        const existing = await User_1.User.findOne({ email: normalizedEmail });
        if (existing) {
            // Same message as "wrong password" territory is a separate decision (user enumeration);
            // for a personal finance tracker with no invite flow, an explicit "already registered"
            // is more useful than it is risky. Flagging the trade-off, not hiding it.
            return res.status(409).json({ error: 'An account with this email already exists' });
        }
        const passwordHash = await bcryptjs_1.default.hash(password, SALT_ROUNDS);
        const user = await User_1.User.create({ email: normalizedEmail, passwordHash });
        const token = signToken(user.id, user.email);
        res.status(201).json({ token, user: { id: user.id, email: user.email } });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to register' });
    }
};
exports.register = register;
// POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'email and password are required' });
        }
        const normalizedEmail = String(email).toLowerCase().trim();
        const user = await User_1.User.findOne({ email: normalizedEmail });
        if (!user) {
            // Deliberately identical message/status to "wrong password" below,
            // so login (unlike register) does not leak which emails exist.
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const valid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const token = signToken(user.id, user.email);
        res.json({ token, user: { id: user.id, email: user.email } });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to login' });
    }
};
exports.login = login;
