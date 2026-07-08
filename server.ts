import app from "./server/app.js";
import { createServer as createViteServer } from "vite";
import express from "express";
import path from "path";
import { refreshExpiringTokens } from "./server/utils/tokenRefresh.js";

const PORT = 3000;

async function startServer() {
  // ─── Vite middleware for development ────────────────────
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Start 12-hour background token refresh interval (only runs in persistent local node dev environments)
  setInterval(() => {
    refreshExpiringTokens().catch(err => console.error("[Token Refresh Interval] Error:", err));
  }, 12 * 60 * 60 * 1000);
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
