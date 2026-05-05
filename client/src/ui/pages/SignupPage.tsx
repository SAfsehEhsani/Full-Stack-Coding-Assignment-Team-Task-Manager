import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/http";
import { setToken } from "../auth/token";

export function SignupPage() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await api<{ token: string }>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name, email, password })
      });
      setToken(res.token);
      nav("/dashboard");
    } catch (e: any) {
      setErr(e?.message ?? "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 520, margin: "40px auto" }}>
        <h2 style={{ marginTop: 0 }}>Signup</h2>
        <p className="muted" style={{ marginBottom: 14 }}>
          Create your account.
        </p>
        <form onSubmit={onSubmit} className="grid" style={{ gap: 10 }}>
          <div className="grid" style={{ gap: 6 }}>
            <div className="muted">Name</div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="grid" style={{ gap: 6 }}>
            <div className="muted">Email</div>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="grid" style={{ gap: 6 }}>
            <div className="muted">Password</div>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
            <div className="muted" style={{ fontSize: 12 }}>
              Minimum 8 characters.
            </div>
          </div>
          {err ? <div style={{ color: "#ffb4b4" }}>{err}</div> : null}
          <div className="row">
            <button className="btn primary" disabled={loading || !name || !email || password.length < 8}>
              {loading ? "Creating..." : "Create account"}
            </button>
            <div className="muted">
              Have an account? <Link to="/login">Login</Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

