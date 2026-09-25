/**
 * Multer upload middleware configuration with memory storage and file validation
 *
 * @module upload.middleware
 *
 * @description
 * This module provides file upload middleware using multer with memory storage.
 * It validates file types against allowed MIME types and enforces file size limits.
 * Supports single file, multiple files, specific fields, and any file uploads.
 *
 * @example
 * // Single file upload on a specific field
 * import { uploadSingle } from './middleware/upload.middleware.js';
 *
 * app.post('/upload-avatar', uploadSingle('avatar'), (req, res) => {
 *   // req.file contains: { fieldname, originalname, encoding, mimetype, size, buffer }
 *   console.log(req.file);
 *   res.json({ message: 'Avatar uploaded successfully' });
 * });
 *
 * @example
 * // Multiple files on a single field with max count
 * import { uploadMultiple } from './middleware/upload.middleware.js';
 *
 * app.post('/upload-documents', uploadMultiple('documents', 3), (req, res) => {
 *   // req.files is an array of file objects
 *   console.log(req.files); // Array of 3 files max
 *   res.json({ count: req.files.length });
 * });
 *
 * @example
 * // Multiple different fields
 * import { uploadFields } from './middleware/upload.middleware.js';
 *
 * const fields = [
 *   { name: 'profilePhoto', maxCount: 1 },
 *   { name: 'documents', maxCount: 5 }
 * ];
 *
 * app.post('/upload-profile', uploadFields(fields), (req, res) => {
 *   // req.files contains an object with field names as keys
 *   console.log(req.files.profilePhoto); // Array with 1 file
 *   console.log(req.files.documents);    // Array with up to 5 files
 *   res.json(req.files);
 * });
 *
 * @example
 * // Any fields with up to 10 files total
 * import { uploadAny } from './middleware/upload.middleware.js';
 *
 * app.post('/upload-mixed', uploadAny(), (req, res) => {
 *   // req.files is an array of all uploaded files (max 10)
 *   console.log(req.files);
 *   res.json({ uploadedFiles: req.files.length });
 * });
 *
 * @example
 * // Error handling for file uploads
 * app.post('/upload', uploadSingle('file'), (err, req, res, next) => {
 *   if (err instanceof FileUploadError) {
 *     return res.status(400).json({ error: err.message });
 *   }
 *   next(err);
 * });
 *
 * @throws {FileUploadError} When file MIME type is not in ALLOWED_FILE_TYPES.all
 * @throws {Error} When file size exceeds FILE_SIZE_LIMITS.default (400 error from multer)
 * @throws {Error} When total files exceed 10 file limit
 *
 * @config {Object} Multer configuration
 * @config {Object} storage - Memory storage (files stored as Buffer in memory)
 * @config {Function} fileFilter - Validates MIME types against allowed file types
 * @config {Object} limits - File size and count restrictions
 * @config {number} limits.fileSize - Max file size in bytes (from FILE_SIZE_LIMITS.default)
 * @config {number} limits.files - Maximum 10 files per request
 *
 * @function uploadSingle
 * @param {string} fieldName - Form field name for single file upload
 * @returns {Function} Multer middleware for single file upload
 *
 * @function uploadMultiple
 * @param {string} fieldName - Form field name for multiple files
 * @param {number} [maxCount=5] - Maximum number of files to accept (default: 5)
 * @returns {Function} Multer middleware for multiple file upload
 *
 * @function uploadFields
 * @param {Array<Object>} fields - Array of field configuration objects
 * @param {string} fields[].name - Field name
 * @param {number} fields[].maxCount - Max files for this field
 * @returns {Function} Multer middleware for multiple named fields
 *
 * @function uploadAny
 * @returns {Function} Multer middleware accepting files from any field (max 10 total)
 *
 * @returns {Object} Default export is the configured multer instance
 */
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  ALLOWED_FILE_TYPES,
  FILE_SIZE_LIMITS,
} from "./../utils/fileHelpers.js";
import { FileUploadError } from "../utils/errors.js";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  try {
    if (!ALLOWED_FILE_TYPES.all.includes(file.mimetype)) {
      return cb(
        new FileUploadError(
          `File type ${file.mimetype} is not allowed. Allowed types: images (jpg, png, webp) and documents (pdf)`,
        ),
        false,
      );
    }

    cb(null, true);
  } catch (error) {
    cb(error, false);
  }
};

const imageOnlyFilter = (req, file, cb) => {
  try {
    // Allow only image mime types
    const allowedImages = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedImages.includes(file.mimetype)) {
      return cb(
        new FileUploadError(
          `Only image files are allowed for cover image. Allowed: jpg, png, webp`,
        ),
        false,
      );
    }

    cb(null, true);
  } catch (error) {
    cb(error, false);
  }
};

// F08: this is a ceiling only, so multer doesn't reject a document before it
// reaches file-type detection. The real per-category limits (5MB image,
// 10MB document) are enforced against the *detected* type in
// fileValidation.middleware.js, which runs right after this.
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.document,
    files: 10,
  },
});

export const uploadImageOnly = multer({
  storage,
  fileFilter: imageOnlyFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.default,
    files: 1,
  },
});

export const uploadSingle = (fieldName) => upload.single(fieldName);

export const uploadMultiple = (fieldName, maxCount = 5) =>
  upload.array(fieldName, maxCount);

export const uploadFields = (fileds) => upload.fields(fileds);

export const uploadAny = () => upload.any();

export default upload;
