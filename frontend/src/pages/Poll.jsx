import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiRequest } from "../services/api";

function getVoterId() {
    let voterId = localStorage.getItem("voterId");

    if (!voterId) {
        voterId = crypto.randomUUID();
        localStorage.setItem("voterId", voterId);
    }

    return voterId;
}

function Poll() {
    const { id } = useParams();

    const [poll, setPoll] = useState(null);
    const [selectedOption, setSelectedOption] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [voting, setVoting] = useState(false);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        async function loadPoll() {
            try {
                const data = await apiRequest(`/polls/${id}`);
                setPoll(data.poll);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        loadPoll();
    }, [id]);

    useEffect(() => {
        const wsBaseUrl =
            import.meta.env.VITE_WS_BASE_URL || "ws://localhost:8080";

        const socket = new WebSocket(
            `${wsBaseUrl}/api/polls/${id}/ws`
        );

        socket.onopen = () => {
            console.log("WebSocket connected");
            setConnected(true);
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.pollId === id && data.poll) {
                    setPoll(data.poll);
                }
            } catch (err) {
                console.error("Failed to parse WebSocket message:", err);
            }
        };

        socket.onerror = (event) => {
            console.error("WebSocket error:", event);
            setConnected(false);
        };

        socket.onclose = () => {
            console.log("WebSocket disconnected");
            setConnected(false);
        };

        return () => {
            socket.close();
        };
    }, [id]);

    async function handleVote(event) {
        event.preventDefault();

        if (!selectedOption) {
            setError("Please select an option before voting.");
            setMessage("");
            return;
        }

        setMessage("");
        setError("");
        setVoting(true);

        try {
            const data = await apiRequest(`/polls/${id}/vote`, {
                method: "POST",
                body: JSON.stringify({
                    optionId: selectedOption,
                    voterId: getVoterId(),
                }),
            });

            setPoll(data.poll);
            setMessage("Your vote has been recorded.");
            setSelectedOption("");
        } catch (err) {
            setError(err.message);
        } finally {
            setVoting(false);
        }
    }

    function getTotalVotes() {
        if (!poll) {
            return 0;
        }

        return poll.options.reduce(
            (total, option) => total + option.votes,
            0
        );
    }

    function getPercentage(votes) {
        const totalVotes = getTotalVotes();

        if (totalVotes === 0) {
            return 0;
        }

        return Math.round((votes / totalVotes) * 100);
    }

    if (loading) {
        return (
            <main className="page">
                <div className="container" style={{ maxWidth: "700px" }}>
                    <div className="card">
                        <p className="muted">Loading poll...</p>
                    </div>
                </div>
            </main>
        );
    }

    if (error && !poll) {
        return (
            <main className="page">
                <div className="container" style={{ maxWidth: "700px" }}>
                    <div className="card">
                        <h1 className="page-title">Poll unavailable</h1>
                        <div className="error-message">{error}</div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="page">
            <div className="container" style={{ maxWidth: "700px" }}>
                <div
                    style={{
                        textAlign: "center",
                        marginBottom: "28px",
                    }}
                >
                    <p
                        style={{
                            margin: "0 0 6px",
                            color: "#4f46e5",
                            fontSize: "14px",
                            fontWeight: "700",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                        }}
                    >
                        Pollavote
                    </p>

                    <h1 className="page-title">Live Poll</h1>

                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "7px",
                            padding: "6px 10px",
                            borderRadius: "999px",
                            background: connected ? "#ecfdf3" : "#f2f4f7",
                            color: connected ? "#027a48" : "#667085",
                            fontSize: "13px",
                            fontWeight: "600",
                        }}
                    >
                        <span
                            style={{
                                width: "7px",
                                height: "7px",
                                borderRadius: "50%",
                                background: connected ? "#12b76a" : "#98a2b3",
                            }}
                        />

                        {connected ? "Live updates connected" : "Connecting to live updates..."}
                    </div>
                </div>

                <div className="card">
                    <h2
                        style={{
                            margin: "0 0 24px",
                            fontSize: "26px",
                            lineHeight: "1.3",
                            color: "#172033",
                        }}
                    >
                        {poll.question}
                    </h2>

                    <form onSubmit={handleVote}>
                        <div
                            style={{
                                display: "grid",
                                gap: "10px",
                                marginBottom: "20px",
                            }}
                        >
                            {poll.options.map((option) => {
                                const isSelected = selectedOption === option.id;

                                return (
                                    <label
                                        key={option.id}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "12px",
                                            padding: "14px 16px",
                                            border: isSelected
                                                ? "2px solid #4f46e5"
                                                : "1px solid #d0d5dd",
                                            borderRadius: "10px",
                                            background: isSelected ? "#eef2ff" : "#ffffff",
                                            cursor: "pointer",
                                            transition: "border-color 0.15s, background 0.15s",
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="poll-option"
                                            value={option.id}
                                            checked={isSelected}
                                            onChange={() => setSelectedOption(option.id)}
                                        />

                                        <span
                                            style={{
                                                flex: 1,
                                                color: "#344054",
                                                fontWeight: "500",
                                            }}
                                        >
                                            {option.text}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        {message && <div className="success-message">{message}</div>}

                        <button
                            type="submit"
                            className="primary-button"
                            disabled={voting}
                            style={{
                                width: "100%",
                                opacity: voting ? 0.7 : 1,
                            }}
                        >
                            {voting ? "Submitting vote..." : "Submit vote"}
                        </button>
                    </form>
                </div>

                <div style={{ marginTop: "24px" }}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            marginBottom: "14px",
                        }}
                    >
                        <h2
                            style={{
                                margin: 0,
                                fontSize: "21px",
                                color: "#172033",
                            }}
                        >
                            Live results
                        </h2>

                        <span className="muted" style={{ fontSize: "14px" }}>
                            {getTotalVotes()}{" "}
                            {getTotalVotes() === 1 ? "vote" : "votes"}
                        </span>
                    </div>

                    <div
                        className="card"
                        style={{
                            display: "grid",
                            gap: "16px",
                        }}
                    >
                        {poll.options.map((option) => {
                            const percentage = getPercentage(option.votes);

                            return (
                                <div key={option.id}>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            gap: "12px",
                                            marginBottom: "7px",
                                        }}
                                    >
                                        <span
                                            style={{
                                                color: "#344054",
                                                fontWeight: "600",
                                            }}
                                        >
                                            {option.text}
                                        </span>

                                        <span
                                            style={{
                                                color: "#667085",
                                                fontSize: "14px",
                                                fontWeight: "600",
                                            }}
                                        >
                                            {percentage}% · {option.votes}
                                        </span>
                                    </div>

                                    <div
                                        style={{
                                            height: "9px",
                                            overflow: "hidden",
                                            borderRadius: "999px",
                                            background: "#eaecf0",
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: `${percentage}%`,
                                                height: "100%",
                                                borderRadius: "999px",
                                                background: "#4f46e5",
                                                transition: "width 0.35s ease",
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <p
                    className="muted"
                    style={{
                        textAlign: "center",
                        marginTop: "22px",
                        fontSize: "13px",
                    }}
                >
                    Results update automatically when new votes are submitted.
                </p>
            </div>
        </main>
    );
}

export default Poll;