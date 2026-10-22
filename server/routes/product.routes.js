const router = require('express').Router();
const { list } = require('../controllers/product.controller');

router.get('/', list);

module.exports = router;
