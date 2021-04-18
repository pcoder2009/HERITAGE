const express = require("express");
const siteController= require('../controllers/site');
const router = express.Router();

router.post("/about",siteController.about_us)


module.exports =router;