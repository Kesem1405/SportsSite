import React, { Component } from 'react';
import axios from 'axios';
import ClubLogos from "./ClubLogos";

class Squad extends Component {
    state = {
        clubName: '',
        players: [],
        doneLoading: false,
    };

    componentDidMount() {
        const clubName = this.props.location.state?.clubName;
        const { leagueId, teamId } = this.props.params;
            axios.get("https://app.seker.live/fm1/squad/"+leagueId+"/"+teamId)
                .then(response => {
                    if (response.data && Array.isArray(response.data)) {
                        this.setState({players: response.data, doneLoading: true});
                         this.fetchClubName(leagueId, teamId);
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
                        console.log("Club name found:", this.state.clubName);
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




    render() {
        const { players, doneLoading } = this.state;
        return (
            <div>
                <h2 className={"pageTitles"}>{this.state.clubName} Squad</h2>
                <div>
                    <img className="squadLogo" src={ClubLogos[this.state.clubName]}
                         alt={`${this.state.clubName} logo`}/>
                </div>
                {doneLoading ? (
                    players.length > 0 ? (
                        <ul>
                        {players.map((player) => (
                                <div key={player.id} style={{fontWeight:"bold"}}>
                                    {player.id+1}.{player.firstName} {player.lastName} - Captain: {player.captain ? 'Yes' : 'No'}
                                </div>
                            ))}
                        </ul>
                    ) : (
                        <p>No players found.</p>
                    )
                ) : (
                    <p>Loading...</p>
                )}
            </div>
        );
    }
}

export default Squad;