import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const data = await apiRequest("/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      localStorage.setItem("token", data.token);

      setMessage("Login successful. Redirecting...");

      setTimeout(() => {
        navigate("/dashboard");
      }, 700);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <div className="container" style={{ maxWidth: "440px" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              background: "#4f46e5",
              color: "#ffffff",
              fontSize: "24px",
              fontWeight: "700",
              marginBottom: "14px",
            }}
          >
            P
          </div>

          <h1 className="page-title">Welcome to Pollavote</h1>

          <p className="page-subtitle">
            Create polls, share them, and watch results update live.
          </p>
        </div>

        <div className="card">
          <h2
            style={{
              margin: "0 0 6px",
              fontSize: "22px",
              color: "#172033",
            }}
          >
            Sign in
          </h2>

          <p className="muted" style={{ marginBottom: "24px" }}>
            Sign in to manage your polls.
          </p>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">Email</label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            {message && <div className="success-message">{message}</div>}

            <button
              type="submit"
              className="primary-button"
              disabled={loading}
              style={{
                width: "100%",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p
            className="muted"
            style={{
              textAlign: "center",
              marginTop: "22px",
              fontSize: "14px",
            }}
          >
            Don't have an account?{" "}
            <Link
              to="/signup"
              style={{
                color: "#4f46e5",
                fontWeight: "600",
              }}
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default Login;