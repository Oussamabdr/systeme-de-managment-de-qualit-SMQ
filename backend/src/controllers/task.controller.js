const taskService = require("../services/task.service");
const { validationSchemas } = require("../utils/validation");

const taskSchema = validationSchemas.task;

async function listTasks(req, res, next) {
  try {
    const data = await taskService.listTasksForUser(req.user, req.query);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getTask(req, res, next) {
  try {
    const data = await taskService.getTaskByIdForUser(req.params.id, req.user);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function createTask(req, res, next) {
  try {
    const payload = taskSchema.parse(req.body);
    const data = await taskService.createTask({ ...payload, __user: req.user });
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function updateTask(req, res, next) {
  try {
    const payload = taskSchema.partial().parse(req.body);
    const data = await taskService.updateTask(req.params.id, { ...payload, __user: req.user });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function deleteTask(req, res, next) {
  try {
    await taskService.deleteTask(req.params.id);
    res.json({ success: true, message: "Task deleted" });
  } catch (error) {
    next(error);
  }
}

async function kanban(req, res, next) {
  try {
    const data = await taskService.kanbanForUser(req.user, req.query.projectId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  kanban,
};
