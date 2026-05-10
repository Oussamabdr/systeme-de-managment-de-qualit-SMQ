const express = require("express");
const authController = require("../controllers/auth.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

// Test endpoint to verify route handler works
router.post("/login-test", (req, res) => {
  res.json({ success: true, message: "Login test OK", body: req.body });
});

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", authenticate, authController.me);

module.exports = router;
