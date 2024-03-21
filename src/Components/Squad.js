import React, { Component } from 'react';
import axios from 'axios';
import ClubLogos from "./ClubLogos";
import {renderMatches} from "react-router-dom";

class Squad extends Component {
    state = {
        clubName: '',
        players: [],
        doneLoading: false,
        matches: [],
    };

    componentDidMount() {
        const { leagueId, teamId } = this.props.params;
        axios.get(`https://app.seker.live/fm1/squad/${leagueId}/${teamId}`)
            .then(response => {
                if (response.data && Array.isArray(response.data)) {
                    this.setState({players: response.data, doneLoading: true});
                    this.fetchClubName(leagueId, teamId);
                    this.fetchTeamMatches(leagueId, teamId);
                } else {
                    console.log("Unexpected response structure:", response.data);
                }
            })
            .catch(error => console.error("Fetching squad failed: ", error));
    }


    fetchClubName(lId, tId) {
        axios.get(`https://app.seker.live/fm1/history/${lId}`)
            .then(response => {
                let found = false;
                for (let match of response.data) {
                    let homeTeamId = String(match.homeTeam.id);
                    let awayTeamId = String(match.awayTeam.id);
                    let targetId = String(tId);
                    if (homeTeamId === targetId || awayTeamId === targetId) {
                        this.setState({ clubName: homeTeamId === targetId ? match.homeTeam.name : match.awayTeam.name });
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    console.log("Team not found in the matches");
                }
            })
            .catch(error => console.error("Fetching squad name failed: ", error));
    }

    fetchTeamMatches = (leagueId, teamId) => {
        axios.get(`https://app.seker.live/fm1/history/${leagueId}/${teamId}`)
            .then(response => {
                if (response.data && Array.isArray(response.data)) {
                    this.setState({matches: response.data});
                } else {
                    console.log("Unexpected response structure:", response.data);
                }
            })
            .catch(error => console.error("Fetching team matches failed: ", error));
    };

    renderMatches = () => {
        const { matches } = this.state;
        return matches.map((match, index) => {
            // Counting goals for home and away teams
            let homeGoals = 0;
            let awayGoals = 0;
            match.goals.forEach(goal => {
                if (goal.home) {
                    homeGoals++;
                } else {
                    awayGoals++;
                }
            });

            return (
                <div key={index}>
                    <div style={{fontWeight:"bold", marginBottom: "15px"}}>
                    <img className="clubLogo" src={ClubLogos[match.homeTeam.name]} alt={`${match.homeTeam.name} logo`}/>
                    {match.homeTeam.name} {match.goals.filter(goal => goal.home).length} -
                    {match.goals.filter(goal => !goal.home).length} {match.awayTeam.name}
                    <img className="clubLogo" src={ClubLogos[match.awayTeam.name]} alt={`${match.awayTeam.name} logo`}/>
                </div>
        </div>
        )
            ;
        });
    };


    render() {
        const {players, doneLoading, clubName, matches} = this.state;
        return (
            <div>
                <h2 className={"pageTitles"}>{clubName} Squad</h2>
                <div>
                    <img className="squadLogo" src={ClubLogos[clubName]} alt={`${clubName} logo`}/>
                </div>
                {doneLoading ? (
                    <>
                        {players.length > 0 ? (
                            <ul>
                                {players.map((player, index) => (
                                    <li key={player.id} style={{fontWeight: "bold"}}>
                                        {index + 1}.{player.firstName} {player.lastName} -
                                        Captain: {player.captain ? 'Yes' : 'No'}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No players found.</p>
                        )}
                        <div className="team-matches">
                            <h3>Last Results</h3>
                            {matches.length > 0 ? this.renderMatches() : <p>No match data available.</p>}
                        </div>
                    </>
                ) : (
                    <p>Loading...</p>
                )}
            </div>
        );
    }

}

export default Squad;