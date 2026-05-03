const processService = require("../services/process.service");
const { computeProcessProgress } = require("../services/process-progress.service");
const processAssessmentService = require("../services/process-assessment.service");
const { validationSchemas } = require("../utils/validation");
const { z } = require("zod");

const processSchema = validationSchemas.process;
const assessmentSchema = z.object({
  items: z.array(
    z.object({
      code: z.string().min(1),
      name: z.string().min(1),
      score: z.coerce.number().min(0).max(100),
      veracityLevel: z.enum(["FALSE", "RATHER_FALSE", "RATHER_TRUE", "TRUE"]).default("FALSE"),
      notes: z.string().optional().default(""),
    }),
  ).min(1),
});

async function listProcesses(_req, res, next) {
  try {
    const data = await processService.listProcesses();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getProcess(req, res, next) {
  try {
    const data = await processService.getProcessById(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function createProcess(req, res, next) {
  try {
    const payload = processSchema.parse(req.body);
    const data = await processService.createProcess(payload);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function updateProcess(req, res, next) {
  try {
    const payload = processSchema.partial().parse(req.body);
    const data = await processService.updateProcess(req.params.id, payload);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function deleteProcess(req, res, next) {
  try {
    await processService.deleteProcess(req.params.id);
    res.json({ success: true, message: "Process deleted" });
  } catch (error) {
    next(error);
  }
}

async function getProcessProgress(req, res, next) {
  try {
    const data = await computeProcessProgress(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getProcessAssessment(req, res, next) {
  try {
    const data = await processAssessmentService.getProcessAssessment(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function saveProcessAssessment(req, res, next) {
  try {
    const payload = assessmentSchema.parse(req.body);
    const data = await processAssessmentService.saveProcessAssessment(req.params.id, payload.items);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listProcesses,
  getProcess,
  getProcessProgress,
  getProcessAssessment,
  saveProcessAssessment,
  createProcess,
  updateProcess,
  deleteProcess,
};
