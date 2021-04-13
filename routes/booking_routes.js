const express = require("express");
const bookingController= require('../controllers/booking');
const validateToken = require('../middleware/uservalidation');
const router = express.Router();

router.post('/room/book',  validateToken, bookingController.roomBook);

router.post('/cancel', bookingController.bookingCancel);

module.exports =router;