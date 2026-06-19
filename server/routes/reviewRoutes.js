import express from "express";
import { createReview, listReviews } from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.route("/").get(listReviews).post(createReview);

export default router;
