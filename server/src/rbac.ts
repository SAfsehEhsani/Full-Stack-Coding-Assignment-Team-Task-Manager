import { ProjectRole } from "@prisma/client";
import type { NextFunction, Response } from "express";
import { prisma } from "./prisma.js";
import type { AuthedRequest } from "./middleware.js";

function firstParam(v: undefined | string | string[]) {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export async function requireProjectMember(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  const userId = req.user?.id;
  const projectId = firstParam(req.params.projectId) ?? firstParam(req.params.id);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!projectId) return res.status(400).json({ error: "Missing projectId" });

  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } }
  });
  if (!membership) return res.status(403).json({ error: "Forbidden" });

  (req as any).membership = membership;
  next();
}

export function requireProjectAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  const membership = (req as any).membership as { role?: ProjectRole } | undefined;
  if (!membership) return res.status(500).json({ error: "RBAC not initialized" });
  if (membership.role !== ProjectRole.ADMIN) return res.status(403).json({ error: "Admin only" });
  next();
}

