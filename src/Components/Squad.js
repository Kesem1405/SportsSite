// Squad.jsx
import React, { Component } from 'react';
import axios from 'axios';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import ClubLogos from "./ClubLogos";

class Squad extends Component {
    state = { clubName: '', players: [], doneLoading: false, matches: [] };

    componentDidMount() {
        const { leagueId, teamId } = this.props.params;
        this.loadAll(leagueId, teamId);
    }

    componentDidUpdate(prevProps) {
        const { leagueId, teamId } = this.props.params || {};
        const { leagueId: pLeagueId, teamId: pTeamId } = prevProps.params || {};

        // 🔁 when clicking to another squad, re-fetch everything
        if (leagueId !== pLeagueId || teamId !== pTeamId) {
            this.loadAll(leagueId, teamId);
            // optional: window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    loadAll = (leagueId, teamId) => {
        // small reset to show loading state
        this.setState({ doneLoading: false, clubName: '', players: [], matches: [] }, () => {
            axios.get(`https://app.seker.live/fm1/squad/${leagueId}/${teamId}`)
                .then(res => {
                    if (Array.isArray(res.data)) {
                        this.setState({ players: res.data, doneLoading: true });
                    }
                })
                .catch(err => console.error("Fetching squad failed: ", err));

            this.fetchClubName(leagueId, teamId);
            this.fetchTeamMatches(leagueId, teamId);
        });
    };

    fetchClubName(lId, tId) {
        axios.get(`https://app.seker.live/fm1/history/${lId}`)
            .then(res => {
                for (const match of res.data) {
                    const target = String(tId);
                    if (String(match.homeTeam.id) === target) return this.setState({ clubName: match.homeTeam.name });
                    if (String(match.awayTeam.id) === target) return this.setState({ clubName: match.awayTeam.name });
                }
            })
            .catch(err => console.error("Fetching squad name failed: ", err));
    }

    fetchTeamMatches = (leagueId, teamId) => {
        axios.get(`https://app.seker.live/fm1/history/${leagueId}/${teamId}`)
            .then(res => { if (Array.isArray(res.data)) this.setState({ matches: res.data }); })
            .catch(err => console.error("Fetching team matches failed: ", err));
    };

    renderMatches = () => {
        const { matches } = this.state;
        const { leagueId } = this.props.params;

        return matches.map((match, index) => {
            const homeGoals = match.goals.filter(g => g.home).length;
            const awayGoals = match.goals.filter(g => !g.home).length;

            return (
                <div key={index} className="match-details">
                    {/* Home clickable */}
                    <div className="home-team">
                        <Link
                            to={`/squad/${leagueId}/${match.homeTeam.id}`}
                            className="clubLogo-link"
                            title={`View ${match.homeTeam.name} squad`}
                        >
                            <img className="clubLogo" src={ClubLogos[match.homeTeam.name]} alt={`${match.homeTeam.name} logo`} />
                        </Link>
                        <Link
                            to={`/squad/${leagueId}/${match.homeTeam.id}`}
                            className="team-name"
                            style={{ textDecoration: 'none' }}
                            title={`View ${match.homeTeam.name} squad`}
                        >
                            {match.homeTeam.name}
                        </Link>
                    </div>

                    {/* Score */}
                    <div className="score">{homeGoals} - {awayGoals}</div>

                    {/* Away clickable */}
                    <div className="away-team">
                        <Link
                            to={`/squad/${leagueId}/${match.awayTeam.id}`}
                            className="clubLogo-link"
                            title={`View ${match.awayTeam.name} squad`}
                        >
                            <img className="clubLogo" src={ClubLogos[match.awayTeam.name]} alt={`${match.awayTeam.name} logo`} />
                        </Link>
                        <Link
                            to={`/squad/${leagueId}/${match.awayTeam.id}`}
                            className="team-name"
                            style={{ textDecoration: 'none' }}
                            title={`View ${match.awayTeam.name} squad`}
                        >
                            {match.awayTeam.name}
                        </Link>
                    </div>
                </div>
            );
        });
    };

    render() {
        const { players, doneLoading, clubName, matches } = this.state;

        return (
            <div className="container squad-page">
                <h2 className="pageTitles pageTitles--bright">{clubName} Squad</h2>

                <div className="squad-logo-wrap">
                    <img className="squadLogo" src={ClubLogos[clubName]} alt={`${clubName} logo`} />
                </div>

                {doneLoading ? (
                    <>
                        {players.length > 0 ? (
                            <ul className="squad-display">
                                {players.map((p, idx) => (
                                    <li key={p.id} className="card">
                                        <strong>{idx + 1}. {p.firstName} {p.lastName}</strong>
                                        {p.captain ? <span className="pill" style={{ marginLeft: 8 }}>Captain</span> : null}
                                    </li>
                                ))}
                            </ul>
                        ) : <p>No players found.</p>}

                        <div className="team-matches">
                            <h3 className="sectionTitle">Last Results</h3>
                            {matches.length > 0 ? (
                                <div className="matches">{this.renderMatches()}</div>
                            ) : (
                                <p>No match data available.</p>
                            )}
                        </div>
                    </>
                ) : (
                    <p>Loading...</p>
                )}
            </div>
        );
    }
}

function withRouter(Component) {
    return function Wrapper(props) {
        const params = useParams();
        const navigate = useNavigate();
        const location = useLocation();
        return <Component {...props} params={params} navigate={navigate} location={location} />;
    };
}

export default withRouter(Squad);
