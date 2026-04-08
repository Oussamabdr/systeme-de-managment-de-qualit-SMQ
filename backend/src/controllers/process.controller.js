const { z } = require("zod");
const processService = require("../services/process.service");
const { computeProcessProgress } = require("../services/process-progress.service");

const processSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  responsiblePerson: z.string().min(2),
  inputs: z.array(z.string()).default([]),
  outputs: z.array(z.string()).default([]),
  indicators: z.array(z.object({
    name: z.string(),
    target: z.number().nonnegative(),
    current: z.number().nonnegative(),
    unit: z.string().optional(),
  })).default([]),
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

module.exports = {
  listProcesses,
  getProcess,
  getProcessProgress,
  createProcess,
  updateProcess,
  deleteProcess,
};
