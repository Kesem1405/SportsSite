import React from "react";
import axios from "axios";

class TopScorers extends React.Component {
    state = {
        scorers: [],
        leagues: [],
        doneLoading: false,
        selectedLeagueId: 0
    }

    componentDidMount() {
        axios.get("https://app.seker.live/fm1/leagues")
            .then(response => {
                if (response.data && Array.isArray(response.data)) {
                    this.setState({leagues: response.data, doneLoading: true});
                } else {
                    console.log("Unexpected response structure:", response.data);
                }
            })
            .catch(error => console.error("Fetching leagues failed: ", error));
    }

    calculateTopScorers = (matches) => {
        const scorersMap = {};
        matches.forEach(match => {
            match.goals.forEach(goal => {
                const scorerId = goal.scorer.id;
                const scorerName = goal.scorer.firstName + " " + goal.scorer.lastName;
                if (!scorersMap[scorerId]) {
                    scorersMap[scorerId] = {
                        name: scorerName,
                        goals: 1,
                    };
                } else {
                    scorersMap[scorerId].goals += 1;
                }
            });
        });
        return Object.values(scorersMap).sort((a, b) => b.goals - a.goals).slice(0, 3);
    }

    fetchScorersForLeague = (leagueId) => {
        axios.get(`https://app.seker.live/fm1/history/${leagueId}`)
            .then(response => {
                if (response.data && Array.isArray(response.data)) {
                    const scorers = this.calculateTopScorers(response.data);
                    this.setState({scorers});
                    this.setState({selectedLeagueId: leagueId});
                } else {
                    console.log("Unexpected response structure:", response.data);
                }
            })
            .catch(error => console.error(`Fetching top scorers for league ${leagueId} failed: `, error));
    }

    render() {
        const { doneLoading, leagues, scorers, selectedLeagueId } = this.state;
        return (
            <div>
                <div className={"pageTitles"}> Top Scorers </div>
                {doneLoading ? (
                    <div>
                        {leagues.map((league) => (
                            <button key={league.id}
                                    onClick={() => this.fetchScorersForLeague(league.id)}
                                    className={selectedLeagueId === league.id ? "active-league" : "league"}
                            >
                                {league.name === "English" ? "Premier League" :
                                    league.name === "Italian" ? "Serie A" :
                                        league.name === "Spanish" ? "La Liga" :
                                            league.name}
                            </button>
                        ))}
                        <ol>
                            {scorers.map((scorer, index) => (
                                <div key={index} style={{textAlign: "center"}}>
                                    {index+1}.   {scorer.name} - {scorer.goals} goals
                                </div>
                            ))}
                        </ol>
                    </div>
                ) : (
                    <div>Loading...</div>
                )}
            </div>
        );
    }
}


export default TopScorers;
