const express = require("express");
const criteriaController = require("../controllers/criteria.controller");

const router = express.Router();

router.get("/", criteriaController.listCriteria);

module.exports = router;
