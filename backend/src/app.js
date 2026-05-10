const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const env = require("./config/env");
const apiRoutes = require("./routes");
const { notFound, errorHandler } = require("./middlewares/error.middleware");

const app = express();

// Health check endpoint

// OPTIONS handler at the very top - before all other middleware
app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  res.status(204).end();
});

// CORS configuration
const corsOptions = {
	origin: true,
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(helmet());
// Temporarily disable morgan to test if it's causing timeouts
// app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.resolve(process.cwd(), env.uploadDir)));

app.get("/", (_req, res) => {
	res.json({
		success: true,
		message: "QMS backend is running",
		apiRoot: "/api",
		health: "/api/health",
	});
});

app.get("/test", (_req, res) => {
	res.json({ success: true, message: "Test endpoint works", timestamp: new Date().toISOString() });
});

app.use("/api", apiRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
