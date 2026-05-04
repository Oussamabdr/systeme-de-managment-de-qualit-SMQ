const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

const repoRootEnvPath = path.resolve(process.cwd(), ".env");
const backendEnvPath = path.resolve(__dirname, "../../.env");
const envPath = fs.existsSync(backendEnvPath) ? backendEnvPath : repoRootEnvPath;

dotenv.config({ path: envPath });

const connectionString = process.env.DATABASE_URL;

function createDisabledProxy(msg) {
	// Outer proxy to represent the Prisma client
	const methodThrower = () => {
		throw new Error(msg);
	};

	// Inner proxy that represents a model (e.g., prisma.user)
	const modelHandler = {
		get() {
			return methodThrower;
		},
		apply() {
			return methodThrower();
		},
	};

	const modelProxy = new Proxy(methodThrower, modelHandler);

	const clientHandler = {
		get() {
			return modelProxy;
		},
	};

	return new Proxy({}, clientHandler);
}

if (!connectionString) {
	console.warn("DATABASE_URL not set. Database operations will fail.");
	module.exports = createDisabledProxy(
		"Database not configured: set DATABASE_URL environment variable to a reachable Postgres instance",
	);
} else if (/localhost|127\.0\.0\.1|::1/.test(connectionString) && process.env.FORCE_LOCAL_DB !== "true") {
	console.warn("DATABASE_URL points to localhost. Skipping local DB connection in this environment.");
	module.exports = createDisabledProxy(
		"Local database detected but not accessible from this environment. Set DATABASE_URL to a reachable DB or set FORCE_LOCAL_DB=true to allow local DB connections",
	);
} else {
	// Only require PrismaClient if DATABASE_URL is set and allowed
	const { PrismaClient } = require("@prisma/client");
	module.exports = new PrismaClient();
}
