import { Request, Response, NextFunction } from 'express';
import * as validationModule from '../src/lib/validation';
import { z } from 'zod';

const { validate, schemas } = validationModule;

// Using more specific type for query parameters
interface MockRequest {
  query: Record<
    string,
    z.infer<typeof schemas.conversion>[keyof z.infer<typeof schemas.conversion>]
  >;
  body: Record<
    string,
    z.infer<typeof schemas.auth>[keyof z.infer<typeof schemas.auth>]
  >;
}

// Using more specific response type
interface MockResponse extends Partial<Response> {
  status: jest.Mock<any, [number]>;
  json: jest.Mock<any, [any]>;
}

describe('Validation Middleware', () => {
  let req: MockRequest;
  let res: MockResponse;
  let next: jest.Mock;

  beforeEach(() => {
    req = {
      query: {},
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  describe('conversion schema', () => {
    const validationMiddleware = validate(schemas.conversion);

    it('should pass validation with valid query parameters', () => {
      req.query = {
        from: 'USD',
        to: 'EUR',
        amount: '100',
      };

      validationMiddleware(
        req as Request,
        res as Response,
        next as NextFunction,
      );

      // Check that next was called (validation passed)
      expect(next).toHaveBeenCalled();

      // Check that values were parsed and transformed correctly
      expect(req.query).toEqual({
        from: 'USD',
        to: 'EUR',
        amount: 100, // String converted to number
      });
    });

    it('should transform currency codes to uppercase', () => {
      req.query = {
        from: 'usd',
        to: 'eur',
        amount: '100',
      };

      validationMiddleware(
        req as Request,
        res as Response,
        next as NextFunction,
      );

      expect(next).toHaveBeenCalled();
      expect(req.query.from).toBe('USD');
      expect(req.query.to).toBe('EUR');
    });

    it('should fail validation with missing parameters', () => {
      req.query = {
        from: 'USD',
        // 'to' is missing
        amount: '100',
      };

      validationMiddleware(
        req as Request,
        res as Response,
        next as NextFunction,
      );

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation error',
        }),
      );
    });

    it('should fail validation with invalid amount', () => {
      req.query = {
        from: 'USD',
        to: 'EUR',
        amount: 'invalid',
      };

      validationMiddleware(
        req as Request,
        res as Response,
        next as NextFunction,
      );

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should fail validation with negative amount', () => {
      req.query = {
        from: 'USD',
        to: 'EUR',
        amount: '-100',
      };

      validationMiddleware(
        req as Request,
        res as Response,
        next as NextFunction,
      );

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should fail validation with too short currency code', () => {
      req.query = {
        from: 'US', // Too short
        to: 'EUR',
        amount: '100',
      };

      validationMiddleware(
        req as Request,
        res as Response,
        next as NextFunction,
      );

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should fail validation with too long currency code', () => {
      req.query = {
        from: 'USD',
        to: 'EUROUSD', // Too long
        amount: '100',
      };

      validationMiddleware(
        req as Request,
        res as Response,
        next as NextFunction,
      );

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('auth schema', () => {
    const validationMiddleware = validate(schemas.auth, 'body');

    it('should pass validation with valid user ID', () => {
      req.body = {
        userId: 'test-user-id',
      };

      validationMiddleware(
        req as Request,
        res as Response,
        next as NextFunction,
      );

      expect(next).toHaveBeenCalled();
    });

    it('should fail validation with empty user ID', () => {
      req.body = {
        userId: '',
      };

      validationMiddleware(
        req as Request,
        res as Response,
        next as NextFunction,
      );

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
