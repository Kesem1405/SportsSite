import React from "react";
import axios from "axios";
import { Link } from "react-router-dom";   // ⬅️ added
import ClubLogos from "./ClubLogos";

class History extends React.Component {
    state = {
        doneLoading: false,
        leagueId: 1,
        leagues: [],
        matches: [],
        minRound: 1,
        maxRound: 38,
        rounds: [],
        activeRound: null,
    };

    componentDidMount() {
        axios.get(`https://app.seker.live/fm1/leagues`)
            .then((response) => {
                if (Array.isArray(response.data)) {
                    const leagues = response.data.map((league) => ({
                        leagueId: league.id,
                        leagueName: league.name,
                    }));
                    this.setState({ leagues, doneLoading: true }, () => {
                        this.fetchMatchesForRange(this.state.leagueId, this.state.minRound, this.state.maxRound, true);
                    });
                } else {
                    console.log("Unexpected response structure:", response.data);
                }
            })
            .catch((error) => console.error("Fetching leagues failed: ", error));
    }

    fetchMatchesForRange = (leagueId, minRound, maxRound, resetActive = false) => {
        const requests = [];
        for (let r = minRound; r <= maxRound; r++) {
            requests.push(axios.get(`https://app.seker.live/fm1/round/${leagueId}/${r}`));
        }
        Promise.all(requests)
            .then((results) => {
                const matches = results.flatMap((r) => r.data);
                const rounds = [...new Set(matches.map((m) => m.round))]
                    .filter((r) => r >= minRound && r <= maxRound)
                    .sort((a, b) => a - b);

                let activeRound = this.state.activeRound;
                if (resetActive || !rounds.includes(activeRound)) {
                    activeRound = rounds.length ? rounds[0] : null;
                }

                this.setState({ matches, rounds, activeRound });
            })
            .catch((error) => console.error("Fetching matches failed: ", error));
    };

    handleLeagueChange = (leagueId) => {
        this.setState({ leagueId, matches: [], rounds: [], activeRound: null }, () => {
            this.fetchMatchesForRange(leagueId, this.state.minRound, this.state.maxRound, true);
        });
    };

    handleMinRoundChange = (e) => {
        const minRound = Math.max(1, Math.min(38, Number(e.target.value)));
        this.setState({ minRound }, () => {
            this.fetchMatchesForRange(this.state.leagueId, minRound, this.state.maxRound, true);
        });
    };

    handleMaxRoundChange = (e) => {
        const maxRound = Math.max(1, Math.min(38, Number(e.target.value)));
        this.setState({ maxRound }, () => {
            this.fetchMatchesForRange(this.state.leagueId, this.state.minRound, maxRound, true);
        });
    };

    setActiveRound = (round) => this.setState({ activeRound: round });

    renderRoundGrid = (round) => {
        const { matches, leagueId } = this.state;
        const list = matches.filter((m) => m.round === round);
        if (!list.length) return null;

        return (
            <div className="matches opening">
                {list.map((match, idx) => {
                    const homeGoals = match.goals.filter((g) => g.home);
                    const awayGoals = match.goals.filter((g) => !g.home);
                    return (
                        <div key={idx} className="match-details">
                            <div className="match-round-pill" style={{ fontWeight: "bold" }}>
                                Round {match.round}
                            </div>

                            {/* Home */}
                            <div className="team-block home-team">
                                <div className="team-line">
                                    {/* ⬇️ logo links to the squad */}
                                    <Link
                                        to={`/squad/${leagueId}/${match.homeTeam.id}`}
                                        className="clubLogo-link"
                                        title={`View ${match.homeTeam.name} squad`}
                                    >
                                        <img
                                            className="clubLogo"
                                            src={ClubLogos[match.homeTeam.name]}
                                            alt={`${match.homeTeam.name} logo`}
                                        />
                                    </Link>
                                    <span className="team-name" title={match.homeTeam.name}>{match.homeTeam.name}</span>
                                </div>
                                <div className="scorers">
                                    {homeGoals.length ? (
                                        <ul>
                                            {homeGoals.map((g, i) => (
                                                <li key={i}>⚽ {g.scorer.firstName} {g.scorer.lastName} ({g.minute}')</li>
                                            ))}
                                        </ul>
                                    ) : <span className="no-scorers">—</span>}
                                </div>
                            </div>

                            {/* Score */}
                            <div className="score">{homeGoals.length} - {awayGoals.length}</div>

                            {/* Away */}
                            <div className="team-block away-team">
                                <div className="team-line">
                                    {/* ⬇️ logo links to the squad */}
                                    <Link
                                        to={`/squad/${leagueId}/${match.awayTeam.id}`}
                                        className="clubLogo-link"
                                        title={`View ${match.awayTeam.name} squad`}
                                    >
                                        <img
                                            className="clubLogo"
                                            src={ClubLogos[match.awayTeam.name]}
                                            alt={`${match.awayTeam.name} logo`}
                                        />
                                    </Link>
                                    <span className="team-name" title={match.awayTeam.name}>{match.awayTeam.name}</span>
                                </div>
                                <div className="scorers">
                                    {awayGoals.length ? (
                                        <ul>
                                            {awayGoals.map((g, i) => (
                                                <li key={i}>⚽ {g.scorer.firstName} {g.scorer.lastName} ({g.minute}')</li>
                                            ))}
                                        </ul>
                                    ) : <span className="no-scorers">—</span>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    render() {
        const { doneLoading, leagues, leagueId, minRound, maxRound, rounds, activeRound } = this.state;

        return (
            <div>
                {doneLoading ? (
                    <div className="container">
                        <div className="pageTitles pageTitles--bright">League History</div>

                        <nav className="top-nav">
                            {leagues.map((league) => (
                                <button
                                    key={league.leagueId}
                                    onClick={() => this.handleLeagueChange(league.leagueId)}
                                    className={league.leagueId === leagueId ? "active-league" : "league"}
                                >
                                    {league.leagueName === "English"
                                        ? "Premier League"
                                        : league.leagueName === "Italian"
                                            ? "Serie A"
                                            : league.leagueName === "Spanish"
                                                ? "La Liga"
                                                : league.leagueName}
                                </button>
                            ))}
                        </nav>

                        {/* Range inputs */}
                        <div className="history-text-area">
                            Filter rounds between:&nbsp;
                            <input
                                type="number"
                                value={minRound}
                                onChange={this.handleMinRoundChange}
                                min="1"
                                max="38"
                            />
                            &nbsp;and&nbsp;
                            <input
                                type="number"
                                value={maxRound}
                                onChange={this.handleMaxRoundChange}
                                min="1"
                                max="38"
                            />
                        </div>

                        {/* Round chips just below the range controls */}
                        {rounds.length > 0 && (
                            <div className="round-tabs">
                                {rounds.map((r) => (
                                    <button
                                        key={r}
                                        className={`round-chip ${r === activeRound ? "active" : ""}`}
                                        onClick={() => this.setActiveRound(r)}
                                    >
                                        Round {r}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Active round grid */}
                        {activeRound ? (
                            this.renderRoundGrid(activeRound)
                        ) : (
                            <div style={{ opacity: 0.7, textAlign: "center" }}>
                                No rounds in this range.
                            </div>
                        )}
                    </div>
                ) : (
                    <div>Loading ...</div>
                )}
            </div>
        );
    }
}

export default History;
