import multer from "multer";
import path from "path";

export const createMulter = (folderName) => {
  const storage = multer.diskStorage({
    destination(req, file, cb) {
      cb(null, `src/uploads/${folderName}`);
    },

    filename(req, file, cb) {
      cb(
        null,
        Date.now() +
          "-" +
          Math.round(Math.random() * 1e9) +
          path.extname(file.originalname),
      );
    },
  });

  const fileFilter = (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, JPG,PNG, and WEBP files are allowed."), false);
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  });
};
