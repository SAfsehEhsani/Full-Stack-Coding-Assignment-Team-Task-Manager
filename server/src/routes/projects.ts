import { Router } from "express";
import { z } from "zod";
import { ProjectRole } from "@prisma/client";
import { prisma } from "../prisma.js";
import type { AuthedRequest } from "../middleware.js";
import { requireAuth } from "../middleware.js";
import { requireProjectAdmin, requireProjectMember } from "../rbac.js";

export const projectsRouter = Router();

function firstParam(v: undefined | string | string[]) {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

projectsRouter.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.user!.id;
  const memberships = await prisma.projectMember.findMany({
    where: { userId },
    include: { project: true }
  });
  return res.json({
    projects: memberships.map((m) => ({
      id: m.project.id,
      name: m.project.name,
      description: m.project.description,
      role: m.role,
      createdAt: m.project.createdAt,
      updatedAt: m.project.updatedAt
    }))
  });
});

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional()
});

projectsRouter.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = CreateProjectSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  const userId = req.user!.id;
  const project = await prisma.project.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      members: {
        create: { userId, role: ProjectRole.ADMIN }
      }
    }
  });
  return res.status(201).json({ project });
});

projectsRouter.get("/:id", requireAuth, requireProjectMember, async (req, res) => {
  const projectId = firstParam(req.params.id);
  if (!projectId) return res.status(400).json({ error: "Missing projectId" });
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } } }
    }
  });
  return res.json({ project, membership: (req as any).membership });
});

const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).nullable().optional()
});

projectsRouter.patch("/:id", requireAuth, requireProjectMember, requireProjectAdmin, async (req, res) => {
  const parsed = UpdateProjectSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  const projectId = firstParam(req.params.id);
  if (!projectId) return res.status(400).json({ error: "Missing projectId" });
  const project = await prisma.project.update({
    where: { id: projectId },
    data: parsed.data
  });
  return res.json({ project });
});

projectsRouter.delete("/:id", requireAuth, requireProjectMember, requireProjectAdmin, async (req, res) => {
  const projectId = firstParam(req.params.id);
  if (!projectId) return res.status(400).json({ error: "Missing projectId" });
  await prisma.project.delete({ where: { id: projectId } });
  return res.status(204).send();
});

const AddMemberSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(ProjectRole).optional()
});

projectsRouter.post("/:id/members", requireAuth, requireProjectMember, requireProjectAdmin, async (req, res) => {
  const parsed = AddMemberSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  const projectId = firstParam(req.params.id);
  if (!projectId) return res.status(400).json({ error: "Missing projectId" });
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) return res.status(404).json({ error: "User not found" });

  const existing = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: user.id, projectId } }
  });
  if (existing) return res.status(409).json({ error: "User already in project" });

  const member = await prisma.projectMember.create({
    data: { projectId, userId: user.id, role: parsed.data.role ?? ProjectRole.MEMBER },
    include: { user: { select: { id: true, name: true, email: true } } }
  });
  return res.status(201).json({ member });
});

projectsRouter.patch(
  "/:id/members/:memberId",
  requireAuth,
  requireProjectMember,
  requireProjectAdmin,
  async (req, res) => {
    const projectId = firstParam(req.params.id);
    if (!projectId) return res.status(400).json({ error: "Missing projectId" });
    const memberId = firstParam(req.params.memberId);
    if (!memberId) return res.status(400).json({ error: "Missing memberId" });
    const RoleSchema = z.object({ role: z.nativeEnum(ProjectRole) });
    const parsed = RoleSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

    const updated = await prisma.projectMember.updateMany({
      where: { id: memberId, projectId },
      data: { role: parsed.data.role }
    });
    if (updated.count === 0) return res.status(404).json({ error: "Member not found" });
    const member = await prisma.projectMember.findUnique({ where: { id: memberId } });
    return res.json({ member });
  }
);

projectsRouter.delete(
  "/:id/members/:memberId",
  requireAuth,
  requireProjectMember,
  requireProjectAdmin,
  async (req, res) => {
    const projectId = firstParam(req.params.id);
    if (!projectId) return res.status(400).json({ error: "Missing projectId" });
    const memberId = firstParam(req.params.memberId);
    if (!memberId) return res.status(400).json({ error: "Missing memberId" });
    const deleted = await prisma.projectMember.deleteMany({ where: { id: memberId, projectId } });
    if (deleted.count === 0) return res.status(404).json({ error: "Member not found" });
    return res.status(204).send();
  }
);

