const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const env = require("./config/env");
const apiRoutes = require("./routes");
const { notFound, errorHandler } = require("./middlewares/error.middleware");

const app = express();

// CORS configuration: allow all origins for serverless deployment
const corsOptions = {
	origin: true, // Allow all origins
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan("dev"));
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

app.use("/api", apiRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
