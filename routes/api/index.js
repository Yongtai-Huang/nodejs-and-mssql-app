'use strict';

const router = require('express').Router();

router.use('/users', require('./users'));
router.use('/restaurants', require('./restaurants'));
router.use('/foods', require('./foods'));
router.use('/orders', require('./orders'));

module.exports = router;