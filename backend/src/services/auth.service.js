const bcrypt = require("bcryptjs");
const userRepository = require("../repositories/user.repository");
const ApiError = require("../utils/apiError");
const { signToken } = require("../utils/jwt");

const DEFAULT_OP_TIMEOUT_MS = 10000;

function withTimeout(promise, ms = DEFAULT_OP_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timed out')), ms)),
  ]);
}

async function register(payload) {
  try {
    const result = await withTimeout((async () => {
      const existing = await userRepository.findByEmail(payload.email);
      if (existing) {
        throw new ApiError(409, 'Email already exists');
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
    })());

    return result;
  } catch (err) {
    if (err.message === 'Operation timed out') throw new ApiError(504, 'Auth operation timed out');
    throw err;
  }
}

async function login(payload) {
  try {
    const result = await withTimeout((async () => {
      const user = await userRepository.findByEmail(payload.email);
      if (!user) {
        throw new ApiError(401, 'Invalid email or password');
      }

      const isValid = await bcrypt.compare(payload.password, user.passwordHash);
      if (!isValid) {
        throw new ApiError(401, 'Invalid email or password');
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
    })());

    return result;
  } catch (err) {
    if (err.message === 'Operation timed out') throw new ApiError(504, 'Auth operation timed out');
    throw err;
  }
}

module.exports = { register, login };
