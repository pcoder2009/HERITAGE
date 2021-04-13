const express = require("express");
const userController= require('../controllers/user');
const validateToken = require('../middleware/uservalidation');
const router = express.Router();

router.post('/signup', userController.userregistration);

router.post('/login', userController.userlogin);

router.put('/userupdate', validateToken, userController.userupdate);

router.post('/activateuser', userController.activateuser);

router.post('/deactivateuser',validateToken, userController.deactivateuser);

router.post('/forgot/password', userController.forgot);

router.post('/verify/forgot/password', userController.forgotPassVerify);

router.post('/reset/password', validateToken, userController.resetPassword);

router.put('/email/change', validateToken, userController.userEmailChange);

router.get('/list/id', validateToken, userController.userlistId);

router.get('/booking/list', validateToken, userController.bookingListUser);

module.exports =router;