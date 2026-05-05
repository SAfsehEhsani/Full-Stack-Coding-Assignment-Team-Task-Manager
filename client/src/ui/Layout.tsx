import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, getToken } from "./auth/token";

export function Layout() {
  const navigate = useNavigate();
  const authed = Boolean(getToken());

  return (
    <div>
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
        <div className="container" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link to="/" style={{ fontWeight: 700, letterSpacing: 0.4 }}>
            Team Task Manager
          </Link>
          <div style={{ flex: 1 }} />
          {authed ? (
            <div className="row">
              <NavLink to="/dashboard" className="pill">
                Dashboard
              </NavLink>
              <NavLink to="/projects" className="pill">
                Projects
              </NavLink>
              <button
                className="btn"
                onClick={() => {
                  clearToken();
                  navigate("/login");
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="row">
              <NavLink to="/login" className="pill">
                Login
              </NavLink>
              <NavLink to="/signup" className="pill">
                Signup
              </NavLink>
            </div>
          )}
        </div>
      </div>

      <Outlet />
    </div>
  );
}

