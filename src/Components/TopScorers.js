import React from "react";
import axios from "axios";
import ClubLogos from "./ClubLogos";

class TopScorers extends React.Component {
    state = {
        scorers: [],
        leagues: [],
        doneLoading: false,
        selectedLeagueId: 0,
    };

    componentDidMount() {
        axios
            .get("https://app.seker.live/fm1/leagues")
            .then((response) => {
                if (Array.isArray(response.data)) {
                    this.setState({ leagues: response.data, doneLoading: true });
                } else {
                    console.log("Unexpected response structure:", response.data);
                }
            })
            .catch((error) => console.error("Fetching leagues failed: ", error));
    }

    calculateTopScorers = (matches) => {
        // Build scorer -> {name, goals, clubName}
        const scorersMap = {};
        for (const match of matches) {
            const homeName = match.homeTeam?.name;
            const awayName = match.awayTeam?.name;

            for (const goal of match.goals || []) {
                const id = goal.scorer.id;
                const name = `${goal.scorer.firstName} ${goal.scorer.lastName}`;
                const clubName = goal.home ? homeName : awayName;

                if (!scorersMap[id]) {
                    scorersMap[id] = { id, name, goals: 1, clubName };
                } else {
                    scorersMap[id].goals += 1;
                    // keep first non-empty club (players shouldn’t switch in this dataset)
                    if (!scorersMap[id].clubName && clubName) scorersMap[id].clubName = clubName;
                }
            }
        }

        return Object.values(scorersMap)
            .sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name))
            .slice(0, 10);
    };

    fetchScorersForLeague = (leagueId) => {
        axios
            .get(`https://app.seker.live/fm1/history/${leagueId}`)
            .then((response) => {
                if (Array.isArray(response.data)) {
                    const scorers = this.calculateTopScorers(response.data);
                    this.setState({ scorers, selectedLeagueId: leagueId });
                } else {
                    console.log("Unexpected response structure:", response.data);
                }
            })
            .catch((error) => console.error(`Fetching top scorers for league ${leagueId} failed: `, error));
    };

    render() {
        const { doneLoading, leagues, scorers, selectedLeagueId } = this.state;

        return (
            <div className="container">
                <div className="pageTitles pageTitles--bright">Top Scorers</div>

                {doneLoading ? (
                    <>
                        <nav className="top-nav">
                            {leagues.map((league) => (
                                <button
                                    key={league.id}
                                    onClick={() => this.fetchScorersForLeague(league.id)}
                                    className={selectedLeagueId === league.id ? "active-league" : "league"}
                                >
                                    {league.name === "English"
                                        ? "Premier League"
                                        : league.name === "Italian"
                                            ? "Serie A"
                                            : league.name === "Spanish"
                                                ? "La Liga"
                                                : league.name}
                                </button>
                            ))}
                        </nav>

                        {scorers.length > 0 ? (
                            <div className="cards-grid">
                                {scorers.map((s, i) => (
                                    <div key={s.id ?? i} className="card scorer-card">
                                        <div className={`rank-badge rank-${i + 1}`}>{i + 1}</div>

                                        <div className="scorer-main">
                                            <div className="scorer-name" title={s.name}>{s.name}</div>
                                            <div className="scorer-sub">
                                                <span className="pill">{s.goals} goals ⚽</span>
                                            </div>
                                        </div>

                                        <div className="scorer-club">
                                            {s.clubName && (
                                                <img
                                                    className="scorer-clubLogo"
                                                    src={ClubLogos[s.clubName]}
                                                    alt={`${s.clubName} logo`}
                                                    title={s.clubName}
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ opacity: 0.7, textAlign: "center", marginTop: 12 }}>
                                Choose a league to see top scorers.
                            </div>
                        )}
                    </>
                ) : (
                    <div>Loading...</div>
                )}
            </div>
        );
    }
}

export default TopScorers;
