import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { prisma } from "../../infra/prisma/client.js";
import { requireAuth } from "../../middleware/index.js";
import { success, AppError } from "../../utils/index.js";
import { ErrorCode } from "../../shared/errors.js";

const uploadRoot = process.env.UPLOAD_ROOT ?? "./data/uploads";
const maxImageSizeMb = Number(process.env.UPLOAD_MAX_IMAGE_SIZE_MB ?? 5);

// Ensure upload directory exists
fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dateDir = new Date().toISOString().slice(0, 10);
    const dir = path.join(uploadRoot, dateDir);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: maxImageSizeMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("不支持的图片格式"));
    }
  },
});

const router = Router();

// Upload image
router.post("/upload", requireAuth, upload.single("file"), async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      throw AppError.badRequest(ErrorCode.InternalError, "请选择文件");
    }

    const relativePath = path.relative(uploadRoot, file.path);
    const publicBase = process.env.PUBLIC_UPLOAD_BASE_URL ?? "/uploads";

    // Generate thumbnails
    const thumbDir = path.join(path.dirname(file.path), "thumbs");
    fs.mkdirSync(thumbDir, { recursive: true });

    const basename = path.basename(file.filename, path.extname(file.filename));
    const thumb200 = path.join(thumbDir, `${basename}_200.jpg`);
    const thumb600 = path.join(thumbDir, `${basename}_600.jpg`);

    await sharp(file.path).resize(200, 200, { fit: "cover" }).jpeg({ quality: 80 }).toFile(thumb200);
    await sharp(file.path).resize(600, 600, { fit: "inside" }).jpeg({ quality: 85 }).toFile(thumb600);

    // Get dimensions
    const metadata = await sharp(file.path).metadata();

    // Save to database
    const fileRecord = await prisma.file.create({
      data: {
        userId: BigInt(req.userId!),
        originalName: file.originalname,
        storageType: "local",
        relativePath,
        thumbPath: path.relative(uploadRoot, thumb200),
        url: `${publicBase}/${relativePath}`,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        width: metadata.width ?? null,
        height: metadata.height ?? null,
        business: "post",
        status: 0,
      },
    });

    success(res, {
      fileId: fileRecord.fileId.toString(),
      url: fileRecord.url,
      thumbUrl: `${publicBase}/${fileRecord.thumbPath}`,
      mimeType: fileRecord.mimeType,
      sizeBytes: fileRecord.sizeBytes,
      width: fileRecord.width,
      height: fileRecord.height,
    }, req.traceId);
  } catch (error) {
    next(error);
  }
});

// Get file info
router.get("/:id", async (req, res, next) => {
  try {
    const fileId = BigInt(req.params.id!);
    const file = await prisma.file.findUnique({ where: { fileId } });
    if (!file || file.status === 3) {
      throw AppError.badRequest(ErrorCode.InternalError, "文件不存在");
    }

    success(res, {
      fileId: file.fileId.toString(),
      url: file.url,
      thumbUrl: file.thumbPath ? `${process.env.PUBLIC_UPLOAD_BASE_URL ?? "/uploads"}/${file.thumbPath}` : null,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      width: file.width,
      height: file.height,
      status: file.status,
    }, req.traceId);
  } catch (error) {
    next(error);
  }
});

export default router;
