import express from "express";

import { createCampaign } from "../../controllers/campaigns/createCampaign.controller.js";
import { getMyCampaignsController } from "../../controllers/campaigns/getMyCampaigns.controller.js";
import { getSingleCampaignController } from "../../controllers/campaigns/getSingleCampaign.controller.js";
import { updateCampaignController } from "../../controllers/campaigns/updateCampaign.controller.js";
import { deleteCampaignController } from "../../controllers/campaigns/deleteCampaign.controller.js";
import { getAllCampaignsController } from "../../controllers/campaigns/getAllCampaigns.controller.js";
import { getPublicSingleCampaignController } from "../../controllers/campaigns/getPublicSingleCampaign.controller.js";

import {
  authenticateToken,
  authorizeRoles,
} from "../../middleware/auth.middleware.js";
import upload, { uploadImageOnly } from "../../middleware/upload.middleware.js";
import { validateFiles } from "../../middleware/fileValidation.middleware.js";
import { ALLOWED_FILE_TYPES } from "../../utils/fileHelpers.js";

const router = express.Router();

router.post(
  "/add-campaign",
  authenticateToken,
  uploadImageOnly.single("coverImage"),
  validateFiles({ allowedTypes: ALLOWED_FILE_TYPES.images }),
  createCampaign,
);

router.get("/get-my-campaigns", authenticateToken, getMyCampaignsController);

router.get(
  "/get-my-campaign/:campaignId",
  authenticateToken,
  getSingleCampaignController,
);

router.put(
  "/update-campaign/:campaignId",
  authenticateToken,
  uploadImageOnly.single("coverImage"),
  validateFiles({ allowedTypes: ALLOWED_FILE_TYPES.images }),
  updateCampaignController,
);

router.delete(
  "/delete-campaign/:campaignId",
  authenticateToken,
  deleteCampaignController,
);

router.get("/get-all-campaigns", getAllCampaignsController);

router.get("/get-all-campaigns/:campaignId", getPublicSingleCampaignController);

export default router;
