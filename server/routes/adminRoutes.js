import express from "express";
import { getAdminStats, listAdminReports, listAdminUsers, updateReport } from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.use(protect, adminOnly);
router.get("/stats", getAdminStats);
router.get("/users", listAdminUsers);
router.get("/reports", listAdminReports);
router.patch("/reports/:id", updateReport);

export default router;
