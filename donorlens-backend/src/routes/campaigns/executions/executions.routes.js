import express from "express";
import {
  createExecutionUpdate,
  getAllExecutionsByCampaign,
  getExecutionById,
  updateExecutionUpdate,
  deleteExecutionUpdate,
} from "../../../controllers/campaigns/executions/executions.controller.js";
import {
  authenticateToken,
  authorizeRoles,
} from "../../../middleware/auth.middleware.js";
import { uploadFields } from "../../../middleware/upload.middleware.js";
import { validateFiles } from "../../../middleware/fileValidation.middleware.js";
import { ALLOWED_FILE_TYPES } from "../../../utils/fileHelpers.js";

const router = express.Router();

// Create execution update
router.post(
  "/:campaignId/executions",
  authenticateToken,
  authorizeRoles("NGO_ADMIN"),
  uploadFields([
    { name: "evidencePhotos", maxCount: 5 },
    { name: "receipts", maxCount: 5 },
  ]),
  validateFiles({
    minFiles: 1,
    maxFiles: 15,
    // F08: evidencePhotos must be photos; receipts may be a photo of a
    // receipt or a scanned PDF.
    fieldRules: {
      evidencePhotos: ALLOWED_FILE_TYPES.images,
      receipts: ALLOWED_FILE_TYPES.all,
    },
  }),
  createExecutionUpdate,
);

// Get all execution updates for a specific campaign
router.get("/:campaignId/executions", getAllExecutionsByCampaign);

// Get a single execution update by ID
router.get("/:campaignId/executions/:executionId", getExecutionById);

// Update an execution update
router.patch(
  "/:campaignId/executions/:executionId",
  authenticateToken,
  authorizeRoles("NGO_ADMIN"),
  uploadFields([
    { name: "evidencePhotos", maxCount: 5 },
    { name: "receipts", maxCount: 5 },
  ]),
  validateFiles({
    minFiles: 0, // Files are optional for update
    maxFiles: 15,
    fieldRules: {
      evidencePhotos: ALLOWED_FILE_TYPES.images,
      receipts: ALLOWED_FILE_TYPES.all,
    },
  }),
  updateExecutionUpdate,
);

// Delete an execution update
router.delete(
  "/:campaignId/executions/:executionId",
  authenticateToken,
  authorizeRoles("NGO_ADMIN"),
  deleteExecutionUpdate,
);

export default router;
