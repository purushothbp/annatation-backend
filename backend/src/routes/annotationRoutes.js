const express = require('express');
const {
  createAnnotation,
  updateAnnotation,
  deleteAnnotation,
} = require('../controllers/annotationController');
const { authenticate } = require('../middleware/authenticate');

const router = express.Router();

router.use(authenticate);

router.post('/', createAnnotation);
router.patch('/:id', updateAnnotation);
router.delete('/:id', deleteAnnotation);

module.exports = router;
