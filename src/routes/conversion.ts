import express from 'express';
import conversionController from '../controllers/conversionController';
import { validate, schemas } from '../lib/validation';
import { validateAuth } from '../middleware/authMiddleware';

const router = express.Router();

// Apply validation middleware before the controller
router.get(
  '/',
  validateAuth,
  validate(schemas.conversion),
  conversionController.convert,
);

export default router;
