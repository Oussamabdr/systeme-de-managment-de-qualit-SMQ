const bcrypt = require("bcryptjs");
const userRepository = require("../repositories/user.repository");
const ApiError = require("../utils/apiError");
const { signToken } = require("../utils/jwt");

async function register(payload) {
  const existing = await userRepository.findByEmail(payload.email);
  if (existing) {
    throw new ApiError(409, "Email already exists");
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const user = await userRepository.createUser({
    fullName: payload.fullName,
    email: payload.email,
    passwordHash,
    role: payload.role,
  });

  const token = signToken({ userId: user.id, role: user.role });
  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
    token,
  };
}

async function login(payload) {
  const user = await userRepository.findByEmail(payload.email);
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isValid = await bcrypt.compare(payload.password, user.passwordHash);
  if (!isValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = signToken({ userId: user.id, role: user.role });
  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
    token,
  };
}

module.exports = { register, login };
