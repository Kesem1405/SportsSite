import React from "react";
import axios from "axios";

class Statistics extends React.Component {
    state = {
        selectedLeagueId: 0,
        leagues: [],
        firstHalfGoals: 0,
        secondHalfGoals: 0,
        earliestGoal: 'N/A',
        earliestGoalScorer: "",
        latestGoal: 'N/A',
        latestGoalScorer: "",
        highestRound: 'N/A',
        highestRoundGoals: 0,
        lowestRound: 'N/A',
        lowestRoundGoals: 'N/A',
        doneLoading: false,
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

    fetchLeagueStatistics = (leagueId) => {
        axios
            .get(`https://app.seker.live/fm1/history/${leagueId}`)
            .then((response) => {
                if (Array.isArray(response.data)) {
                    this.calculateMatchStats(response.data);
                    this.setState({ selectedLeagueId: leagueId });
                } else {
                    console.log("Unexpected response structure:", response.data);
                }
            })
            .catch((error) => console.error(`Fetching stats for league ${leagueId} failed: `, error));
    };

    calculateMatchStats = (matches) => {
        let earliestGoalMinute = 999;
        let earliestGoalScorer = "";
        let latestGoalMinute = 0;
        let latestScorerName = "";
        let fhGoals = 0;
        let shGoals = 0;
        const roundGoals = {};

        matches.forEach((match) => {
            const round = match.round;
            roundGoals[round] = roundGoals[round] || 0;

            match.goals.forEach((goal) => {
                const minute = parseInt(goal.minute);
                if (minute <= 45) fhGoals += 1;
                else shGoals += 1;

                roundGoals[round] += 1;

                if (minute < earliestGoalMinute) {
                    earliestGoalMinute = minute;
                    earliestGoalScorer = `${goal.scorer.firstName} ${goal.scorer.lastName}`;
                }
                if (minute > latestGoalMinute) {
                    latestGoalMinute = minute;
                    latestScorerName = `${goal.scorer.firstName} ${goal.scorer.lastName}`;
                }
            });
        });

        let highestRoundGoals = 0;
        let lowestRoundGoals = Infinity;
        let highestRound = 'N/A';
        let lowestRound = 'N/A';

        Object.keys(roundGoals).forEach((r) => {
            const g = roundGoals[r];
            if (g > highestRoundGoals) { highestRoundGoals = g; highestRound = r; }
            if (g < lowestRoundGoals) { lowestRoundGoals = g; lowestRound = r; }
        });

        this.setState({
            firstHalfGoals: fhGoals,
            secondHalfGoals: shGoals,
            earliestGoal: earliestGoalMinute === 999 ? 'N/A' : earliestGoalMinute,
            earliestGoalScorer: earliestGoalScorer || 'N/A',
            latestGoal: latestGoalMinute === 0 ? 'N/A' : latestGoalMinute,
            latestGoalScorer: latestScorerName || 'N/A',
            highestRound,
            highestRoundGoals,
            lowestRound,
            lowestRoundGoals: lowestRoundGoals === Infinity ? 'N/A' : lowestRoundGoals,
            doneLoading: true,
        });
    };

    render() {
        const { doneLoading, leagues, selectedLeagueId } = this.state;

        return (
            <div className="container">
                <div className="pageTitles pageTitles--bright">League Statistics</div>

                {doneLoading ? (
                    <>
                        <nav className="top-nav">
                            {leagues.map((league) => (
                                <button
                                    key={league.id}
                                    onClick={() => this.fetchLeagueStatistics(league.id)}
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

                        {this.state.earliestGoal !== 'N/A' || this.state.latestGoal !== 'N/A' ? (
                            <div className="cards-grid stats-cards">
                                <div className="card stat-card">
                                    <div className="stat-title">First Half Goals</div>
                                    <div className="stat-value">{this.state.firstHalfGoals}</div>
                                </div>
                                <div className="card stat-card">
                                    <div className="stat-title">Second Half Goals</div>
                                    <div className="stat-value">{this.state.secondHalfGoals}</div>
                                </div>
                                <div className="card stat-card">
                                    <div className="stat-title">Total Goals</div>
                                    <div className="stat-value">{this.state.firstHalfGoals + this.state.secondHalfGoals}</div>
                                </div>
                                <div className="card stat-card">
                                    <div className="stat-title">Earliest Goal</div>
                                    <div className="stat-value">
                                        {this.state.earliestGoal}' <span className="stat-sub">by {this.state.earliestGoalScorer}</span>
                                    </div>
                                </div>
                                <div className="card stat-card">
                                    <div className="stat-title">Latest Goal</div>
                                    <div className="stat-value">
                                        {this.state.latestGoal}' <span className="stat-sub">by {this.state.latestGoalScorer}</span>
                                    </div>
                                </div>
                                <div className="card stat-card">
                                    <div className="stat-title">Highest Round Goals</div>
                                    <div className="stat-value">
                                        {this.state.highestRoundGoals} <span className="stat-sub">in Round {this.state.highestRound}</span>
                                    </div>
                                </div>
                                <div className="card stat-card">
                                    <div className="stat-title">Lowest Round Goals</div>
                                    <div className="stat-value">
                                        {this.state.lowestRoundGoals} <span className="stat-sub">in Round {this.state.lowestRound}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ opacity: 0.7, textAlign: "center", marginTop: 12 }}>
                                Choose a league to view statistics.
                            </div>
                        )}
                    </>
                ) : (
                    <div>Loading leagues...</div>
                )}
            </div>
        );
    }
}

export default Statistics;
