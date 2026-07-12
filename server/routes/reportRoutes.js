import express from "express";
import { createReport } from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";
import { reportLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

router.use(protect);
router.post("/", reportLimiter, createReport);

export default router;
