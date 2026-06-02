import express from "express";
import { createUser, loginUser, bootstrapAdmin, verifyToken } from "../controllers/authController";

const router = express.Router();

// Public routes
router.post("/login", loginUser);
router.post("/create-user", createUser);
router.post("/bootstrap-admin", bootstrapAdmin);

// Protected route
router.post("/verify-token", verifyToken);

export default router;
