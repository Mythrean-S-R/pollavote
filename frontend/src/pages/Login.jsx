import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";
import { LoginPage } from "../components/pollavote/auth";

function Login() {
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin({ email, password }) {
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

      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSignupClick(event) {
    event.preventDefault();
    navigate("/signup");
  }

  return (
    <LoginPage
      onSubmit={handleLogin}
      loading={loading}
      error={error}
      signupHref="/signup"
      onSignupClick={handleSignupClick}
    />
  );
}

export default Login;