import { Router } from "express";
import { TaskStatus } from "@prisma/client";
import { prisma } from "../prisma.js";
import { requireAuth, type AuthedRequest } from "../middleware.js";

export const dashboardRouter = Router();

dashboardRouter.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.user!.id;
  const now = new Date();

  const memberships = await prisma.projectMember.findMany({
    where: { userId },
    select: { projectId: true }
  });
  const projectIds = memberships.map((m) => m.projectId);

  // All tasks in projects the user belongs to (used for totals + per-user summary).
  const allProjectTasks = await prisma.task.findMany({
    where: { projectId: { in: projectIds } },
    include: {
      project: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true, email: true } }
    }
  });

  // Tasks assigned to the current user (used for "my tasks" list).
  const assignedTasks = allProjectTasks.filter((t) => t.assignedToId === userId);

  const byStatusAll = {
    TODO: allProjectTasks.filter((t) => t.status === TaskStatus.TODO).length,
    IN_PROGRESS: allProjectTasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length,
    DONE: allProjectTasks.filter((t) => t.status === TaskStatus.DONE).length
  };

  const overdue = allProjectTasks.filter((t) => t.dueDate && t.dueDate < now && t.status !== TaskStatus.DONE);

  const tasksPerUser = new Map<string, { user: { id: string; name: string; email: string }; count: number }>();
  for (const t of allProjectTasks) {
    if (!t.assignedTo) continue;
    const existing = tasksPerUser.get(t.assignedTo.id);
    if (existing) existing.count += 1;
    else tasksPerUser.set(t.assignedTo.id, { user: t.assignedTo, count: 1 });
  }

  return res.json({
    totalTasks: allProjectTasks.length,
    byStatus: byStatusAll,
    tasksPerUser: Array.from(tasksPerUser.values()).sort((a, b) => b.count - a.count),
    assignedTasks,
    overdueCount: overdue.length,
    overdue
  });
});

