const express = require("express");
const adminController= require('../controllers/admin');
const validateToken = require('../middleware/uservalidation');
const router = express.Router();

router.post('/signup', adminController.adminregistration);

router.post('/login', adminController.adminlogin);

router.put('/adminUpdate', validateToken, adminController.adminUpdate);

router.post('/activateAdmin', adminController.activateAdmin);

router.post('/deactivateAdmin',validateToken, adminController.deactivateAdmin);

router.post('/forgot/password', adminController.forgot);

router.post('/verify/forgot/password', adminController.forgotPassVerify);

router.post('/reset/password', validateToken, adminController.resetPassword);

router.put('/email/change', validateToken, adminController.adminEmailChange);

router.post('/create/room', validateToken, adminController.loadImageToBuffer.single('media'), adminController.createRoom);

router.put('/update/room', validateToken,adminController.loadImageToBuffer.single('media'), adminController.roomupdate);

router.get('/list/room',  adminController.listRoom);

router.get('/list/room/id',  adminController.listRoomId);

router.get('/list/user',  adminController.listUser);

router.get('/list/user/id',  adminController.listUserId);

module.exports =router;