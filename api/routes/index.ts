import express from 'express';
import { Upload } from '../utils/Upload';
import { KMLController } from '../controllers/KMLController';

const router = express.Router();
const upload = Upload.getMulterInstance();

// KML File Upload
router.post('/kml/upload', upload.single('file'), KMLController.uploadKML);

// KML Generation endpoint
router.post('/kml/generate', KMLController.generateKML);

export default router;
