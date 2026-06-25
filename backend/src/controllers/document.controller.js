const path = require("path");
const { z } = require("zod");
const documentService = require("../services/document.service");
const ApiError = require("../utils/apiError");

const metaSchema = z.object({
  processId: z.string().optional(),
  taskId: z.string().optional(),
});

async function uploadDocument(req, res, next) {
  try {
    if (!req.file) {
      throw new ApiError(400, "File is required");
    }

    const payload = metaSchema.parse(req.body);
    if (!payload.processId && !payload.taskId) {
      throw new ApiError(400, "processId or taskId is required");
    }

    await documentService.validateUploadScopeForUser(req.user, payload);

    const data = await documentService.createDocument({
      name: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: path.join("uploads", req.file.filename).replace(/\\/g, "/"),
      processId: payload.processId,
      taskId: payload.taskId,
      uploadedById: req.user.id,
    });

    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function listDocuments(req, res, next) {
  try {
    const data = await documentService.listDocumentsForUser(req.user);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function downloadDocument(req, res, next) {
  try {
    const doc = await documentService.getDocumentById(req.params.id);
    if (!doc) throw new ApiError(404, "Document not found");

    const filePath = path.resolve(process.cwd(), doc.path);
    res.download(filePath, doc.name);
  } catch (error) {
    next(error);
  }
}

module.exports = { uploadDocument, listDocuments, downloadDocument };
