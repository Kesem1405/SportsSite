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
        visibleRounds: {}
    }

    componentDidMount() {
        axios.get(`https://app.seker.live/fm1/leagues`)
            .then(response => {
                if (response.data && Array.isArray(response.data)) {
                    const leagues = response.data.map(league => ({
                        leagueId: league.id,
                        leagueName: league.name
                    }));
                    this.setState({leagues, doneLoading: true});
                } else {
                    console.log("Unexpected response structure:", response.data);
                }
            })
            .catch(error => console.error("Fetching leagues failed: ", error));
    }

    fetchMatchesForRoundRange = (leagueId, minRound, maxRound) => {
        const promises = [];
        for (let round = minRound; round <= maxRound; round++) {
            promises.push(axios.get(`https://app.seker.live/fm1/round/${leagueId}/${round}`));
        }
        Promise.all(promises)
            .then(results => {
                const matches = results.flatMap(result => result.data);
                this.setState({matches});
            })
            .catch(error => console.error("Fetching matches failed: ", error));
    }

    handleLeagueChange = (leagueId) => {
        this.setState({ leagueId });
        this.fetchMatchesForRoundRange(this.state.leagueId, this.state.minRound, this.state.maxRound);
        this.setState({visibleRounds: false})
    };

    handleMinRoundChange = (e) => {
        const minRound = Math.max(0, Math.min(38, e.target.value));
        this.setState({ minRound });
        this.fetchMatchesForRoundRange(this.state.leagueId, this.state.minRound, this.state.maxRound);
    };

    handleMaxRoundChange = (e) => {
        const maxRound = Math.max(0, Math.min(38, e.target.value));
        this.setState({ maxRound });
        this.fetchMatchesForRoundRange(this.state.leagueId, this.state.minRound, this.state.maxRound);
    };

    renderMatches = () => {
        const { visibleRounds, matches } = this.state;
        const rounds = [...new Set(matches.map(match => match.round))];
        return rounds.map((round) => (
            <div key={round}>
                <button className={"round-visibility-button"} onClick={() => this.toggleRoundVisibility(round)}>
                    Round {round}
                </button>
                {visibleRounds[round] && (
                    <div className="matches">
                        {matches.filter(match => match.round === round).map((match, index) => {
                            const homeScorers = match.goals.filter(goal => goal.home).map(goal => `${goal.scorer.firstName} ${goal.scorer.lastName} (${goal.minute}')`).join(", ");
                            const awayScorers = match.goals.filter(goal => !goal.home).map(goal => `${goal.scorer.firstName} ${goal.scorer.lastName} (${goal.minute}')`).join(", ");

                            return (
                                <div key={index} className="match-details">
                                    <strong>Round {match.round}</strong>
                                    <div>
                                        <img className="clubLogo" src={ClubLogos[match.homeTeam.name]} alt={`${match.homeTeam.name} logo`} />
                                        {match.homeTeam.name} {match.goals.filter(goal => goal.home).length} -
                                        {match.goals.filter(goal => !goal.home).length} {match.awayTeam.name}
                                        <img className="clubLogo" src={ClubLogos[match.awayTeam.name]} alt={`${match.awayTeam.name} logo`} />
                                    </div>
                                    <div>
                                        Home Scorers: {homeScorers.length > 0 ? homeScorers : "None"}
                                    </div>
                                    <div>
                                        Away Scorers: {awayScorers.length > 0 ? awayScorers : "None"}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        ));
    }


    toggleRoundVisibility = (round) => {
        this.setState(prevState => ({
            visibleRounds: {
                ...prevState.visibleRounds,
                [round]: !prevState.visibleRounds[round],
            },
        }));
    }


    render() {
        const { doneLoading, leagues, leagueId, minRound, maxRound } = this.state;
        return (
            <div>
                {doneLoading ? (
                    <div>
                        <div className={"pageTitles"}>League History</div>
                        <div>
                            {leagues.map((league, index) => (
                                <button
                                    key={index}
                                    onClick={() => this.handleLeagueChange(league.leagueId)}
                                    className={league.leagueId === leagueId ? "active-league" : "league"}
                                >
                                    {league.leagueName === "English" ? "Premier League" :
                                        league.leagueName === "Italian" ? "Serie A" :
                                            league.leagueName === "Spanish" ? "La Liga" :
                                                league.leagueName}
                                </button>
                            ))}
                        </div>
                        <div className={"history-text-area"}>
                        Filter rounds between:
                        <input
                            type="number"
                            value={minRound}
                            onChange={this.handleMinRoundChange}
                            min="0"
                            max="38"
                        />
                            and
                        <input
                            type="number"
                            value={maxRound}
                            onChange={this.handleMaxRoundChange}
                            min="0"
                            max="38"
                        />
                        {leagueId !== "-1" && this.renderMatches()}
                    </div>
                    </div>
                ) : (
                    <div>Loading ...</div>
                )}
            </div>
        );
    }
}

export default History;
