import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import "express-async-errors";

// Routes
import statsRoutes from "./src/server/routes/statsRoutes";
import authRoutes from "./src/server/routes/authRoutes";
import aiRoutes from "./src/server/routes/aiRoutes";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security & Middleware
  app.use(helmet({
    contentSecurityPolicy: false,
  }));
  app.use(cors());
  app.use(morgan("dev"));
  app.use(express.json());

  // API Routes MUST BE BEFORE Vite middleware
  app.use("/api/stats", statsRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/ai", aiRoutes);

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "Zewail Academy Enterprise Backend" });
  });

  // Vite middleware for development (should be last before error handler)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Global Error Handler (must be last)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Backend Error:", err);
    res.status(err.status || 500).json({
      error: err.message || "Internal Server Error",
      timestamp: new Date().toISOString()
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Professional Backend running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
