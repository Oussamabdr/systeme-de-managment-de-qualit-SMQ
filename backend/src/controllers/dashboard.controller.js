const dashboardService = require("../services/dashboard.service");
const { z } = require("zod");

const dashboardReportSchema = z.object({
  title: z.string().min(3).max(160),
  comment: z.string().min(3).max(1000),
  impact: z.string().max(1000).optional().default(""),
  requestedAction: z.string().max(1000).optional().default(""),
  destinationEmail: z.union([z.string().email(), z.literal("")]).optional().default(""),
  reportType: z.enum(["ESCALATION", "REQUEST_SUPPORT", "STATUS_UPDATE", "RISK_NOTE"]).default("ESCALATION"),
  includeCharts: z.boolean().optional().default(false),
  sendEmail: z.boolean().optional().default(false),
  chartContext: z.array(z.object({
    label: z.string(),
    value: z.string(),
    severity: z.string(),
  })).optional().default([]),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  source: z.enum(["OVERDUE_TASK", "DELAYED_PROJECT", "KPI_DEVIATION", "MANUAL"]).default("MANUAL"),
  targetPath: z.string().max(120).optional().nullable(),
});

async function getOverview(req, res, next) {
  try {
    const data = await dashboardService.getOverview(req.query.period);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getMyOverview(req, res, next) {
  try {
    const data = await dashboardService.getMyOverview(req.user.id, req.query.period);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function createReport(req, res, next) {
  try {
    const payload = dashboardReportSchema.parse(req.body);
    const data = await dashboardService.createDashboardReport(payload, req.user);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = { getOverview, getMyOverview, createReport };
