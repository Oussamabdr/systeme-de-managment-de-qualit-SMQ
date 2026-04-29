const projectService = require("../services/project.service");
const { computeProjectProgress } = require("../services/project-progress.service");
const { validationSchemas } = require("../utils/validation");

const projectSchema = validationSchemas.project;
const assignSchema = validationSchemas.assignProcess || require("zod").z.object({
  processIds: require("zod").z.array(require("zod").z.string()).default([]),
});

async function listProjects(_req, res, next) {
  try {
    const data = await projectService.listProjects();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getProject(req, res, next) {
  try {
    const data = await projectService.getProjectById(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function createProject(req, res, next) {
  try {
    const payload = projectSchema.parse(req.body);
    const data = await projectService.createProject(payload);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function updateProject(req, res, next) {
  try {
    const payload = projectSchema.partial().parse(req.body);
    const data = await projectService.updateProject(req.params.id, payload);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function deleteProject(req, res, next) {
  try {
    await projectService.deleteProject(req.params.id);
    res.json({ success: true, message: "Project deleted" });
  } catch (error) {
    next(error);
  }
}

async function assignProcesses(req, res, next) {
  try {
    const payload = assignSchema.parse(req.body);
    const data = await projectService.assignProcesses(req.params.id, payload.processIds);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getProjectProgress(req, res, next) {
  try {
    const data = await computeProjectProgress(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  assignProcesses,
  getProjectProgress,
};
