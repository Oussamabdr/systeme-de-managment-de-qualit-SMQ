const { z } = require("zod");
const userService = require("../services/user.service");

const createUserSchema = z.object({
  fullName: z.string().min(2),
  email: z.email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"]).default("TEAM_MEMBER"),
});

const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"]).optional(),
});

async function listUsers(_req, res, next) {
  try {
    const users = await userService.listUsers();
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
}

async function createUser(req, res, next) {
  try {
    const payload = createUserSchema.parse(req.body);
    const user = await userService.createUser(payload);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const payload = updateUserSchema.parse(req.body);
    const user = await userService.updateUser(req.params.id, payload);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

async function deleteUser(req, res, next) {
  try {
    await userService.deleteUser(req.params.id);
    res.json({ success: true, message: "User deleted" });
  } catch (error) {
    next(error);
  }
}

module.exports = { listUsers, createUser, updateUser, deleteUser };
