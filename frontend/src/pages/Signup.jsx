import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";

function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(event) {
    event.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const data = await apiRequest("/signup", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      setMessage("Account created successfully. Redirecting...");

      setTimeout(() => {
        navigate("/");
      }, 900);
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

          <h1 className="page-title">Join Pollavote</h1>

          <p className="page-subtitle">
            Create an account and start building live polls.
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
            Create your account
          </h2>

          <p className="muted" style={{ marginBottom: "24px" }}>
            It only takes a moment to get started.
          </p>

          <form onSubmit={handleSignup}>
            <div className="form-group">
              <label htmlFor="name">Name</label>

              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                autoComplete="name"
                required
              />
            </div>

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
                placeholder="At least 6 characters"
                autoComplete="new-password"
                minLength={6}
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
              {loading ? "Creating account..." : "Create account"}
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
            Already have an account?{" "}
            <Link
              to="/"
              style={{
                color: "#4f46e5",
                fontWeight: "600",
              }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default Signup;