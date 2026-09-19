import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Button, Icon, Logo } from "../components/pollavote/primitives";
import { apiRequest } from "../services/api";

function getVoterId() {
    let voterId = localStorage.getItem("voterId");

    if (!voterId) {
        voterId = crypto.randomUUID();
        localStorage.setItem("voterId", voterId);
    }

    return voterId;
}

function LiveIndicator({ connected }) {
    return (
        <span
            className={`pv-live ${connected ? "pv-live--live" : "pv-live--connecting"
                }`}
            role="status"
        >
            <span className="pv-live__dot" aria-hidden="true" />
            <span className="pv-sr-only">Live updates: </span>
            <span>{connected ? "Live" : "Connecting"}</span>
        </span>
    );
}

function ResultRow({ option, total }) {
    const percentage =
        total === 0 ? 0 : (option.votes / total) * 100;

    return (
        <li className="pv-result">
            <div className="pv-result__row">
                <span className="pv-result__label">
                    {option.text}
                </span>

                <span className="pv-result__figures">
                    <span className="pv-num">
                        {Math.round(percentage)}%
                    </span>

                    <span className="pv-result__count">
                        {option.votes}{" "}
                        {option.votes === 1 ? "vote" : "votes"}
                    </span>
                </span>
            </div>

            <div className="pv-track" aria-hidden="true">
                <div
                    className="pv-fill"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </li>
    );
}

