const path = require("path");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	console.warn("DATABASE_URL is not defined. Database queries will fail. Set DATABASE_URL in environment variables to enable DB operations.");
}

const prisma = new PrismaClient();

module.exports = prisma;
