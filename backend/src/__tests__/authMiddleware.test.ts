import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware/authMiddleware';

process.env.JWT_SECRET = 'test-secret-do-not-use-in-prod';

function mockRes() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

describe('authMiddleware', () => {
  it('main case: valid token sets req.user and calls next', () => {
    const token = jwt.sign({ uid: 'user123', email: 'a@b.com' }, process.env.JWT_SECRET!);
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual({ uid: 'user123', email: 'a@b.com' });
    expect(res.status).not.toHaveBeenCalled();
  });

  it('edge case: missing authorization header is rejected', () => {
    const req = { headers: {} } as Request;
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(req.user).toBeUndefined();
  });

  it('failure case: invalid/tampered token is rejected', () => {
    const req = { headers: { authorization: 'Bearer not-a-real-token' } } as Request;
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('failure case: expired token is rejected', () => {
    const token = jwt.sign({ uid: 'user123', email: 'a@b.com' }, process.env.JWT_SECRET!, {
      expiresIn: -1, // already expired
    });
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
