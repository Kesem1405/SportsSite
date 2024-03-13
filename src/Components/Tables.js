import React from "react";
import axios from 'axios';
import ClubLogos from './ClubLogos';
import {NavLink, Route, Router, Routes} from 'react-router-dom';
import Squad from "./Squad";


class Tables extends React.Component {
    state = {
        doneLoading: false,
        leagues: [],
        selectedLeagueId: null,
        leagueTable: [],
        clubId:[]
    }
    static leagueChange;

    componentDidMount() {
        axios.get("https://app.seker.live/fm1/leagues")
            .then(response => {
                if (response.data && Array.isArray(response.data)) {
                    const leagues = response.data.map(league => ({
                        leagueId: league.id,
                        leagueName: league.name
                    }));
                    this.setState({
                        leagues,
                        doneLoading: true
                    });
                } else {
                    console.log("Unexpected response structure:", response.data);
                }
            })
            .catch(error => console.error("Fetching leagues failed: ", error));
    }

    leagueChange = (event) => {
        const selectedLeagueId = event.target.value;
        this.setState({
            selectedLeagueId
        });
        if (selectedLeagueId !== "-1") {
            axios.get(`https://app.seker.live/fm1/history/${selectedLeagueId}`)
                .then(response => {
                    const leagueTable = this.calculateLeagueTable(response.data);
                    this.setState({ leagueTable });
                })
                .catch(error => console.error("Fetching matches failed: ", error));
        } else {
            this.setState({ leagueTable: [] });

        }
    }

    calculateLeagueTable = (matches) => {
        const teams = {};
        matches.forEach(match => {
            [match.homeTeam, match.awayTeam].forEach(team => {
                if (!teams[team.id]) {
                    teams[team.id] = {
                        id: team.id,
                        name: team.name,
                        points: 0,
                        goalsFor: 0,
                        goalsAgainst: 0,
                        goalDifference: 0,
                        wins: 0,
                        draws: 0,
                        losses: 0,

                    };
                }
            });

            const homeTeam = teams[match.homeTeam.id];
            const awayTeam = teams[match.awayTeam.id];
            const homeGoals = match.goals.filter(goal => goal.home).length;
            const awayGoals = match.goals.filter(goal => !goal.home).length;

            homeTeam.goalsFor += homeGoals;
            homeTeam.goalsAgainst += awayGoals;
            awayTeam.goalsFor += awayGoals;
            awayTeam.goalsAgainst += homeGoals;

            if (homeGoals > awayGoals) {
                homeTeam.points += 3;
                homeTeam.wins += 1;
                awayTeam.losses += 1;
            } else if (homeGoals < awayGoals) {
                awayTeam.points += 3;
                awayTeam.wins += 1;
                homeTeam.losses += 1;
            } else {
                homeTeam.points += 1;
                awayTeam.points += 1;
                homeTeam.draws += 1;
                awayTeam.draws += 1;
            }
        });
        Object.values(teams).forEach(team => team.goalDifference = team.goalsFor - team.goalsAgainst);
        return Object.values(teams).sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference);
    }

    render() {
        return (
            <div>
                {this.state.doneLoading ? (
                    <div>
                        <div className={"pageTitles"}>League Table:</div>
                        <div>
                            {this.state.leagues.map((league) => (
                                <button
                                    key={league.leagueId}
                                    onClick={() => this.leagueChange({ target: { value: league.leagueId }})}
                                    className={this.state.selectedLeagueId=== league.leagueId ? "active-league" : "league"}>
                                    {league.leagueName === "English" ? "Premier League" :
                                        league.leagueName === "Italian" ? "Serie A" :
                                            league.leagueName === "Spanish" ? "La Liga" :
                                                league.name}
                                </button>
                            ))}
                        </div>
                        <div>
                        </div>
                        <div className={"table"}>
                            {this.state.leagueTable.length > 0 && (
                                <table>
                                    <thead>
                                    <tr>
                                        <th>Place</th>
                                        <th></th>
                                        <th>Club</th>
                                        <th>Played</th>
                                        <th>W</th>
                                        <th>D</th>
                                        <th>L</th>
                                        <th>Scored</th>
                                        <th>Conceded</th>
                                        <th>Goal Difference</th>
                                        <th>Points</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {this.state.leagueTable.map((team, index) => (
                                        <tr key={index}
                                            className={
                                                index === 0
                                                    ? "first-place"
                                                    : index >= this.state.leagueTable.length - 3
                                                        ? "last-places"
                                                        : ""
                                            }>
                                            <td>{index + 1}</td>
                                            <td>
                                                <img className="clubLogo" src={ClubLogos[team.name]}
                                                     alt={`${team.name} logo`}/>
                                            </td>

                                           <td>
                                               <NavLink
                                                   to={{
                                                       pathname: `/squad/${this.state.selectedLeagueId}/${team.id}`,
                                                       state: { clubName: team.name }
                                                   }}
                                                   style={{fontWeight: "bold"}}
                                               >
                                                   {team.name}
                                               </NavLink>
                                           </td>
                                            <td>{team.wins + team.losses + team.draws}</td>
                                            <td><span style={{color: "#aeff95", fontWeight:"bolder"}}>{team.wins}</span></td>
                                            <td><span style={{color: "#ffc400"}}>{team.draws}</span></td>
                                            <td><span style={{color: "#d02900"}}>{team.losses}</span></td>
                                            <td>{team.goalsFor}</td>
                                            <td>{team.goalsAgainst}</td>
                                            <td>{team.goalDifference}</td>
                                            <td>{team.points}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                ) : (
                    <div>Loading leagues...</div>
                )}
            </div>
        );
    }

}

export default Tables;