import React from "react";
import axios from "axios";
import ClubLogos from "./ClubLogos";

class History extends React.Component {
    state = {
        doneLoading: false,
        leagueId: 1,
        leagues: [],
        matches: [],
        minRound: 1,
        maxRound: 38,
        visibleRounds: {},   // rounds currently expanded
        closingRounds: {}    // for exit animation
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
                        // fetch and open ONLY the first round initially
                        this.fetchMatchesForRoundRange(
                            this.state.leagueId,
                            this.state.minRound,
                            this.state.maxRound,
                            /* openFirstOnly */ true
                        );
                    });
                } else {
                    console.log("Unexpected response structure:", response.data);
                }
            })
            .catch((error) => console.error("Fetching leagues failed: ", error));
    }

    // openFirstOnly:
    // - true  -> after fetch, mark ONLY the first round as visible
    // - false -> keep visibility as-is (used when changing min/max)
    fetchMatchesForRoundRange = (leagueId, minRound, maxRound, openFirstOnly = false) => {
        const requests = [];
        for (let round = minRound; round <= maxRound; round++) {
            requests.push(axios.get(`https://app.seker.live/fm1/round/${leagueId}/${round}`));
        }

        Promise.all(requests)
            .then((results) => {
                const matches = results.flatMap((r) => r.data);
                if (openFirstOnly) {
                    const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);
                    const firstRound = rounds.length ? rounds[0] : null;
                    const visibleRounds = firstRound ? { [firstRound]: true } : {};
                    this.setState({ matches, visibleRounds });
                } else {
                    this.setState({ matches });
                }
            })
            .catch((error) => console.error("Fetching matches failed: ", error));
    };

    handleLeagueChange = (leagueId) => {
        // switch league and open ONLY the first round
        this.setState({ leagueId, visibleRounds: {}, matches: [] }, () => {
            this.fetchMatchesForRoundRange(leagueId, this.state.minRound, this.state.maxRound, true);
        });
    };

    handleMinRoundChange = (e) => {
        const minRound = Math.max(1, Math.min(38, Number(e.target.value)));
        this.setState({ minRound }, () => {
            this.fetchMatchesForRoundRange(this.state.leagueId, minRound, this.state.maxRound, false);
            // keep only the new first round visible by default
            this.showOnlyFirstInRange(minRound, this.state.maxRound);
        });
    };

    handleMaxRoundChange = (e) => {
        const maxRound = Math.max(1, Math.min(38, Number(e.target.value)));
        this.setState({ maxRound }, () => {
            this.fetchMatchesForRoundRange(this.state.leagueId, this.state.minRound, maxRound, false);
            this.showOnlyFirstInRange(this.state.minRound, maxRound);
        });
    };

    showOnlyFirstInRange = (minRound, maxRound) => {
        this.setState((prev) => {
            const rounds = [...new Set(prev.matches.map((m) => m.round))]
                .filter((r) => r >= minRound && r <= maxRound)
                .sort((a, b) => a - b);
            const first = rounds[0];
            return { visibleRounds: first ? { [first]: true } : {} };
        });
    };

    toggleRoundVisibility = (round) => {
        const { visibleRounds } = this.state;
        if (visibleRounds[round]) {
            this.setState(
                (prev) => ({ closingRounds: { ...prev.closingRounds, [round]: true } }),
                () => {
                    setTimeout(() => {
                        this.setState((prev) => ({
                            visibleRounds: { ...prev.visibleRounds, [round]: false },
                            closingRounds: { ...prev.closingRounds, [round]: false },
                        }));
                    }, 350);
                }
            );
        } else {
            this.setState((prev) => ({
                visibleRounds: { ...prev.visibleRounds, [round]: true },
                closingRounds: { ...prev.closingRounds, [round]: false },
            }));
        }
    };

    renderMatches = () => {
        const { visibleRounds, closingRounds, matches } = this.state;
        const allRounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);
        if (allRounds.length === 0) return null;

        const firstRound = allRounds[0];
        const otherRounds = allRounds.slice(1);

        const renderRoundGrid = (round) => {
            const isVisible = !!visibleRounds[round];
            const isClosing = !!closingRounds[round];
            if (!isVisible && !isClosing) return null;

            return (
                <div className={`matches ${isClosing ? "closing" : "opening"}`}>
                    {matches
                        .filter((m) => m.round === round)
                        .map((match, idx) => {
                            const homeGoals = match.goals.filter((g) => g.home);
                            const awayGoals = match.goals.filter((g) => !g.home);
                            return (
                                <div key={idx} className="match-details">
                                    <div className="match-round-pill">Round {match.round}</div>

                                    {/* Home */}
                                    <div className="team-block home-team">
                                        <div className="team-line">
                                            <img
                                                className="clubLogo"
                                                src={ClubLogos[match.homeTeam.name]}
                                                alt={`${match.homeTeam.name} logo`}
                                            />
                                            <span className="team-name" title={match.homeTeam.name}>
                        {match.homeTeam.name}
                      </span>
                                        </div>
                                        <div className="scorers">
                                            {homeGoals.length ? (
                                                <ul>
                                                    {homeGoals.map((g, i) => (
                                                        <li key={i}>
                                                            {g.scorer.firstName} {g.scorer.lastName} ({g.minute}')
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <span className="no-scorers">—</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Score */}
                                    <div className="score">
                                        {homeGoals.length} - {awayGoals.length}
                                    </div>

                                    {/* Away */}
                                    <div className="team-block away-team">
                                        <div className="team-line">
                                            <img
                                                className="clubLogo"
                                                src={ClubLogos[match.awayTeam.name]}
                                                alt={`${match.awayTeam.name} logo`}
                                            />
                                            <span className="team-name" title={match.awayTeam.name}>
                        {match.awayTeam.name}
                      </span>
                                        </div>
                                        <div className="scorers">
                                            {awayGoals.length ? (
                                                <ul>
                                                    {awayGoals.map((g, i) => (
                                                        <li key={i}>
                                                            {g.scorer.firstName} {g.scorer.lastName} ({g.minute}')
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <span className="no-scorers">—</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            );
        };

        return (
            <>
                {/* First round section (visible by default) */}
                <div>
                    <button className="round-visibility-button" onClick={() => this.toggleRoundVisibility(firstRound)}>
                        Round {firstRound}
                    </button>
                    {renderRoundGrid(firstRound)}
                </div>

                {/* Round buttons strip */}
                <div className="round-buttons" style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "10px 0 18px" }}>
                    {otherRounds.map((r) => (
                        <button key={r} className="round-visibility-button" onClick={() => this.toggleRoundVisibility(r)}>
                            Round {r}
                        </button>
                    ))}
                </div>

                {/* Render ONLY the rounds that were opened by clicking their buttons */}
                {otherRounds.map((r) => (
                    <div key={`round-${r}`}>
                        {renderRoundGrid(r)}
                    </div>
                ))}
            </>
        );
    };

    render() {
        const { doneLoading, leagues, leagueId, minRound, maxRound } = this.state;
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

                        <div className="history-text-area">
                            Filter rounds between:&nbsp;
                            <input type="number" value={minRound} onChange={this.handleMinRoundChange} min="1" max="38" />&nbsp;and&nbsp;
                            <input type="number" value={maxRound} onChange={this.handleMaxRoundChange} min="1" max="38" />
                        </div>

                        {leagueId !== "-1" && this.renderMatches()}
                    </div>
                ) : (
                    <div>Loading ...</div>
                )}
            </div>
        );
    }
}

export default History;
