const express = require("express");
const authController = require("../controllers/auth.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/test", (req, res) => {
	res.json({ success: true, message: "Auth test OK" });
});

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", authenticate, authController.me);

module.exports = router;
