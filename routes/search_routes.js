const express = require("express");
const searchController= require('../controllers/search');
const validateToken = require('../middleware/uservalidation');
const router = express.Router();

router.get('/date',  searchController.dateSearch);

module.exports =router;