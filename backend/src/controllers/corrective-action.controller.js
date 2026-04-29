const correctiveActionService = require("../services/corrective-action.service");
const { validationSchemas } = require("../utils/validation");
const { z } = require("zod");

const actionSchema = validationSchemas.correctiveAction;

const listSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "DONE", "CANCELLED"]).optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  effectivenessStatus: z.enum(["PENDING", "VERIFIED", "NOT_EFFECTIVE"]).optional(),
  nonConformityId: z.string().optional(),
  projectId: z.string().optional(),
  processId: z.string().optional(),
  ownerId: z.string().optional(),
  mine: z.enum(["true", "false"]).optional(),
});

async function listActions(req, res, next) {
  try {
    const filters = listSchema.parse(req.query);
    const data = await correctiveActionService.listActions(filters, req.user);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getAction(req, res, next) {
  try {
    const data = await correctiveActionService.getActionById(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function createAction(req, res, next) {
  try {
    const payload = actionSchema.parse(req.body);
    const data = await correctiveActionService.createAction(payload, req.user);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function updateAction(req, res, next) {
  try {
    const payload = actionSchema.partial().parse(req.body);
    const data = await correctiveActionService.updateAction(req.params.id, payload, req.user);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function deleteAction(req, res, next) {
  try {
    await correctiveActionService.deleteAction(req.params.id);
    res.json({ success: true, message: "Corrective action deleted" });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listActions,
  getAction,
  createAction,
  updateAction,
  deleteAction,
};
