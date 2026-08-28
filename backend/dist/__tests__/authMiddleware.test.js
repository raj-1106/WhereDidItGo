"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware_1 = require("../middleware/authMiddleware");
process.env.JWT_SECRET = 'test-secret-do-not-use-in-prod';
function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}
describe('authMiddleware', () => {
    it('main case: valid token sets req.user and calls next', () => {
        const token = jsonwebtoken_1.default.sign({ uid: 'user123', email: 'a@b.com' }, process.env.JWT_SECRET);
        const req = { headers: { authorization: `Bearer ${token}` } };
        const res = mockRes();
        const next = jest.fn();
        (0, authMiddleware_1.authMiddleware)(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        expect(req.user).toEqual({ uid: 'user123', email: 'a@b.com' });
        expect(res.status).not.toHaveBeenCalled();
    });
    it('edge case: missing authorization header is rejected', () => {
        const req = { headers: {} };
        const res = mockRes();
        const next = jest.fn();
        (0, authMiddleware_1.authMiddleware)(req, res, next);
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(req.user).toBeUndefined();
    });
    it('failure case: invalid/tampered token is rejected', () => {
        const req = { headers: { authorization: 'Bearer not-a-real-token' } };
        const res = mockRes();
        const next = jest.fn();
        (0, authMiddleware_1.authMiddleware)(req, res, next);
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
    });
    it('failure case: expired token is rejected', () => {
        const token = jsonwebtoken_1.default.sign({ uid: 'user123', email: 'a@b.com' }, process.env.JWT_SECRET, {
            expiresIn: -1, // already expired
        });
        const req = { headers: { authorization: `Bearer ${token}` } };
        const res = mockRes();
        const next = jest.fn();
        (0, authMiddleware_1.authMiddleware)(req, res, next);
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
    });
});
