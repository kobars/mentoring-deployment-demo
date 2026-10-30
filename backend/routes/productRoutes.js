import { Router } from 'express';
import { index, show, store, replace, patchPrice, destroy } from '../controllers/productController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validateProduct, validatePricePatch, validateId } from '../middlewares/productValidation.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { validateSearch } from '../middlewares/validateSearch.js';

const router = Router();
router.use(authenticate);
router.get('/', validateSearch, index);
router.get('/:id', validateId, validateRequest, show);
router.post('/', validateProduct(), validateRequest, store);
router.put('/:id', validateId, validateProduct(), validateRequest, replace);
router.patch('/:id', validateId, validatePricePatch(), validateRequest, patchPrice);
router.delete('/:id', validateId, validateRequest, destroy);

export default router;
