import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";

function Dashboard() {
  const navigate = useNavigate();

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [createdPoll, setCreatedPoll] = useState(null);
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function loadPolls() {
      try {
        const data = await apiRequest("/my-polls");
        setPolls(data.polls || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadPolls();
  }, []);

  function handleOptionChange(index, value) {
    const updatedOptions = [...options];
    updatedOptions[index] = value;
    setOptions(updatedOptions);
  }

  function addOption() {
    setOptions([...options, ""]);
  }

  async function handleCreatePoll(event) {
    event.preventDefault();

    setMessage("");
    setError("");
    setCreating(true);

    try {
      const data = await apiRequest("/polls", {
        method: "POST",
        body: JSON.stringify({
          question,
          options,
        }),
      });

      setMessage(data.message);
      setCreatedPoll(data.poll);

      setPolls((currentPolls) => [data.poll, ...currentPolls]);

      setQuestion("");
      setOptions(["", ""]);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/");
  }

  function getPollLink(pollId) {
    return `${window.location.origin}/poll/${pollId}`;
  }

  async function handleCopyLink(pollId) {
    try {
      await navigator.clipboard.writeText(getPollLink(pollId));
      setMessage("Poll link copied to clipboard.");
      setError("");
    } catch {
      setError("Unable to copy the poll link.");
    }
  }

  return (
    <main className="page">
      <div className="container" style={{ maxWidth: "900px" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 5px",
                color: "#4f46e5",
                fontSize: "14px",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Pollavote
            </p>

            <h1 className="page-title" style={{ marginBottom: "4px" }}>
              Creator Dashboard
            </h1>

            <p className="muted">Create and manage your live polls.</p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </header>

        {error && <div className="error-message">{error}</div>}

        {message && <div className="success-message">{message}</div>}

        <div className="card" style={{ marginBottom: "24px" }}>
          <h2
            style={{
              margin: "0 0 6px",
              fontSize: "22px",
              color: "#172033",
            }}
          >
            Create a new poll
          </h2>

          <p className="muted" style={{ marginBottom: "24px" }}>
            Ask a question and add the options your audience can choose from.
          </p>

          <form onSubmit={handleCreatePoll}>
            <div className="form-group">
              <label htmlFor="question">Question</label>

              <input
                id="question"
                type="text"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="What should we have for lunch?"
                required
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "9px",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#344054",
                }}
              >
                Options
              </label>

              {options.map((option, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "10px",
                  }}
                >
                  <span
                    style={{
                      minWidth: "28px",
                      height: "28px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "50%",
                      background: "#eef2ff",
                      color: "#4f46e5",
                      fontSize: "13px",
                      fontWeight: "700",
                    }}
                  >
                    {index + 1}
                  </span>

                  <input
                    type="text"
                    value={option}
                    onChange={(event) =>
                      handleOptionChange(index, event.target.value)
                    }
                    placeholder={`Option ${index + 1}`}
                    required
                    style={{
                      flex: 1,
                      padding: "12px 14px",
                      border: "1px solid #d0d5dd",
                      borderRadius: "9px",
                      outline: "none",
                    }}
                  />
                </div>
              ))}

              <button
                type="button"
                className="secondary-button"
                onClick={addOption}
              >
                + Add option
              </button>
            </div>

            <button
              type="submit"
              className="primary-button"
              disabled={creating}
              style={{
                opacity: creating ? 0.7 : 1,
              }}
            >
              {creating ? "Creating poll..." : "Create poll"}
            </button>
          </form>
        </div>

        {createdPoll && (
          <div className="card" style={{ marginBottom: "24px" }}>
            <p
              style={{
                margin: "0 0 6px",
                color: "#027a48",
                fontSize: "14px",
                fontWeight: "700",
              }}
            >
              Poll created successfully
            </p>

            <h2
              style={{
                margin: "0 0 18px",
                fontSize: "20px",
                color: "#172033",
              }}
            >
              {createdPoll.question}
            </h2>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <button
                type="button"
                className="primary-button"
                onClick={() => navigate(`/poll/${createdPoll.id}`)}
              >
                Open poll
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={() => handleCopyLink(createdPoll.id)}
              >
                Copy share link
              </button>
            </div>
          </div>
        )}

        <section>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: "12px",
              marginBottom: "14px",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "22px",
                color: "#172033",
              }}
            >
              My polls
            </h2>

            {!loading && (
              <span className="muted" style={{ fontSize: "14px" }}>
                {polls.length} {polls.length === 1 ? "poll" : "polls"}
              </span>
            )}
          </div>

          {loading ? (
            <div className="card">
              <p className="muted">Loading your polls...</p>
            </div>
          ) : polls.length === 0 ? (
            <div className="card">
              <p
                style={{
                  margin: "0 0 6px",
                  fontWeight: "600",
                  color: "#172033",
                }}
              >
                No polls yet
              </p>

              <p className="muted">
                Create your first poll above to get started.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "12px",
              }}
            >
              {polls.map((poll) => (
                <div className="card" key={poll.id}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "16px",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin: "0 0 8px",
                          fontSize: "18px",
                          color: "#172033",
                        }}
                      >
                        {poll.question}
                      </h3>

                      <p className="muted" style={{ fontSize: "14px" }}>
                        {poll.options.length}{" "}
                        {poll.options.length === 1 ? "option" : "options"}
                      </p>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "8px",
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => navigate(`/poll/${poll.id}`)}
                      >
                        Open
                      </button>

                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => handleCopyLink(poll.id)}
                      >
                        Copy link
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default Dashboard;