const prisma = require("../config/prisma");
const ApiError = require("../utils/apiError");
const { verifyToken } = require("../utils/jwt");

function isTransientDbError(error) {
  const message = String(error?.message || "");
  const code = String(error?.code || "");

  return (
    code === "ECONNREFUSED"
    || message.includes("Server has closed the connection")
    || message.includes("Can't reach database server")
    || message.includes("Connection terminated unexpectedly")
  );
}

async function retryOnceOnTransientDbError(queryFn) {
  try {
    return await queryFn();
  } catch (error) {
    if (!isTransientDbError(error)) {
      throw error;
    }

    await prisma.$disconnect().catch(() => {});
    return queryFn();
  }
}

async function authenticate(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "Unauthorized");
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    const user = await retryOnceOnTransientDbError(() => prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, fullName: true, role: true },
    }));

    if (!user) {
      throw new ApiError(401, "Invalid token");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error?.name === "TokenExpiredError") {
      return next(new ApiError(401, "Session expired. Please login again."));
    }

    if (error?.name === "JsonWebTokenError") {
      return next(new ApiError(401, "Invalid token"));
    }

    next(error);
  }
}

function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Unauthorized"));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "Forbidden"));
    }

    return next();
  };
}

function checkRole(...roles) {
  return authorize(...roles);
}

async function checkOwnership(userId, taskId) {
  const task = await retryOnceOnTransientDbError(() => prisma.task.findUnique({
    where: { id: taskId },
    select: { assigneeId: true },
  }));

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  return task.assigneeId === userId;
}

async function enforceTaskOwnership(req, _res, next) {
  try {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }

    if (req.user.role !== "TEAM_MEMBER") {
      return next();
    }

    const isOwner = await checkOwnership(req.user.id, req.params.id);
    if (!isOwner) {
      throw new ApiError(403, "Forbidden");
    }

    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  authenticate,
  authorize,
  checkRole,
  checkOwnership,
  enforceTaskOwnership,
};
