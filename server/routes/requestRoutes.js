import express from "express";
import { createRequest, listRequests, updateRequestStatus } from "../controllers/requestController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.route("/").get(listRequests).post(createRequest);
router.patch("/:id", updateRequestStatus);

export default router;
