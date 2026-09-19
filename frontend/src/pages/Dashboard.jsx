import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Icon, Logo } from "../components/pollavote/primitives";
import { apiRequest } from "../services/api";

const nf = new Intl.NumberFormat();

function initials(name = "") {
    const parts = name.trim().split(/\s+/);

    return (
        ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?"
    );
}

function greeting() {
    const hour = new Date().getHours();

    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
}

function sumVotes(poll) {
    return poll.options.reduce((sum, option) => sum + (option.votes || 0), 0);
}

function PollCard({ poll, onOpen, onCopyLink }) {
    const total = sumVotes(poll);

    const leader =
        poll.options.length > 0
            ? poll.options.reduce((a, b) =>
                (b.votes || 0) > (a.votes || 0) ? b : a
            )
            : null;

    const percentage =
        total && leader ? Math.round(((leader.votes || 0) / total) * 100) : 0;

    const created = poll.createdAt
        ? new Date(poll.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
        })
        : "";

    const shareUrl = `${window.location.origin}/poll/${poll.id}`;

    async function handleCopy(event) {
        event.stopPropagation();
        await onCopyLink(poll.id);
    }

    return (
        <li
            className="pv-pollcard"
            onClick={() => onOpen(poll.id)}
            style={{ cursor: "pointer" }}
        >
            <div className="pv-pollcard__top">
                <span className="pv-pill pv-pill--live">
                    <span
                        className="pv-live__dot"
                        style={{ width: 7, height: 7 }}
                    />
                    Live
                </span>

                {created && (
                    <span className="pv-pollcard__date">
                        Created {created}
                    </span>
                )}
            </div>

            <h3 className="pv-pollcard__q">
                {poll.question}
            </h3>

            <div className="pv-pollcard__lead">
                {total > 0 && leader ? (
                    <>
                        <div className="pv-pollcard__leadrow">
                            <span>
                                <span className="pv-muted">Leading: </span>
                                {leader.text}
                            </span>

                            <span className="pv-num">{percentage}%</span>
                        </div>

                        <div className="pv-track" aria-hidden="true">
                            <div
                                className="pv-fill pv-fill--accent"
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                    </>
                ) : (
                    <p
                        className="pv-muted"
                        style={{ fontSize: "0.925rem" }}
                    >
                        No votes yet. Copy the link to get the first one.
                    </p>
                )}
            </div>

            <div className="pv-pollcard__foot">
                <span className="pv-pollcard__votes">
                    <Icon name="users" size={16} />
                    {nf.format(total)} {total === 1 ? "vote" : "votes"}
                </span>

                <div className="pv-pollcard__actions">
                    <Button
                        variant="ghost"
                        size="sm"
                        icon="link"
                        onClick={handleCopy}
                    >
                        Copy link
                    </Button>
                </div>
            </div>

            <span className="pv-sr-only">{shareUrl}</span>
        </li>
    );
}

