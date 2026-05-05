import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/http";
import type { ProjectSummary } from "../types";

export function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  async function load() {
    setErr(null);
    setLoading(true);
    try {
      const res = await api<{ projects: ProjectSummary[] }>("/api/projects");
      setProjects(res.projects);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setErr(null);
    try {
      await api("/api/projects", {
        method: "POST",
        body: JSON.stringify({ name, description: description || undefined })
      });
      setName("");
      setDescription("");
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to create project");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="container">
      <div className="row" style={{ marginTop: 18, marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Projects</h2>
        <div className="pill">{projects.length} total</div>
      </div>

      <div className="grid two">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Create project</h3>
          <form onSubmit={onCreate} className="grid" style={{ gap: 10 }}>
            <div className="grid" style={{ gap: 6 }}>
              <div className="muted">Name</div>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Website Redesign" />
            </div>
            <div className="grid" style={{ gap: 6 }}>
              <div className="muted">Description</div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional"
                rows={3}
              />
            </div>
            <button className="btn primary" disabled={!name || creating}>
              {creating ? "Creating..." : "Create"}
            </button>
            {err ? <div style={{ color: "#ffb4b4" }}>{err}</div> : null}
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Your projects</h3>
          {loading ? <div className="muted">Loading...</div> : null}
          {!loading && projects.length === 0 ? <div className="muted">No projects yet.</div> : null}
          <div className="grid" style={{ gap: 10 }}>
            {projects.map((p) => (
              <Link key={p.id} to={`/projects/${p.id}`} className="card" style={{ padding: 12 }}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{p.name}</div>
                    <div className="muted" style={{ fontSize: 13 }}>
                      {p.description || "No description"}
                    </div>
                  </div>
                  <div className="pill">{p.role}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

