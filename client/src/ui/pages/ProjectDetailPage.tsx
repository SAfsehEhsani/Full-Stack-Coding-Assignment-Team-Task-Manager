import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/http";
import type { Project, ProjectMember, ProjectRole, Task, TaskPriority, TaskStatus, User } from "../types";
import { Modal } from "../components/Modal";
import { useToast } from "../components/Toast";

type ProjectResponse = { project: Project; membership: { role: ProjectRole } };

function statusLabel(s: TaskStatus) {
  if (s === "TODO") return "TODO";
  if (s === "IN_PROGRESS") return "IN_PROGRESS";
  return "DONE";
}

function statusDot(status: TaskStatus) {
  if (status === "TODO") return "todo";
  if (status === "IN_PROGRESS") return "progress";
  return "done";
}

export function ProjectDetailPage() {
  const { projectId } = useParams();
  const toast = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [role, setRole] = useState<ProjectRole>("MEMBER");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | TaskStatus>("ALL");
  const [filterAssignee, setFilterAssignee] = useState<"ALL" | "UNASSIGNED" | string>("ALL");
  const [overdueOnly, setOverdueOnly] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editAssignedToId, setEditAssignedToId] = useState("");
  const [editPriority, setEditPriority] = useState<TaskPriority>("MEDIUM");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignedToId, setAssignedToId] = useState<string>("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [creating, setCreating] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<ProjectRole>("MEMBER");
  const [inviting, setInviting] = useState(false);

  const members = useMemo(() => project?.members ?? [], [project]);
  const memberUsers = useMemo(() => members.map((m) => m.user), [members]);

  async function load() {
    if (!projectId) return;
    setErr(null);
    setLoading(true);
    try {
      const res = await api<ProjectResponse>(`/api/projects/${projectId}`);
      setProject(res.project);
      setRole(res.membership.role);
      const t = await api<{ tasks: Task[] }>(`/api/projects/${projectId}/tasks`);
      setTasks(t.tasks);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load project");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [projectId]);

  async function onCreateTask(e: FormEvent) {
    e.preventDefault();
    if (!projectId) return;
    setCreating(true);
    setErr(null);
    try {
      await api(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        body: JSON.stringify({
          title,
          description: description || undefined,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          assignedToId: assignedToId || undefined,
          priority
        })
      });
      setTitle("");
      setDescription("");
      setDueDate("");
      setAssignedToId("");
      setPriority("MEDIUM");
      await load();
      setCreateOpen(false);
      toast.push("success", "Task created");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to create task");
      toast.push("error", e?.message ?? "Failed to create task");
    } finally {
      setCreating(false);
    }
  }

  async function updateTask(
    taskId: string,
    patch: Partial<{
      status: TaskStatus;
      assignedToId: string | null;
      priority: TaskPriority;
      title: string;
      description: string | null;
      dueDate: string | null;
    }>
  ) {
    if (!projectId) return;
    setErr(null);
    try {
      await api(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify(patch)
      });
      await load();
      toast.push("success", "Task updated");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to update task");
      toast.push("error", e?.message ?? "Failed to update task");
    }
  }

  function startEditTask(t: Task) {
    setEditingTaskId(t.id);
    setEditTitle(t.title);
    setEditDescription(t.description ?? "");
    setEditPriority(t.priority);
    setEditAssignedToId(t.assignedTo?.id ?? "");
    setEditDueDate(t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 10) : "");
    setEditOpen(true);
  }

  async function saveEditTask(taskId: string) {
    const patch = {
      title: editTitle,
      description: editDescription ? editDescription : null,
      priority: editPriority,
      assignedToId: editAssignedToId ? editAssignedToId : null,
      dueDate: editDueDate ? new Date(editDueDate).toISOString() : null
    };
    await updateTask(taskId, patch);
    setEditingTaskId(null);
    setEditOpen(false);
  }

  async function deleteTask(taskId: string) {
    if (!projectId) return;
    if (!confirm("Delete this task?")) return;
    setErr(null);
    try {
      await api(`/api/projects/${projectId}/tasks/${taskId}`, { method: "DELETE" });
      await load();
      toast.push("success", "Task deleted");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to delete task");
      toast.push("error", e?.message ?? "Failed to delete task");
    }
  }

  async function inviteMember(e: FormEvent) {
    e.preventDefault();
    if (!projectId) return;
    setInviting(true);
    setErr(null);
    try {
      await api(`/api/projects/${projectId}/members`, {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      setInviteEmail("");
      setInviteRole("MEMBER");
      await load();
      toast.push("success", "Member added");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to add member");
      toast.push("error", e?.message ?? "Failed to add member");
    } finally {
      setInviting(false);
    }
  }

  async function removeMember(member: ProjectMember) {
    if (!projectId) return;
    if (!confirm(`Remove ${member.user.email} from project?`)) return;
    setErr(null);
    try {
      await api(`/api/projects/${projectId}/members/${member.id}`, { method: "DELETE" });
      await load();
      toast.push("success", "Member removed");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to remove member");
      toast.push("error", e?.message ?? "Failed to remove member");
    }
  }

  async function changeRole(member: ProjectMember, newRole: ProjectRole) {
    if (!projectId) return;
    setErr(null);
    try {
      await api(`/api/projects/${projectId}/members/${member.id}`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole })
      });
      await load();
      toast.push("success", "Role updated");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to update role");
      toast.push("error", e?.message ?? "Failed to update role");
    }
  }

  const now = useMemo(() => new Date(), []);
  const visibleTasks = useMemo(() => {
    const query = q.trim().toLowerCase();
    return tasks.filter((t) => {
      if (filterStatus !== "ALL" && t.status !== filterStatus) return false;
      if (filterAssignee === "UNASSIGNED" && t.assignedTo) return false;
      if (filterAssignee !== "ALL" && filterAssignee !== "UNASSIGNED") {
        if ((t.assignedTo?.id ?? "") !== filterAssignee) return false;
      }
      if (overdueOnly) {
        const overdue = t.dueDate ? new Date(t.dueDate) < now && t.status !== "DONE" : false;
        if (!overdue) return false;
      }
      if (query) {
        const hay = `${t.title}\n${t.description ?? ""}\n${t.assignedTo?.name ?? ""}\n${t.assignedTo?.email ?? ""}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [tasks, q, filterStatus, filterAssignee, overdueOnly, now]);

  const memberReport = useMemo(() => {
    if (role !== "ADMIN") return [];
    const byUser = new Map<string, { user: User; total: number; overdue: number; done: number }>();
    for (const m of members) {
      byUser.set(m.user.id, { user: m.user, total: 0, overdue: 0, done: 0 });
    }
    for (const t of tasks) {
      if (!t.assignedTo) continue;
      const row = byUser.get(t.assignedTo.id);
      if (!row) continue;
      row.total += 1;
      if (t.status === "DONE") row.done += 1;
      const overdue = t.dueDate ? new Date(t.dueDate) < now && t.status !== "DONE" : false;
      if (overdue) row.overdue += 1;
    }
    return Array.from(byUser.values()).sort((a, b) => b.total - a.total);
  }, [role, members, tasks, now]);

  function openDetails(t: Task) {
    setDetailTask(t);
    setDetailOpen(true);
  }

  return (
    <div className="container">
      <div className="row" style={{ marginTop: 18, marginBottom: 12 }}>
        <Link to="/projects" className="pill">
          ← Projects
        </Link>
        <h2 style={{ margin: 0 }}>{project?.name ?? "Project"}</h2>
        <div className="pill">Role: {role}</div>
      </div>

      {loading ? <div className="muted">Loading...</div> : null}
      {err ? <div style={{ color: "#ffb4b4", marginBottom: 10 }}>{err}</div> : null}

      {project ? (
        <div className="grid two">
          <div className="card">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <h3 style={{ marginTop: 0, marginBottom: 6 }}>Tasks</h3>
                <div className="muted" style={{ fontSize: 13 }}>
                  {role === "ADMIN" ? "Create, assign, edit, and delete tasks." : "You can update status on tasks assigned to you."}
                </div>
              </div>
              {role === "ADMIN" ? (
                <button className="btn primary" onClick={() => setCreateOpen(true)}>
                  + New task
                </button>
              ) : null}
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Team</h3>
            <div className="muted" style={{ marginBottom: 8 }}>
              Members: {project.members.length}
            </div>

            {role === "ADMIN" ? (
              <form onSubmit={inviteMember} className="grid" style={{ gap: 10, marginBottom: 12 }}>
                <div className="grid" style={{ gap: 6 }}>
                  <div className="muted">Add member by email</div>
                  <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="member@example.com" />
                </div>
                <div className="grid" style={{ gap: 6 }}>
                  <div className="muted">Role</div>
                  <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as ProjectRole)}>
                    <option value="MEMBER">MEMBER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <button className="btn primary" disabled={!inviteEmail || inviting}>
                  {inviting ? "Adding..." : "Add member"}
                </button>
              </form>
            ) : (
              <div className="muted" style={{ marginBottom: 12 }}>
                Only Admins can manage members.
              </div>
            )}

            <div className="grid" style={{ gap: 10 }}>
              {project.members.map((m) => (
                <div key={m.id} className="row" style={{ justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{m.user.name}</div>
                    <div className="muted" style={{ fontSize: 13 }}>
                      {m.user.email}
                    </div>
                  </div>
                  <div className="row">
                    {role === "ADMIN" ? (
                      <select value={m.role} onChange={(e) => changeRole(m, e.target.value as ProjectRole)} style={{ width: 140 }}>
                        <option value="MEMBER">MEMBER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    ) : (
                      <div className="pill">{m.role}</div>
                    )}
                    {role === "ADMIN" ? (
                      <button className="btn danger" onClick={() => removeMember(m)}>
                        Remove
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {role === "ADMIN" ? (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h3 style={{ marginTop: 0, marginBottom: 0 }}>Members report</h3>
            <div className="muted" style={{ fontSize: 13 }}>
              Click a member to quickly filter tasks.
            </div>
          </div>
          <div className="grid" style={{ gap: 10, marginTop: 10 }}>
            {memberReport.map((r) => (
              <button
                key={r.user.id}
                className="card hoverable"
                style={{ padding: 12, textAlign: "left", cursor: "pointer" }}
                onClick={() => {
                  setFilterAssignee(r.user.id);
                  toast.push("info", `Filtering tasks for ${r.user.name}`);
                  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                }}
              >
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 750 }}>{r.user.name}</div>
                    <div className="muted" style={{ fontSize: 13 }}>
                      {r.user.email}
                    </div>
                  </div>
                  <div className="row">
                    <div className="pill">{r.total} total</div>
                    <div className="pill">
                      <span className="status done" /> {r.done} done
                    </div>
                    <div className="pill">
                      <span className="status overdue" /> {r.overdue} overdue
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="card" style={{ marginTop: 12 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h3 style={{ marginTop: 0, marginBottom: 0 }}>Tasks</h3>
          <div className="pill">{visibleTasks.length} shown</div>
        </div>

        <div className="grid two" style={{ marginTop: 10 }}>
          <div className="grid" style={{ gap: 6 }}>
            <div className="muted">Search</div>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, description, assignee..." />
          </div>
          <div className="grid two">
            <div className="grid" style={{ gap: 6 }}>
              <div className="muted">Status</div>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}>
                <option value="ALL">ALL</option>
                <option value="TODO">TODO</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="DONE">DONE</option>
              </select>
            </div>
            <div className="grid" style={{ gap: 6 }}>
              <div className="muted">Assignee</div>
              <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}>
                <option value="ALL">ALL</option>
                <option value="UNASSIGNED">UNASSIGNED</option>
                {memberUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="row" style={{ marginTop: 10 }}>
          <label className="pill" style={{ cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(e) => setOverdueOnly(e.target.checked)}
              style={{ width: 16, height: 16 }}
            />
            Overdue only
          </label>
          {(q || filterStatus !== "ALL" || filterAssignee !== "ALL" || overdueOnly) ? (
            <button
              className="btn"
              onClick={() => {
                setQ("");
                setFilterStatus("ALL");
                setFilterAssignee("ALL");
                setOverdueOnly(false);
              }}
            >
              Clear filters
            </button>
          ) : null}
        </div>

        {visibleTasks.length === 0 ? <div className="muted" style={{ marginTop: 10 }}>No tasks match these filters.</div> : null}
        <div className="grid" style={{ gap: 10 }}>
          {visibleTasks.map((t) => {
            const overdue = t.dueDate ? new Date(t.dueDate) < now && t.status !== "DONE" : false;
            return (
              <div key={t.id} className="card hoverable" style={{ padding: 12 }}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <button
                    className="btn"
                    style={{
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      textAlign: "left",
                      cursor: "pointer",
                      flex: 1
                    }}
                    onClick={() => openDetails(t)}
                    title="Click to view details"
                  >
                    <div style={{ fontWeight: 800 }}>{t.title}</div>
                    <div className="muted" style={{ fontSize: 13 }}>
                      {t.assignedTo ? `Assigned to ${t.assignedTo.name}` : "Unassigned"} •{" "}
                      {t.dueDate ? `Due ${new Date(t.dueDate).toLocaleDateString()}` : "No due date"}
                    </div>
                  </button>
                  <div className="pill">
                    <span className={`status ${overdue ? "overdue" : statusDot(t.status)}`} /> {statusLabel(t.status)}
                  </div>
                </div>

                <div className="row" style={{ marginTop: 10 }}>
                  <div style={{ width: 220 }}>
                    <select value={t.status} onChange={(e) => updateTask(t.id, { status: e.target.value as TaskStatus })}>
                      <option value="TODO">TODO</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="DONE">DONE</option>
                    </select>
                  </div>
                  {role === "ADMIN" ? (
                    <>
                      <div style={{ width: 180 }}>
                        <select
                          value={t.priority}
                          onChange={(e) => updateTask(t.id, { priority: e.target.value as TaskPriority })}
                        >
                          <option value="LOW">LOW</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="HIGH">HIGH</option>
                        </select>
                      </div>
                      <div style={{ flex: 1, minWidth: 240 }}>
                        <select
                          value={t.assignedTo?.id ?? ""}
                          onChange={(e) => updateTask(t.id, { assignedToId: e.target.value || null })}
                        >
                          <option value="">Unassigned</option>
                          {memberUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.email})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="row">
                        <button className="btn" onClick={() => startEditTask(t)}>
                          Edit
                        </button>
                        <button className="btn danger" onClick={() => deleteTask(t.id)}>
                          Delete
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="pill">Priority: {t.priority}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal
        open={createOpen}
        title="Create task"
        onClose={() => {
          if (creating) return;
          setCreateOpen(false);
        }}
      >
        <form onSubmit={onCreateTask} className="grid" style={{ gap: 10 }}>
          <div className="grid" style={{ gap: 6 }}>
            <div className="muted">Title</div>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Design login page" />
          </div>
          <div className="grid" style={{ gap: 6 }}>
            <div className="muted">Description</div>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="grid two">
            <div className="grid" style={{ gap: 6 }}>
              <div className="muted">Due date</div>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="grid" style={{ gap: 6 }}>
              <div className="muted">Assign to</div>
              <select value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)}>
                <option value="">Unassigned</option>
                {memberUsers.map((u: User) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid" style={{ gap: 6 }}>
            <div className="muted">Priority</div>
            <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>
          </div>

          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button className="btn" type="button" onClick={() => setCreateOpen(false)} disabled={creating}>
              Cancel
            </button>
            <button className="btn primary" disabled={!title || creating}>
              {creating ? "Creating..." : "Create task"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={editOpen}
        title="Edit task"
        onClose={() => {
          setEditOpen(false);
          setEditingTaskId(null);
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!editingTaskId) return;
            void saveEditTask(editingTaskId);
          }}
          className="grid"
          style={{ gap: 10 }}
        >
          <div className="grid" style={{ gap: 6 }}>
            <div className="muted">Title</div>
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
          </div>
          <div className="grid" style={{ gap: 6 }}>
            <div className="muted">Description</div>
            <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} />
          </div>
          <div className="grid two">
            <div className="grid" style={{ gap: 6 }}>
              <div className="muted">Due date</div>
              <input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
            </div>
            <div className="grid" style={{ gap: 6 }}>
              <div className="muted">Assign to</div>
              <select value={editAssignedToId} onChange={(e) => setEditAssignedToId(e.target.value)}>
                <option value="">Unassigned</option>
                {memberUsers.map((u: User) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid" style={{ gap: 6 }}>
            <div className="muted">Priority</div>
            <select value={editPriority} onChange={(e) => setEditPriority(e.target.value as TaskPriority)}>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>
          </div>
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button
              className="btn"
              type="button"
              onClick={() => {
                setEditOpen(false);
                setEditingTaskId(null);
              }}
            >
              Cancel
            </button>
            <button className="btn primary" disabled={!editingTaskId || !editTitle}>
              Save changes
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={detailOpen}
        title="Task details"
        onClose={() => {
          setDetailOpen(false);
          setDetailTask(null);
        }}
      >
        {detailTask ? (
          <div className="grid" style={{ gap: 10 }}>
            <div>
              <div className="muted">Title</div>
              <div style={{ fontWeight: 850 }}>{detailTask.title}</div>
            </div>
            <div className="grid two">
              <div>
                <div className="muted">Status</div>
                <div className="pill">
                  <span className={`status ${statusDot(detailTask.status)}`} /> {detailTask.status}
                </div>
              </div>
              <div>
                <div className="muted">Priority</div>
                <div className="pill">{detailTask.priority}</div>
              </div>
            </div>
            <div className="grid two">
              <div>
                <div className="muted">Assigned to</div>
                <div className="pill">{detailTask.assignedTo ? `${detailTask.assignedTo.name} (${detailTask.assignedTo.email})` : "Unassigned"}</div>
              </div>
              <div>
                <div className="muted">Due date</div>
                <div className="pill">
                  {detailTask.dueDate ? new Date(detailTask.dueDate).toLocaleDateString() : "No due date"}
                </div>
              </div>
            </div>
            <div>
              <div className="muted">Description</div>
              <div className="card" style={{ padding: 12 }}>
                {detailTask.description ? detailTask.description : <span className="muted">No description</span>}
              </div>
            </div>
            <div className="muted" style={{ fontSize: 13 }}>
              Created at: {new Date(detailTask.createdAt).toLocaleString()} • Updated at:{" "}
              {new Date(detailTask.updatedAt).toLocaleString()}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

