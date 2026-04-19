const { z } = require("zod");
const authService = require("../services/auth.service");

const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "CAQ"]).default("TEAM_MEMBER"),
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

async function register(req, res, next) {
  try {
    const payload = registerSchema.parse(req.body);
    const result = await authService.register(payload);
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await authService.login(payload);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

async function me(req, res) {
  res.json({ success: true, user: req.user });
}

module.exports = { register, login, me };
