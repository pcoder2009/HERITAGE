const express = require("express");
const siteController= require('../controllers/site');
const router = express.Router();

router.post("/about",siteController.about_us)

router.put("/update/about",siteController.update_about)

router.get("/get/facilities",siteController.select_facilities)

router.get("/get/facilities/id",siteController.select_facilities_id)

router.post("/add/facilities", siteController.loadImageToBuffer.single('images'), siteController.add_facilities)

router.put("/update/facilities", siteController.loadImageToBuffer.single('images'), siteController.update_facilities)

router.post("/delete/facilities",siteController.delete_facilities)

router.post("/add/policy",siteController.add_policy)

router.put("/update/policy",siteController.update_policy)

router.get("/get/policy",siteController.select_policy)

router.post("/delete/policy",siteController.delete_policy)

router.post("/addFaq",siteController.add_faq)

router.put("/update/faq",siteController.update_faq)

router.get("/get/faq",siteController.select_faq)

router.post("/delete/faq",siteController.delete_faq)

router.post("/add/RoomAmenities",siteController.add_room_amenities)

router.put("/update/RoomAmenities",siteController.update_room_amenities)

router.get("/get/RoomAmenities",siteController.select_room_amenities)

router.post("/delete/RoomAmenities",siteController.delete_room_amenities)

router.put("/update/contactUs",siteController.update_contact_us)

router.get("/get/contactUs",siteController.select_contactUs)

router.post("/add/site_banner", siteController.loadImageToBuffer.array('image'), siteController.add_site_banner)

router.put("/update/site_banner", siteController.loadImageToBuffer.array('image'), siteController.edit_site_banner)

router.get("/get/site_banner",siteController.select_site_banner)

router.get("/get/site_banner_Id",siteController.select_site_banner_id)

router.post("/delete/site_banner",  siteController.delete_site_banner)

module.exports =router;