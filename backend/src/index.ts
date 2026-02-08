import express from "express";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import configureRoutes from "./modules/routes";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const app = express();
app.use("/assets", express.static(path.join(__dirname, "../assets")));

app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5173",
      "http://localhost:4242",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use("/assets", express.static(path.join(__dirname, "../assets")));

app.get("/", (_, res) => {
  res.json({
    message: "GermanGains API is running",
    version: "1.0.0",
    routes: [
      "/",
      "/health",
      "/test-db",
      "/api/users/register",
      "/api/users/login",
      "/api/users/me",
      "/api/users/progress",
    ],
  });
});

app.get("/health", (_, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.get("/test-db", async (_, res) => {
  try {
    const { default: prisma } = await import("./lib/prisma");
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "Database connected" });
  } catch (err: any) {
    res
      .status(500)
      .json({ status: "DB connection failed", error: err.message });
  }
});
//Routes
configureRoutes(app);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running successfully on http://localhost:${PORT}`);
});
