const { loadEnv } = require("./load-env");

loadEnv();

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
} else if (/localhost|127\.0\.0\.1|::1/.test(connectionString) && process.env.DISABLE_LOCAL_DB === "true") {
	console.warn("DATABASE_URL points to localhost and DISABLE_LOCAL_DB=true. Skipping local DB connection.");
	module.exports = createDisabledProxy(
		"Local database is disabled. Remove DISABLE_LOCAL_DB=true to connect to local Postgres",
	);
} else {
	// Only require PrismaClient if DATABASE_URL is set and allowed
	const { PrismaClient } = require("@prisma/client");
	module.exports = new PrismaClient();
}
