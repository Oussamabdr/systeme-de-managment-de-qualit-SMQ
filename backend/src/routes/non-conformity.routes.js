const express = require("express");
const nonConformityController = require("../controllers/non-conformity.controller");
const { authorize } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/", authorize("ADMIN", "PROJECT_MANAGER", "CAQ"), nonConformityController.listNonConformities);
router.get("/:id", authorize("ADMIN", "PROJECT_MANAGER", "CAQ"), nonConformityController.getNonConformity);
router.post("/", authorize("ADMIN", "PROJECT_MANAGER", "CAQ"), nonConformityController.createNonConformity);
router.patch("/:id", authorize("ADMIN", "PROJECT_MANAGER", "CAQ"), nonConformityController.updateNonConformity);
router.delete("/:id", authorize("ADMIN", "CAQ"), nonConformityController.deleteNonConformity);

module.exports = router;
