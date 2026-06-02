import express from "express";
import { getStatsSummary } from "../controllers/statsController";
import { authenticate } from "../middleware/authMiddleware";

const router = express.Router();

// Protected route: require authentication
router.get("/summary", authenticate, getStatsSummary);

export default router;
