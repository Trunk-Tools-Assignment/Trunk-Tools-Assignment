import { Request, Response, NextFunction } from 'express';
import * as authMiddlewareModule from '../src/middleware/authMiddleware';
import * as authModule from '../src/lib/auth';

const { validateAuth } = authMiddlewareModule;
const { extractUserId } = authModule as { extractUserId: jest.Mock };

// Mock auth lib
jest.mock('../src/lib/auth', () => ({
  extractUserId: jest.fn(),
}));

interface MockRequest extends Partial<Request> {
  headers: Record<string, string>;
  userId?: string;
}

interface MockResponse extends Partial<Response> {
  status: jest.Mock;
  json: jest.Mock;
}

describe('Authentication Middleware', () => {
  let req: MockRequest;
  let res: MockResponse;
  let next: jest.Mock;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should extract userId and call next() with valid authorization header', () => {
    // Setup
    req.headers.authorization = 'Bearer test-user-id';
    extractUserId.mockReturnValue('test-user-id');

    // Execute
    validateAuth(req as Request, res as Response, next as NextFunction);

    // Verify
    expect(extractUserId).toHaveBeenCalledWith(req.headers);
    expect(req.userId).toBe('test-user-id');
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 401 with invalid authorization header', () => {
    // Setup - simulate missing/invalid token
    extractUserId.mockReturnValue(null);

    // Execute
    validateAuth(req as Request, res as Response, next as NextFunction);

    // Verify
    expect(extractUserId).toHaveBeenCalledWith(req.headers);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('Unauthorized'),
      }),
    );
  });

  it('should return 401 with no authorization header', () => {
    // Setup - no authorization header

    // Execute
    validateAuth(req as Request, res as Response, next as NextFunction);

    // Verify
    expect(extractUserId).toHaveBeenCalledWith(req.headers);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should return 401 with empty authorization header', () => {
    // Setup
    req.headers.authorization = '';
    extractUserId.mockReturnValue(null);

    // Execute
    validateAuth(req as Request, res as Response, next as NextFunction);

    // Verify
    expect(extractUserId).toHaveBeenCalledWith(req.headers);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
