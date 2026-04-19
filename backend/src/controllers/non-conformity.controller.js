const { z } = require("zod");
const nonConformityService = require("../services/non-conformity.service");

const nonConformitySchema = z.object({
  title: z.string().min(3),
  description: z.string().optional().nullable(),
  status: z.enum(["OPEN", "ANALYSIS", "CLOSED"]).default("OPEN"),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  detectedAt: z.coerce.date().optional(),
  processId: z.string().optional().nullable(),
});

const listSchema = z.object({
  status: z.enum(["OPEN", "ANALYSIS", "CLOSED"]).optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  processId: z.string().optional(),
});

async function listNonConformities(req, res, next) {
  try {
    const filters = listSchema.parse(req.query);
    const data = await nonConformityService.listNonConformities(filters);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getNonConformity(req, res, next) {
  try {
    const data = await nonConformityService.getNonConformityById(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function createNonConformity(req, res, next) {
  try {
    const payload = nonConformitySchema.parse(req.body);
    const data = await nonConformityService.createNonConformity(payload, req.user);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function updateNonConformity(req, res, next) {
  try {
    const payload = nonConformitySchema.partial().parse(req.body);
    const data = await nonConformityService.updateNonConformity(req.params.id, payload);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function deleteNonConformity(req, res, next) {
  try {
    await nonConformityService.deleteNonConformity(req.params.id);
    res.json({ success: true, message: "Non-conformity deleted" });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listNonConformities,
  getNonConformity,
  createNonConformity,
  updateNonConformity,
  deleteNonConformity,
};