function EmptyState({ onCreatePoll }) {
    return (
        <section className="pv-empty" aria-labelledby="pv-empty-title">
            <svg
                width="176"
                height="128"
                viewBox="0 0 176 128"
                fill="none"
                aria-hidden="true"
            >
                <rect
                    x="14"
                    y="12"
                    width="148"
                    height="104"
                    rx="20"
                    style={{
                        fill: "var(--pv-surface-2)",
                        stroke: "var(--pv-selected-line)",
                    }}
                    strokeWidth="3"
                />

                <rect
                    x="34"
                    y="34"
                    width="70"
                    height="10"
                    rx="5"
                    style={{ fill: "var(--pv-text)" }}
                    opacity="0.85"
                />

                <rect
                    x="34"
                    y="58"
                    width="108"
                    height="14"
                    rx="7"
                    style={{
                        fill: "var(--pv-accent)",
                        stroke: "var(--pv-selected-line)",
                    }}
                    strokeWidth="2.5"
                />

                <rect
                    x="34"
                    y="80"
                    width="76"
                    height="14"
                    rx="7"
                    style={{ fill: "var(--pv-bar-muted)" }}
                />

                <circle
                    cx="146"
                    cy="24"
                    r="17"
                    style={{
                        fill: "var(--pv-accent)",
                        stroke: "var(--pv-selected-line)",
                    }}
                    strokeWidth="3"
                />

                <path
                    d="M139 24l5 5 9-10"
                    style={{ stroke: "var(--pv-on-accent)" }}
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>

            <h2 id="pv-empty-title">No polls yet</h2>

            <p>
                Write a question, add a few options, and share the link.
                Votes show up here as they come in.
            </p>

            <Button size="lg" icon="plus" onClick={onCreatePoll}>
                Create your first poll
            </Button>
        </section>
    );
}

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

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [filter, setFilter] = useState("all");

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

            setPolls((currentPolls) => [
                data.poll,
                ...currentPolls,
            ]);

            setQuestion("");
            setOptions(["", ""]);
            setShowCreateForm(false);
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

    function handleOpenPoll(pollId) {
        navigate(`/poll/${pollId}`);
    }

    const liveCount = polls.length;

    const totalVotes = useMemo(
        () => polls.reduce((sum, poll) => sum + sumVotes(poll), 0),
        [polls]
    );

    const shownPolls =
        filter === "all"
            ? polls
            : polls.filter(() => filter === "live");

    const firstName = "there";

    return (
        <div className="pv-root">
            <a className="pv-skip" href="#pv-dash-main">
                Skip to content
            </a>

            <header className="pv-nav">
                <div className="pv-nav__inner">
                    <Logo
                        size="sm"
                        href="/"
                        onClick={(event) => event.preventDefault()}
                    />

                    <span className="pv-nav__spacer" />

                    <Button
                        variant="ghost"
                        size="sm"
                        icon="logout"
                        onClick={handleLogout}
                        aria-label="Log out"
                    >
                        <span className="pv-hide-sm">Log out</span>
                    </Button>
                </div>
            </header>

            <main id="pv-dash-main" className="pv-container">
                <section className="pv-welcome" aria-labelledby="pv-welcome-title">
                    <div>
                        <h1 id="pv-welcome-title">
                            {greeting()}, {firstName}
                        </h1>

                        <p>
                            {polls.length
                                ? `${liveCount} ${liveCount === 1 ? "poll is" : "polls are"
                                } available in your dashboard.`
                                : "Create your first poll and share it in seconds."}
                        </p>
                    </div>

                    <Button
                        size="lg"
                        icon="plus"
                        onClick={() => {
                            setShowCreateForm(true);
                            setCreatedPoll(null);
                            setMessage("");
                            setError("");
                        }}
                    >
                        Create poll
                    </Button>
                </section>

                {error && (
                    <div
                        className="pv-alert pv-alert--error"
                        role="alert"
                        style={{ marginBottom: 20 }}
                    >
                        <Icon name="x" size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {message && (
                    <div
                        className="pv-alert pv-alert--success"
                        role="status"
                        style={{ marginBottom: 20 }}
                    >
                        <Icon name="check" size={18} />
                        <span>{message}</span>
                    </div>
                )}

                {showCreateForm && (
                    <section
                        className="pv-create-card"
                        style={{ marginBottom: 32 }}
                    >
                        <div className="pv-create-card__header">
                            <div>
                                <h2>Create a new poll</h2>
                                <p>
                                    Ask a question and add the options your audience
                                    can choose from.
                                </p>
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                icon="x"
                                onClick={() => setShowCreateForm(false)}
                                aria-label="Close create poll form"
                            >
                                <span className="pv-hide-sm">Close</span>
                            </Button>
                        </div>

                        <form onSubmit={handleCreatePoll}>
                            <div className="pv-field">
                                <label htmlFor="question">Question</label>

                                <input
                                    id="question"
                                    type="text"
                                    value={question}
                                    onChange={(event) =>
                                        setQuestion(event.target.value)
                                    }
                                    placeholder="What should we have for lunch?"
                                    required
                                />
                            </div>

                            <div className="pv-field">
                                <label>Options</label>

                                <div>
                                    {options.map((option, index) => (
                                        <div
                                            key={index}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 10,
                                                marginBottom: 10,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    minWidth: 30,
                                                    height: 30,
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    borderRadius: "50%",
                                                    background: "var(--pv-accent)",
                                                    color: "var(--pv-on-accent)",
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {index + 1}
                                            </span>

                                            <input
                                                type="text"
                                                value={option}
                                                onChange={(event) =>
                                                    handleOptionChange(
                                                        index,
                                                        event.target.value
                                                    )
                                                }
                                                placeholder={`Option ${index + 1}`}
                                                required
                                                style={{ flex: 1 }}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    icon="plus"
                                    onClick={addOption}
                                >
                                    Add option
                                </Button>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    gap: 12,
                                    flexWrap: "wrap",
                                }}
                            >
                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={creating}
                                >
                                    {creating ? "Creating poll..." : "Create poll"}
                                </Button>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="lg"
                                    onClick={() => setShowCreateForm(false)}
                                    disabled={creating}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </section>
                )}

                {createdPoll && (
                    <section
                        className="pv-create-card"
                        style={{ marginBottom: 32 }}
                    >
                        <div className="pv-create-card__header">
                            <div>
                                <span className="pv-pill pv-pill--live">
                                    Created successfully
                                </span>

                                <h2 style={{ marginTop: 12 }}>
                                    {createdPoll.question}
                                </h2>
                            </div>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 12,
                            }}
                        >
                            <Button
                                size="lg"
                                onClick={() =>
                                    navigate(`/poll/${createdPoll.id}`)
                                }
                            >
                                Open poll
                            </Button>

                            <Button
                                variant="ghost"
                                size="lg"
                                onClick={() =>
                                    handleCopyLink(createdPoll.id)
                                }
                            >
                                Copy share link
                            </Button>
                        </div>
                    </section>
                )}

                {polls.length > 0 ? (
                    <>
                        <dl className="pv-stats" style={{ margin: 0 }}>
                            <div className="pv-stat">
                                <dt className="pv-stat__label">Polls</dt>
                                <dd className="pv-stat__value" style={{ margin: 0 }}>
                                    {nf.format(polls.length)}
                                </dd>
                            </div>

                            <div className="pv-stat">
                                <dt className="pv-stat__label">Total votes</dt>
                                <dd className="pv-stat__value" style={{ margin: 0 }}>
                                    {nf.format(totalVotes)}
                                </dd>
                            </div>

                            <div className="pv-stat">
                                <dt className="pv-stat__label">Live now</dt>
                                <dd className="pv-stat__value" style={{ margin: 0 }}>
                                    {nf.format(liveCount)}
                                </dd>
                            </div>
                        </dl>

                        <div className="pv-toolbar">
                            <h2>Your polls</h2>

                            <div
                                className="pv-seg"
                                role="group"
                                aria-label="Filter polls"
                            >
                                <button
                                    type="button"
                                    className="pv-seg__btn"
                                    aria-pressed={filter === "all"}
                                    onClick={() => setFilter("all")}
                                >
                                    All
                                    <span className="pv-seg__count">
                                        {polls.length}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    className="pv-seg__btn"
                                    aria-pressed={filter === "live"}
                                    onClick={() => setFilter("live")}
                                >
                                    Live
                                    <span className="pv-seg__count">
                                        {polls.length}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="pv-empty pv-empty--slim">
                                <p style={{ margin: 0 }}>
                                    Loading your polls...
                                </p>
                            </div>
                        ) : shownPolls.length ? (
                            <ul className="pv-grid">
                                {shownPolls.map((poll) => (
                                    <PollCard
                                        key={poll.id}
                                        poll={poll}
                                        onOpen={handleOpenPoll}
                                        onCopyLink={handleCopyLink}
                                    />
                                ))}
                            </ul>
                        ) : (
                            <div className="pv-empty pv-empty--slim">
                                <p style={{ margin: 0 }}>
                                    No polls to show.
                                </p>
                            </div>
                        )}
                    </>
                ) : loading ? (
                    <div className="pv-empty pv-empty--slim">
                        <p style={{ margin: 0 }}>
                            Loading your polls...
                        </p>
                    </div>
                ) : (
                    <EmptyState
                        onCreatePoll={() => {
                            setShowCreateForm(true);
                            setCreatedPoll(null);
                            setMessage("");
                            setError("");
                        }}
                    />
                )}
            </main>
        </div>
    );
}

export default Dashboard;