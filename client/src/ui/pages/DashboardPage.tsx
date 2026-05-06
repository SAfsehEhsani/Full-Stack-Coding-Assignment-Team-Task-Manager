import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/http";
import type { Task, User } from "../types";

type DashboardResponse = {
  totalTasks: number;
  assignedTasks: Array<Task & { project: { id: string; name: string } }>;
  byStatus: { TODO: number; IN_PROGRESS: number; DONE: number };
  tasksPerUser: Array<{ user: User; count: number }>;
  overdueCount: number;
  overdue: Array<Task & { project: { id: string; name: string } }>;
};

function statusDot(status: string) {
  if (status === "TODO") return "todo";
  if (status === "IN_PROGRESS") return "progress";
  if (status === "DONE") return "done";
  return "";
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api<DashboardResponse>("/api/dashboard")
      .then((d) => alive && setData(d))
      .catch((e: any) => alive && setErr(e?.message ?? "Failed to load"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const now = useMemo(() => new Date(), []);

  return (
    <div className="container">
      <div className="row" style={{ marginTop: 18, marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Dashboard</h2>
        <div className="pill">
          <span className="status progress" /> Total tasks: {data?.totalTasks ?? 0}
        </div>
        <div className="pill">
          <span className="status overdue" /> Overdue: {data?.overdueCount ?? 0}
        </div>
      </div>

      {loading ? <div className="muted">Loading dashboard...</div> : null}
      {err ? <div style={{ color: "#ffb4b4" }}>{err}</div> : null}

      <div className="grid two" style={{ marginTop: 12 }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Start here</h3>
          <div className="muted" style={{ marginBottom: 10 }}>
            Roles are project-based: creating a project makes you <b>ADMIN</b>. If an Admin adds you to a project, you are a <b>MEMBER</b>.
          </div>
          <div className="row">
            <Link to="/projects" className="btn primary" style={{ display: "inline-block" }}>
              Create project (Admin)
            </Link>
            <Link to="/projects" className="btn" style={{ display: "inline-block" }}>
              View / join projects (Member)
            </Link>
          </div>
          <div className="muted" style={{ fontSize: 13, marginTop: 10 }}>
            To join a project as Member, ask the Admin to add your email in the project’s Team section.
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Quick actions</h3>
          <div className="row">
            <Link to="/projects" className="btn primary" style={{ display: "inline-block" }}>
              Open Projects
            </Link>
            <Link to="/dashboard" className="btn" style={{ display: "inline-block" }}>
              Refresh Dashboard
            </Link>
          </div>
          <div className="muted" style={{ fontSize: 13, marginTop: 10 }}>
            Tip: click any task below to open its project and manage it.
          </div>
        </div>
      </div>

      {data ? (
        <div className="grid two">
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Status summary</h3>
            <div className="row">
              <div className="pill">
                <span className="status todo" /> TODO: {data.byStatus.TODO}
              </div>
              <div className="pill">
                <span className="status progress" /> IN PROGRESS: {data.byStatus.IN_PROGRESS}
              </div>
              <div className="pill">
                <span className="status done" /> DONE: {data.byStatus.DONE}
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Tasks per user</h3>
            {data.tasksPerUser.length === 0 ? (
              <div className="muted">No assigned tasks yet.</div>
            ) : (
              <div className="grid" style={{ gap: 10 }}>
                {data.tasksPerUser.slice(0, 8).map((x) => (
                  <div key={x.user.id} className="row" style={{ justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{x.user.name}</div>
                      <div className="muted" style={{ fontSize: 13 }}>
                        {x.user.email}
                      </div>
                    </div>
                    <div className="pill">{x.count} tasks</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {data ? (
        <div className="card" style={{ marginTop: 12 }}>
          <h3 style={{ marginTop: 0 }}>Overdue</h3>
            {data.overdue.length === 0 ? (
              <div className="muted">No overdue tasks.</div>
            ) : (
              <div className="grid" style={{ gap: 10 }}>
                {data.overdue.slice(0, 6).map((t) => {
                  const overdue = t.dueDate ? new Date(t.dueDate) < now && t.status !== "DONE" : false;
                  return (
                    <div key={t.id} className="row" style={{ justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{t.title}</div>
                        <div className="muted" style={{ fontSize: 13 }}>
                          {t.project?.name ?? "Project"} • due {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "—"}
                        </div>
                      </div>
                      <Link to={`/projects/${t.project?.id}`} className="btn">
                        Open
                      </Link>
                      <div className="pill">
                        <span className={`status ${overdue ? "overdue" : statusDot(t.status)}`} /> {t.status}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      ) : null}

      {data ? (
        <div className="card" style={{ marginTop: 12 }}>
          <h3 style={{ marginTop: 0 }}>My assigned tasks</h3>
          {data.assignedTasks.length === 0 ? (
            <div className="muted">No assigned tasks yet.</div>
          ) : (
            <div className="grid" style={{ gap: 10 }}>
              {data.assignedTasks.slice(0, 12).map((t) => (
                <div key={t.id} className="row" style={{ justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{t.title}</div>
                    <div className="muted" style={{ fontSize: 13 }}>
                      {t.project?.name ?? "Project"} • {t.dueDate ? `due ${new Date(t.dueDate).toLocaleDateString()}` : "no due date"}
                    </div>
                  </div>
                  <Link to={`/projects/${t.project?.id}`} className="btn">
                    Open
                  </Link>
                  <div className="pill">
                    <span className={`status ${statusDot(t.status)}`} /> {t.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