function Poll() {
    const { id } = useParams();

    const [poll, setPoll] = useState(null);
    const [selectedOption, setSelectedOption] = useState("");
    const [message, setMessage] = useState("");
    const [copyMessage, setCopyMessage] = useState("");
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
            import.meta.env.VITE_WS_BASE_URL ||
            "ws://localhost:8080";

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
                console.error(
                    "Failed to parse WebSocket message:",
                    err
                );
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
        setCopyMessage("");
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

    const totalVotes = useMemo(() => {
        if (!poll) {
            return 0;
        }

        return poll.options.reduce(
            (total, option) => total + option.votes,
            0
        );
    }, [poll]);

    const shareUrl = `${window.location.origin}/poll/${id}`;

    async function handleCopyLink() {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopyMessage("Poll link copied to clipboard.");
            setError("");
        } catch {
            setCopyMessage("Unable to copy the poll link.");
        }
    }

    if (loading) {
        return (
            <div className="pv-root pv-pub">
                <header className="pv-pubbar">
                    <Logo size="sm" href="/" />
                </header>

                <main className="pv-pub__main">
                    <article className="pv-poll">
                        <div className="pv-empty pv-empty--slim">
                            <p style={{ margin: 0 }}>
                                Loading poll...
                            </p>
                        </div>
                    </article>
                </main>
            </div>
        );
    }

    if (error && !poll) {
        return (
            <div className="pv-root pv-pub">
                <header className="pv-pubbar">
                    <Logo size="sm" href="/" />
                </header>

                <main className="pv-pub__main">
                    <article className="pv-poll">
                        <div className="pv-poll__meta">
                            <span className="pv-poll__by">
                                Public poll
                            </span>
                        </div>

                        <h1 className="pv-poll__q">
                            Poll unavailable
                        </h1>

                        <div
                            className="pv-field__error"
                            role="alert"
                        >
                            <Icon name="alert" size={16} />
                            <span>{error}</span>
                        </div>
                    </article>
                </main>
            </div>
        );
    }

    return (
        <div className="pv-root pv-pub pv-pub--dots">
            <a className="pv-skip" href="#pv-poll-main">
                Skip to poll
            </a>

            <header className="pv-pubbar">
                <Logo size="sm" href="/" />

                <Button
                    as="a"
                    href="/signup"
                    variant="ghost"
                    size="sm"
                >
                    Make your own poll
                </Button>
            </header>

            <main
                id="pv-poll-main"
                className="pv-pub__main"
            >
                <article
                    className="pv-poll"
                    aria-labelledby="poll-question"
                >
                    <div className="pv-poll__meta">
                        <span className="pv-poll__by">
                            Public poll
                        </span>

                        <LiveIndicator connected={connected} />
                    </div>

                    <h1
                        className="pv-poll__q"
                        id="poll-question"
                    >
                        {poll.question}
                    </h1>

                    <form onSubmit={handleVote} noValidate>
                        <fieldset
                            className="pv-options"
                            aria-label="Poll options"
                        >
                            {poll.options.map((option) => {
                                const isSelected =
                                    selectedOption === option.id;

                                return (
                                    <label
                                        className="pv-option"
                                        key={option.id}
                                    >
                                        <input
                                            type="radio"
                                            name="poll-option"
                                            value={option.id}
                                            checked={isSelected}
                                            onChange={() => {
                                                setSelectedOption(option.id);
                                                setError("");
                                            }}
                                        />

                                        <span
                                            className="pv-option__mark"
                                            aria-hidden="true"
                                        >
                                            <Icon
                                                name="check"
                                                size={15}
                                                strokeWidth={3.5}
                                            />
                                        </span>

                                        <span className="pv-option__text">
                                            {option.text}
                                        </span>
                                    </label>
                                );
                            })}
                        </fieldset>

                        <div className="pv-poll__actions">
                            {error && (
                                <p
                                    className="pv-field__error"
                                    role="alert"
                                >
                                    <Icon name="alert" size={16} />
                                    <span>{error}</span>
                                </p>
                            )}

                            {message && (
                                <div
                                    className="pv-confirm pv-confirm--new"
                                    role="status"
                                >
                                    <span
                                        className="pv-confirm__badge"
                                        aria-hidden="true"
                                    >
                                        <Icon
                                            name="check"
                                            size={20}
                                            strokeWidth={3.2}
                                        />
                                    </span>

                                    <div>
                                        <h2 className="pv-confirm__title">
                                            Vote recorded
                                        </h2>

                                        <p>{message}</p>
                                    </div>
                                </div>
                            )}

                            <Button
                                type="submit"
                                size="lg"
                                block
                                loading={voting}
                            >
                                {voting
                                    ? "Submitting vote..."
                                    : "Vote"}
                            </Button>
                        </div>
                    </form>
                </article>

                <section
                    className="pv-poll"
                    aria-labelledby="results-title"
                >
                    <div className="pv-results__head">
                        <div>
                            <h2
                                id="results-title"
                                className="pv-poll__q"
                                style={{ fontSize: "1.5rem" }}
                            >
                                Live results
                            </h2>

                            <p className="pv-muted">
                                Results update automatically as votes arrive.
                            </p>
                        </div>

                        <span className="pv-num">
                            {totalVotes}
                        </span>
                    </div>

                    <ul
                        className="pv-results"
                        aria-label="Live poll results"
                    >
                        {poll.options.map((option) => (
                            <ResultRow
                                key={option.id}
                                option={option}
                                total={totalVotes}
                            />
                        ))}
                    </ul>

                    <div className="pv-results__foot">
                        <p className="pv-results__total">
                            {totalVotes}
                            <span>
                                {totalVotes === 1
                                    ? "vote"
                                    : "votes"}{" "}
                                in total
                            </span>
                        </p>

                        <p className="pv-results__note">
                            {connected
                                ? "Live updates enabled"
                                : "Live updates reconnecting..."}
                        </p>
                    </div>
                </section>

                <section
                    className="pv-share"
                    aria-labelledby="share-title"
                >
                    <h2
                        className="pv-share__title"
                        id="share-title"
                    >
                        <Icon name="share" size={18} />
                        Share this poll
                    </h2>

                    <div className="pv-share__row">
                        <input
                            className="pv-share__url"
                            readOnly
                            value={shareUrl}
                            aria-label="Poll link"
                            onFocus={(event) =>
                                event.target.select()
                            }
                        />

                        <Button
                            variant="secondary"
                            icon="copy"
                            onClick={handleCopyLink}
                        >
                            Copy link
                        </Button>
                    </div>

                    {copyMessage && (
                        <p
                            className="pv-results__note"
                            role="status"
                        >
                            {copyMessage}
                        </p>
                    )}
                </section>
            </main>

            <footer className="pv-pub__foot">
                Polls made with pollavote
            </footer>
        </div>
    );
}

export default Poll;