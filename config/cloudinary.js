const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Local uploads (no Cloudinary keys): served by index.js at /uploads, proxied by both Next apps.
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
const EXT = { jpeg: "jpg", jpg: "jpg", png: "png", webp: "webp", gif: "gif", "svg+xml": "svg", avif: "avif" };

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const configured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
);

/**
 * Store a base64 `data:image/...` upload and return the URL to save.
 * Anything that is not a data URL (an existing URL/path) is returned unchanged.
 * Without Cloudinary keys in development the file is written to uploads/<folder>/ and
 * "/uploads/<folder>/<file>" is saved — small API responses, real image URLs.
 * (Storing the data URL itself made responses multi-MB, which Next.js refuses to cache.)
 */
cloudinary.uploadImage = async (image, folder) => {
  if (typeof image !== "string" || !image.startsWith("data:image")) return image;
  if (configured) return (await cloudinary.uploader.upload(image, { folder })).secure_url;
  if (process.env.NODE_ENV === "production") throw new Error("Image upload is not configured (CLOUDINARY_* env vars).");

  const match = /^data:image\/([\w+.-]+);base64,(.+)$/s.exec(image);
  if (!match || !EXT[match[1]]) throw new Error("Unsupported image format.");
  const dir = path.join(UPLOAD_DIR, folder);
  await fs.promises.mkdir(dir, { recursive: true });
  const file = `${crypto.randomUUID()}.${EXT[match[1]]}`;
  await fs.promises.writeFile(path.join(dir, file), Buffer.from(match[2], "base64"));
  return `/uploads/${folder}/${file}`;
};

module.exports = cloudinary;
