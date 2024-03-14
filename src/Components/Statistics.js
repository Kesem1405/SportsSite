import React from "react";

import axios from "axios";

class Statistics extends React.Component {
    state = {
        selectedLeagueId: 0,
        leagues: [],
        firstHalfGoals: [],
        secondHalfGoals: [],
        earliestGoal: 999,
        earliestGoalScorer: "",
        latestGoal: '0',
        latestGoalScorer: "",
        highestRound: 0,
        highestRoundGoals: 0,
        lowestRound: 0,
        lowestRoundGoals: 0,
        doneLoading: false
    }

    componentDidMount() {
        axios.get("https://app.seker.live/fm1/leagues")
            .then(response => {
                if (response.data && Array.isArray(response.data)) {
                    this.setState({leagues: response.data});
                } else {
                    console.log("Unexpected response structure:", response.data);
                }
            })
            .catch(error => console.error("Fetching leagues failed: ", error));
    }

    fetchLeagueStatistics = (leagueId) => {
        axios.get(`https://app.seker.live/fm1/history/${leagueId}`)
            .then(response => {
                if (response.data && Array.isArray(response.data)) {
                    const stats = this.calculateMatchStats(response.data);
                    this.setState({selectedLeagueId: leagueId})
                } else {
                    console.log("Unexpected response structure:", response.data);
                }
            })
            .catch(error => console.error(`Fetching top scorers for league ${leagueId} failed: `, error));
    }

    calculateMatchStats = (matches) => {
        let earliestGoalMinute = 999;
        let earliestGoalScorer = "";
        let latestGoalMinute = 0;
        let latestScorerName = "";
        let fhGoals = 0;
        let shGoals = 0;
        let roundGoals = {};

        matches.forEach(match => {
            const round = match.round;
            if (!roundGoals[round]) {
                roundGoals[round] = 0; // Initialize this round in the tracker if not already present
            }

            match.goals.forEach(goal => {
                const goalMinute = parseInt(goal.minute);
                if (goalMinute <= 45) {
                    fhGoals += 1;
                } else {
                    shGoals += 1;
                }
                roundGoals[round] += 1;

                if (goalMinute < earliestGoalMinute) {
                    earliestGoalMinute = goalMinute;
                    earliestGoalScorer = goal.scorer.firstName + " " + goal.scorer.lastName;
                }
                if (goalMinute > latestGoalMinute) {
                    latestGoalMinute = goalMinute;
                    latestScorerName = goal.scorer.firstName + " " + goal.scorer.lastName;
                }
            });
        });

        let highestRoundGoals = 0;
        let lowestRoundGoals = 999;
        let highestRound = -1;
        let lowestRound = -1;

        Object.keys(roundGoals).forEach(round => {
            const goals = roundGoals[round];
            if (goals > highestRoundGoals) {
                highestRoundGoals = goals;
                highestRound = round;
            }
            if (goals < lowestRoundGoals) {
                lowestRoundGoals = goals;
                lowestRound = round;
            }
        });

        this.setState({
            firstHalfGoals: fhGoals,
            secondHalfGoals: shGoals,
            earliestGoal: earliestGoalMinute === 999 ? 'N/A' : earliestGoalMinute,
            earliestGoalScorer: earliestGoalScorer || 'N/A',
            latestGoal: latestGoalMinute === 0 ? 'N/A' : latestGoalMinute,
            latestGoalScorer: latestScorerName || 'N/A',
            highestRoundGoals: highestRoundGoals,
            lowestRoundGoals: lowestRoundGoals === 999 ? 'N/A' : lowestRoundGoals,
            highestRound: highestRound === -1 ? 'N/A' : highestRound,
            lowestRound: lowestRound === -1 ? 'N/A' : lowestRound,
            doneLoading: true
        });
    }


    render() {
        return (
            <div>
                <div className={"pageTitles"}> League statistics</div>
                <div>
                    {this.state.leagues.map((league) => (
                        <button
                            key={league.id} // Make sure 'id' is the correct key field
                            onClick={() => this.fetchLeagueStatistics(league.id)}
                            className={`button ${this.state.selectedLeagueId === league.id ? "active-league" : "league"}`}
                        >
                            {league.name}
                        </button>
                    ))}
                    {this.state.earliestGoal !== 999 && (
                        <div className="statistics">
                            <div>First half goals = {this.state.firstHalfGoals}</div>
                            <div>Second half goals = {this.state.secondHalfGoals}</div>
                            <div>Total goals = {this.state.firstHalfGoals + this.state.secondHalfGoals}</div>
                            <div>Earliest goal
                                = {this.state.earliestGoal + "' Minute By " + this.state.earliestGoalScorer}</div>
                            <div>Latest goal
                                = {this.state.latestGoal + "' Minute By " + this.state.latestGoalScorer}</div>
                            <div>Highest round goals
                                = {this.state.highestRoundGoals + " In round: " + this.state.highestRound}</div>
                            <div>Lowest round goals
                                = {this.state.lowestRoundGoals + " In round: " + this.state.lowestRound}</div>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

export default Statistics;