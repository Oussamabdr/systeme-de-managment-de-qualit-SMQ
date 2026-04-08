const express = require("express");
const userController = require("../controllers/user.controller");
const { checkRole } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/", checkRole("ADMIN", "PROJECT_MANAGER"), userController.listUsers);
router.post("/", checkRole("ADMIN"), userController.createUser);
router.patch("/:id", checkRole("ADMIN"), userController.updateUser);
router.delete("/:id", checkRole("ADMIN"), userController.deleteUser);

module.exports = router;
