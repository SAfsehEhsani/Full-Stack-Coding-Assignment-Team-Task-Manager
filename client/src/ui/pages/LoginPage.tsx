import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/http";
import { setToken } from "../auth/token";

export function LoginPage() {
  const nav = useNavigate();
  const loc = useLocation() as any;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await api<{ token: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      setToken(res.token);
      nav(loc?.state?.from ?? "/dashboard");
    } catch (e: any) {
      setErr(e?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 520, margin: "40px auto" }}>
        <h2 style={{ marginTop: 0 }}>Login</h2>
        <p className="muted" style={{ marginBottom: 14 }}>
          Use your email and password.
        </p>
        <form onSubmit={onSubmit} className="grid" style={{ gap: 10 }}>
          <div className="grid" style={{ gap: 6 }}>
            <div className="muted">Email</div>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="grid" style={{ gap: 6 }}>
            <div className="muted">Password</div>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
          </div>
          {err ? <div style={{ color: "#ffb4b4" }}>{err}</div> : null}
          <div className="row">
            <button className="btn primary" disabled={loading || !email || !password}>
              {loading ? "Logging in..." : "Login"}
            </button>
            <div className="muted">
              No account? <Link to="/signup">Signup</Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

