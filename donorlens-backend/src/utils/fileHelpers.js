import path from "path";

// F08: application/msword and DOCX were removed from the allowlist. No upload
// route or frontend form sends either today, and legacy .doc (application/x-cfb)
// can't be reliably told apart from other OLE-compound-file formats by magic
// bytes, so it can't be verified. Re-add DOCX here (and to `documents`) if a
// real need for Word documents comes up later.
export const ALLOWED_FILE_TYPES = {
  images: ["image/jpeg", "image/png", "image/webp", "image/jpg"],
  documents: ["application/pdf"],
  all: ["image/jpeg", "image/png", "image/webp", "image/jpg", "application/pdf"],
};

// Maps a file-type-detected { ext, mime } to the mimetype we treat as "the"
// canonical value for that ext, since detected and declared mimetypes are
// compared as strings. file-type reports "jpg" files as mime "image/jpeg"
// (never "image/jpg"), so normalise the client-declared value before compare.
export const normalizeMimetype = (mimetype) =>
  mimetype === "image/jpg" ? "image/jpeg" : mimetype;

export const FILE_SIZE_LIMITS = {
  image: 5 * 1024 * 1024,
  document: 10 * 1024 * 1024,
  default: 5 * 1024 * 1024,
};

export const getFileCategory = (mimetype) => {
  if (ALLOWED_FILE_TYPES.images.includes(mimetype)) {
    return "image";
  }
  if (ALLOWED_FILE_TYPES.documents.includes(mimetype)) {
    return "document";
  }
  return "unknown";
};

export const getFileExtension = (filename) => {
  return path.extname(filename);
};

export const generateUniqueFilename = (originalName) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const fileExtension = getFileExtension(originalName);
  const fileNameWithoutExt = path.basename(originalName, fileExtension);
  return `${timestamp}-${randomString}-${fileNameWithoutExt}${fileExtension}`;
};
