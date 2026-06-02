import express from "express";
import { getHRAdvice, analyzeJobDec } from "../controllers/aiController";
import { authenticate } from "../middleware/authMiddleware";

const router = express.Router();

// Public or optionally protected AI routes
// We can protect with authenticate middleware if needed
router.post("/advice", getHRAdvice);
router.post("/analyze-job", analyzeJobDec);

export default router;
