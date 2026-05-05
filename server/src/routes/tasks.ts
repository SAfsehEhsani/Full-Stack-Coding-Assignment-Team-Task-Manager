import { Router } from "express";
import { ProjectRole, TaskPriority, TaskStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../prisma.js";
import type { AuthedRequest } from "../middleware.js";
import { requireAuth } from "../middleware.js";
import { requireProjectMember } from "../rbac.js";

export const tasksRouter = Router({ mergeParams: true });

function firstParam(v: undefined | string | string[]) {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

async function assertAssigneeIsProjectMember(projectId: string, assignedToId: string) {
  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: assignedToId, projectId } },
    select: { id: true }
  });
  return Boolean(membership);
}

const CreateTaskSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(2000).optional(),
  assignedToId: z.string().cuid().optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.string().datetime().optional()
});

tasksRouter.get("/", requireAuth, requireProjectMember, async (req: AuthedRequest, res) => {
  const projectId = firstParam(req.params.projectId);
  if (!projectId) return res.status(400).json({ error: "Missing projectId" });
  const membership = (req as any).membership as { role: ProjectRole } | undefined;
  const userId = req.user!.id;

  const where =
    membership?.role === ProjectRole.MEMBER ? { projectId, assignedToId: userId } : { projectId };
  const tasks = await prisma.task.findMany({
    where,
    orderBy: [{ priority: "desc" }, { status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } }
    }
  });
  return res.json({ tasks });
});

tasksRouter.post("/", requireAuth, requireProjectMember, async (req: AuthedRequest, res) => {
  const membership = (req as any).membership as { role: ProjectRole } | undefined;
  if (membership?.role !== ProjectRole.ADMIN) return res.status(403).json({ error: "Admin only" });

  const parsed = CreateTaskSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  const projectId = firstParam(req.params.projectId);
  if (!projectId) return res.status(400).json({ error: "Missing projectId" });
  const userId = req.user!.id;

  if (parsed.data.assignedToId) {
    const ok = await assertAssigneeIsProjectMember(projectId, parsed.data.assignedToId);
    if (!ok) return res.status(400).json({ error: "Assignee must be a project member" });
  }

  const task = await prisma.task.create({
    data: {
      projectId,
      title: parsed.data.title,
      description: parsed.data.description,
      assignedToId: parsed.data.assignedToId,
      priority: parsed.data.priority ?? TaskPriority.MEDIUM,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      createdById: userId
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } }
    }
  });

  return res.status(201).json({ task });
});

const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(160).optional(),
  description: z.string().max(2000).nullable().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  assignedToId: z.string().cuid().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional()
});

tasksRouter.patch("/:taskId", requireAuth, requireProjectMember, async (req: AuthedRequest, res) => {
  const parsed = UpdateTaskSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  const projectId = firstParam(req.params.projectId);
  if (!projectId) return res.status(400).json({ error: "Missing projectId" });
  const taskId = firstParam(req.params.taskId);
  if (!taskId) return res.status(400).json({ error: "Missing taskId" });
  const membership = (req as any).membership as { role: ProjectRole } | undefined;
  const userId = req.user!.id;

  const existing = await prisma.task.findFirst({
    where: { id: taskId, projectId },
    select: { id: true, assignedToId: true }
  });
  if (!existing) return res.status(404).json({ error: "Task not found" });

  if (membership?.role === ProjectRole.MEMBER) {
    if (existing.assignedToId !== userId) return res.status(403).json({ error: "Forbidden" });
    const forbidden = parsed.data.assignedToId !== undefined || parsed.data.title !== undefined || parsed.data.description !== undefined || parsed.data.priority !== undefined;
    if (forbidden) return res.status(403).json({ error: "Members can only update status on their assigned tasks" });
  }

  if (parsed.data.assignedToId && parsed.data.assignedToId !== null) {
    const ok = await assertAssigneeIsProjectMember(projectId, parsed.data.assignedToId);
    if (!ok) return res.status(400).json({ error: "Assignee must be a project member" });
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...parsed.data,
      dueDate:
        parsed.data.dueDate === undefined
          ? undefined
          : parsed.data.dueDate === null
            ? null
            : new Date(parsed.data.dueDate),
      assignedToId: parsed.data.assignedToId === undefined ? undefined : parsed.data.assignedToId
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } }
    }
  });

  return res.json({ task });
});

