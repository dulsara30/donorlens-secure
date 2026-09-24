import { Router } from "express";
import { adminRegisterController } from "../../controllers/ngoadmin/NgoAdminRegisterController.js";
import { uploadFields } from "../../middleware/upload.middleware.js";
import { validateFiles } from "../../middleware/fileValidation.middleware.js";
import { ALLOWED_FILE_TYPES } from "../../utils/fileHelpers.js";
import { registerLimiter } from "../../middleware/rateLimit.middleware.js";
import ResubmissionNgoRequestController from "../../controllers/auth/ResubmissionNgoRequestController.js";

const ngoAdminRouter = Router();

ngoAdminRouter.post(
  "/register-ngo",
  registerLimiter,
  uploadFields([
    { name: "registrationCertificate", maxCount: 1 }, // Required, 1 file
    { name: "additionalDoc1", maxCount: 1 }, // Optional
    { name: "additionalDoc2", maxCount: 1 }, // Optional
    { name: "additionalDoc3", maxCount: 1 },
  ]),
  validateFiles({
    allowedTypes: ALLOWED_FILE_TYPES.all,
    minFiles: 1,
    maxFiles: 4,
  }),
  adminRegisterController,
);

ngoAdminRouter.put(
  "/resubmit-ngo",
  uploadFields([
    { name: "registrationCertificate", maxCount: 1 }, // Required, 1 file
    { name: "additionalDoc1", maxCount: 1 }, // Optional
    { name: "additionalDoc2", maxCount: 1 }, // Optional
    { name: "additionalDoc3", maxCount: 1 },
  ]),
  validateFiles({
    allowedTypes: ALLOWED_FILE_TYPES.all,
    minFiles: 1,
    maxFiles: 4,
  }),
  ResubmissionNgoRequestController,
);

export default ngoAdminRouter;
