import React from "react";
import axios from "axios";
import ClubLogos from "./ClubLogos";
import { NavLink } from "react-router-dom";

class Tables extends React.Component {
    state = {
        doneLoading: false,
        leagues: [],
        selectedLeagueId: null,
        leagueTable: [],
    };

    componentDidMount() {
        axios
            .get("https://app.seker.live/fm1/leagues")
            .then((response) => {
                if (Array.isArray(response.data)) {
                    const leagues = response.data.map((league) => ({
                        leagueId: league.id,
                        leagueName: league.name,
                    }));
                    this.setState({ leagues, doneLoading: true });
                } else {
                    console.log("Unexpected response structure:", response.data);
                }
            })
            .catch((error) => console.error("Fetching leagues failed: ", error));
    }

    leagueChange = (eventOrId) => {
        const selectedLeagueId = typeof eventOrId === "object" ? eventOrId.target.value : eventOrId;
        this.setState({ selectedLeagueId, leagueTable: [] });
        if (selectedLeagueId && selectedLeagueId !== "-1") {
            axios
                .get(`https://app.seker.live/fm1/history/${selectedLeagueId}`)
                .then((response) => {
                    const leagueTable = this.calculateLeagueTable(response.data);
                    this.setState({ leagueTable });
                })
                .catch((error) => console.error("Fetching matches failed: ", error));
        }
    };

    calculateLeagueTable = (matches) => {
        const teams = {};
        matches.forEach((match) => {
            [match.homeTeam, match.awayTeam].forEach((team) => {
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
            const homeGoals = match.goals.filter((g) => g.home).length;
            const awayGoals = match.goals.filter((g) => !g.home).length;

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

        Object.values(teams).forEach((t) => (t.goalDifference = t.goalsFor - t.goalsAgainst));

        return Object.values(teams).sort(
            (a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor
        );
    };

    render() {
        const { doneLoading, leagues, selectedLeagueId, leagueTable } = this.state;

        return (
            <div className="container">
                <div className="pageTitles pageTitles--bright">League Table</div>

                {doneLoading ? (
                    <>
                        <nav className="top-nav">
                            {leagues.map((league) => (
                                <button
                                    key={league.leagueId}
                                    onClick={() => this.leagueChange(league.leagueId)}
                                    className={selectedLeagueId === league.leagueId ? "active-league" : "league"}
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

                        {leagueTable.length > 0 ? (
                            <div className="table">
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
                                        <th>GD</th>
                                        <th>Pts</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {leagueTable.map((team, index) => (
                                        <tr
                                            key={team.id}
                                            className={
                                                index === 0
                                                    ? "first-place"
                                                    : index >= leagueTable.length - 3
                                                        ? "last-places"
                                                        : ""
                                            }
                                        >
                                            <td className="pos">
                                                <span className="badge">{index + 1}</span>
                                            </td>
                                            <td>
                                                <img className="clubLogo" src={ClubLogos[team.name]} alt={`${team.name} logo`} />
                                            </td>
                                            <td>
                                                <NavLink
                                                    to={`/squad/${selectedLeagueId}/${team.id}`}
                                                    state={{ clubName: team.name }}
                                                    style={{ fontWeight: "bold", color: "inherit", textDecoration: "none" }}
                                                >
                                                    {team.name}
                                                </NavLink>
                                            </td>
                                            <td>{team.wins + team.losses + team.draws}</td>
                                            <td><span style={{ color: "#aeff95", fontWeight: "bolder" }}>{team.wins}</span></td>
                                            <td><span style={{ color: "#ffc400" }}>{team.draws}</span></td>
                                            <td><span style={{ color: "#d02900" }}>{team.losses}</span></td>
                                            <td>{team.goalsFor}</td>
                                            <td>{team.goalsAgainst}</td>
                                            <td>{team.goalDifference}</td>
                                            <td>{team.points}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div style={{ opacity: 0.7, textAlign: "center", marginTop: 12 }}>
                                Choose a league to see the table.
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

export default Tables;
