const express = require("express");
const paymentController= require('../controllers/payment');
const validateToken = require('../middleware/uservalidation');
const router = express.Router();

router.post('/payment',  paymentController.payment);

module.exports =router;