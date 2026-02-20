import { getUniversities, addUniversity, deleteUniversity } from '../controllers/universityController.js';
import { protect, admin, superAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(getUniversities)
    .post(protect, admin, addUniversity);

router.route('/:id')
    .delete(protect, superAdmin, deleteUniversity);

export default router;
