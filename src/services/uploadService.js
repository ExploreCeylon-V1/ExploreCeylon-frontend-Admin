const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL)
  ? import.meta.env.VITE_API_BASE_URL
  : "http://localhost:8080";

function getAuthToken() {
  return localStorage.getItem("ec_admin_token") || localStorage.getItem("exploreCeylonToken");
}

function getAuthHeader() {
  const token = getAuthToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

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
  // Uploads a single image -> returns { imageUrl, fileName, success, message }
  uploadSingle: async (file, folder = "destinations") => {
    validateFile(file);

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE}/api/v1/upload/single?folder=${folder}`, {
      method: "POST",
      // ⚠️ Content-Type header එක manual set කරන්න එපා —
      // FormData යවනකොට browser eka automatically multipart boundary එක සමග header eka set කරයි
      headers: getAuthHeader(),
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to upload image: ${response.status}`);
    }

    return await response.json();
  },

  // Uploads multiple images -> returns array of { imageUrl, fileName, success, message }
  uploadMultiple: async (files, folder = "destinations") => {
    files.forEach(validateFile);

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const response = await fetch(`${API_BASE}/api/v1/upload/multiple?folder=${folder}`, {
      method: "POST",
      headers: getAuthHeader(),
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to upload images: ${response.status}`);
    }

    return await response.json();
  },

  // Deletes an image from S3 given its full URL
  deleteImage: async (imageUrl) => {
    const response = await fetch(`${API_BASE}/api/v1/upload?imageUrl=${encodeURIComponent(imageUrl)}`, {
      method: "DELETE",
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete image: ${response.status}`);
    }
  },
};

export default uploadService;