import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";
import { SignupPage } from "../components/pollavote/auth";

function Signup() {
    const navigate = useNavigate();

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSignup({ name, email, password }) {
        setMessage("");
        setError("");
        setLoading(true);

        try {
            await apiRequest("/signup", {
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

    function handleLoginClick(event) {
        event.preventDefault();
        navigate("/");
    }

    return (
        <SignupPage
            onSubmit={handleSignup}
            loading={loading}
            error={error}
            message={message}
            onLoginClick={handleLoginClick}
            loginHref="/"
        />
    );
}

export default Signup;