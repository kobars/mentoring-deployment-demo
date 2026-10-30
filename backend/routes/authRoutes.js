import { Router } from 'express';
import { register, login } from '../controllers/authController.js';
import { validateRegister, validateLogin } from '../middlewares/authValidation.js';
import { validateRequest } from '../middlewares/validateRequest.js';

const router = Router();
router.post('/register', validateRegister(), validateRequest, register);
router.post('/login', validateLogin(), validateRequest, login);
export default router;
