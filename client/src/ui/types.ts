export type ProjectRole = "ADMIN" | "MEMBER";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export type User = { id: string; name: string; email: string };

export type ProjectSummary = {
  id: string;
  name: string;
  description?: string | null;
  role: ProjectRole;
  createdAt: string;
  updatedAt: string;
};

export type ProjectMember = {
  id: string;
  role: ProjectRole;
  user: User;
};

export type Project = {
  id: string;
  name: string;
  description?: string | null;
  members: ProjectMember[];
};

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  projectId: string;
  assignedTo?: User | null;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
};

