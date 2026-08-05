import {
  adminPost,
  adminDelete,
} from "./adminApiClient";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

function validateFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`"${file.name}" is not a supported image type (only JPG, PNG, WEBP allowed)`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`"${file.name}" exceeds the 5MB size limit`);
  }
}

export const uploadService = {
  uploadSingle: async (file, folder = "destinations") => {
    validateFile(file);
    const formData = new FormData();
    formData.append("file", file);
    return adminPost(`/api/v1/upload/single?folder=${folder}`, formData);
  },

  uploadMultiple: async (files, folder = "destinations") => {
    files.forEach(validateFile);
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    return adminPost(`/api/v1/upload/multiple?folder=${folder}`, formData);
  },

  deleteImage: async (imageUrl) => {
    return adminDelete(`/api/v1/upload?imageUrl=${encodeURIComponent(imageUrl)}`);
  },
};

export default uploadService;