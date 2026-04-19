const express = require("express");
const correctiveActionController = require("../controllers/corrective-action.controller");
const { authorize } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/", authorize("ADMIN", "PROJECT_MANAGER", "CAQ"), correctiveActionController.listActions);
router.get("/:id", authorize("ADMIN", "PROJECT_MANAGER", "CAQ"), correctiveActionController.getAction);
router.post("/", authorize("ADMIN", "PROJECT_MANAGER", "CAQ"), correctiveActionController.createAction);
router.patch("/:id", authorize("ADMIN", "PROJECT_MANAGER", "CAQ"), correctiveActionController.updateAction);
router.delete("/:id", authorize("ADMIN", "CAQ"), correctiveActionController.deleteAction);

module.exports = router;
