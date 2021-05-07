const express = require("express");
const siteController= require('../controllers/site');
const router = express.Router();

router.post("/about",siteController.about_us)

router.put("/update/about",siteController.update_about)

router.post("/facilities",siteController.select_facilities)

router.put("/update/facilities",siteController.update_facilities)

router.put("/update/policy",siteController.update_policy)

router.get("/get/policy",siteController.select_policy)

router.post("/addFaq",siteController.add_faq)

router.put("/update/faq",siteController.update_faq)

router.get("/get/faq",siteController.select_faq)

router.post("/add/RoomAmenities",siteController.add_room_amenities)

router.put("/update/RoomAmenities",siteController.update_room_amenities)

router.get("/get/RoomAmenities",siteController.select_room_amenities)

router.put("/update/contactUs",siteController.update_contact_us)

router.get("/get/contactUs",siteController.select_contactUs)

module.exports =router;