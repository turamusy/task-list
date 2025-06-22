import { Router } from 'express';
import { handleGetItems, handleSelect, handleReorder } from '../controllers/list-controller';

const router: Router = Router();

router.get('/items', handleGetItems);
router.post('/select', handleSelect);
router.post('/order', handleReorder);

export default router;
