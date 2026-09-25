import { fileTypeFromBuffer } from "file-type";
import { FileValidationError } from "../utils/errors.js";
import {
  FILE_SIZE_LIMITS,
  getFileCategory,
  normalizeMimetype,
} from "../utils/fileHelpers.js";

/**
 * F08: verifies file *content*, not just the client-supplied `file.mimetype`
 * (which the client fully controls and multer's fileFilter trusts as-is).
 *
 * For every uploaded file this:
 *   1. Sniffs the real type from its magic bytes (file-type).
 *   2. Rejects it if the detected type isn't on the allowlist for that field
 *      (`options.fieldRules[file.fieldname]`, falling back to
 *      `options.allowedTypes`).
 *   3. Rejects it if the detected type doesn't match the client-declared
 *      `file.mimetype` -- this is what catches e.g. a JPG renamed to .pdf.
 *   4. Rejects it if its size is over the limit for its *detected* category
 *      (image/document), not whatever mimetype the client claimed.
 *
 * Requires `file.buffer` (multer memory storage), so it must run after
 * multer and before any upload to Cloudinary.
 *
 * @param {Object} [options]
 * @param {number} [options.minFiles] - minimum total files required
 * @param {number} [options.maxFiles] - maximum total files allowed
 * @param {string[]} [options.allowedTypes] - default allowlist for every field
 * @param {Object<string,string[]>} [options.fieldRules] - per-field allowlist
 *   (multer field name -> mimetypes), overrides `allowedTypes` for that field
 * @param {number} [options.maxSize] - overrides the per-category size limit
 */
export const validateFiles = (options = {}) => {
  // Fixed typo: validatteFiles → validateFiles
  return async (req, res, next) => {
    try {
      // Handle different multer configurations
      let filesArray = [];

      if (req.files) {
        // When using uploadFields(), req.files is an object like:
        // { registrationCertificate: [file], additionalDoc1: [file] }
        if (Array.isArray(req.files)) {
          // uploadArray() or uploadAny() returns an array
          filesArray = req.files;
        } else {
          // uploadFields() returns an object, convert to array
          filesArray = Object.values(req.files).flat();
        }
      } else if (req.file) {
        // uploadSingle() returns a single file
        filesArray = [req.file];
      }

      // Check minimum files requirement
      if (options.minFiles && filesArray.length < options.minFiles) {
        throw new FileValidationError(
          `At least ${options.minFiles} file(s) required`,
        );
      }

      // Check maximum files limit
      if (options.maxFiles && filesArray.length > options.maxFiles) {
        throw new FileValidationError(
          `Maximum ${options.maxFiles} file(s) allowed`,
        );
      }

      // Validate each file's actual content (sequential: keeps error
      // messages in file order and avoids buffering every buffer's
      // detection promise in memory at once for large multi-file requests)
      for (let index = 0; index < filesArray.length; index++) {
        const file = filesArray[index];
        const label = `File ${index + 1} (${file.originalname})`;
        const allowedTypes =
          (options.fieldRules && options.fieldRules[file.fieldname]) ||
          options.allowedTypes;

        if (!file.buffer) {
          // Should never happen with memory storage, but fail closed rather
          // than let an unverifiable file through.
          throw new FileValidationError(`${label} could not be read.`);
        }

        // 1) Sniff the real type from the file's bytes.
        const detected = await fileTypeFromBuffer(file.buffer);

        if (!detected) {
          throw new FileValidationError(
            `${label} could not be verified. Its content does not match a supported file type.`,
          );
        }

        // 2) Detected type must be on the allowlist for this field.
        if (allowedTypes && !allowedTypes.includes(detected.mime)) {
          throw new FileValidationError(
            `${label} has an invalid file type (detected: ${detected.mime}). Allowed types: ${allowedTypes.join(", ")}`,
          );
        }

        // 3) Detected type must match what the client declared. Catches a
        // renamed file even when the declared mimetype happens to be on the
        // allowlist (e.g. a JPG renamed to .pdf and sent as image/jpeg).
        const declaredMime = normalizeMimetype(file.mimetype);
        if (detected.mime !== declaredMime) {
          throw new FileValidationError(
            `${label} content does not match its declared type (declared: ${file.mimetype}, detected: ${detected.mime}).`,
          );
        }

        // 4) Size limit is picked from the *detected* category, not the
        // client-declared mimetype.
        const category = getFileCategory(detected.mime);
        const maxSize =
          options.maxSize ||
          FILE_SIZE_LIMITS[category] ||
          FILE_SIZE_LIMITS.default;

        if (file.size > maxSize) {
          throw new FileValidationError(
            `${label} exceeds maximum size of ${maxSize / (1024 * 1024)}MB`,
          );
        }
      }

      // Attach file metadata to request for later use
      req.fileMetadata = {
        count: filesArray.length,
        totalSize: filesArray.reduce((sum, file) => sum + file.size, 0),
        types: [
          ...new Set(
            filesArray.map((f) => getFileCategory(normalizeMimetype(f.mimetype))),
          ),
        ],
      };

      next();
    } catch (error) {
      console.error("File validation error:", error.message);
      next(error);
    }
  };
};
