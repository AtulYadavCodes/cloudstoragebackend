import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { getalluserfiles, uploadfile } from '../controllers/file.controller.js';
import { upload } from '../middlewares/multer.middleware.js';

const router=Router();
router.route('/uploadfile/:folderid').post(verifyJWT,upload.single('file'),uploadfile);
router.route('/getalluserfiles').get(verifyJWT,getalluserfiles);
export default router;