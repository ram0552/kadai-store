const router = require('express').Router();
const { createCodOrder, getOrder } = require('../controllers/order.controller');

router.post('/cod', createCodOrder);
router.get('/:id', getOrder);

module.exports = router;
