const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

const repoRootEnvPath = path.resolve(process.cwd(), ".env");
const backendEnvPath = path.resolve(__dirname, "../../.env");
const envPath = fs.existsSync(backendEnvPath) ? backendEnvPath : repoRootEnvPath;

dotenv.config({ path: envPath });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	console.warn("DATABASE_URL not set. Database operations will fail.");
	// Return dummy Prisma object that throws on access
	const handler = {
		get: () => {
			throw new Error("Database not configured: add DATABASE_URL environment variable");
		}
	};
	module.exports = new Proxy({}, handler);
} else {
	// Only require PrismaClient if DATABASE_URL is set
	const { PrismaClient } = require("@prisma/client");
	module.exports = new PrismaClient();
}
