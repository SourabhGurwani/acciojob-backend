import express from 'express';
import { 
  createComponent, 
  updateComponent, 
  getComponents, 
  getComponent 
} from '../controllers/componentController.js';
import authMiddleware from '../middleware/authMiddleware.js';
// import { validateComponent } from '../validators/componentValidator.js';

const router = express.Router();

// Protect all component routes
router.use(authMiddleware);

router.post('/', createComponent);
router.put('/:id', updateComponent);
router.get('/', getComponents);
router.get('/:id', getComponent);
// router.post('/', validateComponent, createComponent);
// router.put('/:id', validateComponent, updateComponent);

export default router;