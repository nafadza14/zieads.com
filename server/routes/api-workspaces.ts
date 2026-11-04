/*
  Workspaces (one per brand). Mounted at /api/workspaces. Always works on the signed in account,
  whatever workspace is active.
    GET    /api/workspaces            list, brand limit for the plan, accounts connected per workspace
    POST   /api/workspaces            { name }  create (Pro: 3 brands, Agency: 10)
    PATCH  /api/workspaces/:id        { name?, color? }
    DELETE /api/workspaces/:id        { confirm: "<name>" }  deletes the brand and all its data
*/
import { Router } from "express";
import { getAccountUserIdFromRequest } from "../supabaseServer.js";
import { WorkspaceError, createWorkspace, deleteWorkspace, listWorkspaces, renameWorkspace } from "../workspaces.js";

export const workspacesRouter = Router();

async function requireAccount(req: any, res: any, next: any) {
  const id = await getAccountUserIdFromRequest(req);
  if (!id) return res.status(401).json({ error: "Unauthorized" });
  req.accountId = id;
  next();
}

const fail = (res: any, e: any) => {
  if (e instanceof WorkspaceError) return res.status(e.status).json({ error: e.code, message: e.message });
  console.error("[workspaces]", e);
  res.status(500).json({ error: "failed", message: e.message });
};

workspacesRouter.get("/", requireAccount, async (req: any, res) => {
  try {
    res.json({ success: true, ...(await listWorkspaces(req.accountId)) });
  } catch (e) {
    fail(res, e);
  }
});

workspacesRouter.post("/", requireAccount, async (req: any, res) => {
  try {
    res.json({ success: true, workspace: await createWorkspace(req.accountId, req.body?.name) });
  } catch (e) {
    fail(res, e);
  }
});

workspacesRouter.patch("/:id", requireAccount, async (req: any, res) => {
  try {
    res.json(await renameWorkspace(req.accountId, req.params.id, req.body || {}));
  } catch (e) {
    fail(res, e);
  }
});

workspacesRouter.delete("/:id", requireAccount, async (req: any, res) => {
  try {
    res.json(await deleteWorkspace(req.accountId, req.params.id, req.body?.confirm));
  } catch (e) {
    fail(res, e);
  }
});
