const express = require('express');
const multer = require('multer');
const {
  listDocuments,
  uploadDocument,
  getDocument,
  getDocumentText,
  getDocumentTextMetadata,
  getAnnotations,
} = require('../controllers/documentController');
const { authenticate } = require('../middleware/authenticate');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024,
    fieldSize: 1024 * 1024,
    files: 1,
  },
});

router.use(authenticate);

router.get('/', listDocuments);
router.post('/', upload.single('file'), uploadDocument);
router.get('/:id', getDocument);
router.get('/:id/text', getDocumentText);
router.get('/:id/text-metadata', getDocumentTextMetadata);
router.get('/:id/annotations', getAnnotations);

module.exports = router;
