import cors from "cors";
import express from "express";
import chatRouter from "./routes/chat";
import projectsRouter from "./routes/projects";
export function createApp(frontendOrigin: string) {
  const app = express();

  app.use(cors({ origin: frontendOrigin }));
  app.use(express.json({ limit: "1mb" }));
  app.use("/api/chat", chatRouter);
  app.use("/api/projects", projectsRouter);

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  return app;
}
