import React from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import ClubLogos from "./ClubLogos";
import '../App.css';

class Home extends React.Component {
    state = {
        leagues: [],
        selectedLeagueId: 1,
        doneLoading: false,
        latestRound: null,
        latestMatches: [],
        tableTop: [],
        scorersTop: [],
        stats: null,
        loadingLeague: false,
    };

    componentDidMount() {
        axios.get("https://app.seker.live/fm1/leagues")
            .then((res) => {
                const leagues = Array.isArray(res.data) ? res.data : [];
                const first = leagues[0]?.id ?? 1;
                this.setState({ leagues, selectedLeagueId: first, doneLoading: true }, () => {
                    this.fetchLeagueSummary(first);
                });
            })
            .catch((err) => console.error("Leagues fetch failed:", err));
    }

    fetchLeagueSummary = (leagueId) => {
        this.setState({ loadingLeague: true });
        axios.get(`https://app.seker.live/fm1/history/${leagueId}`)
            .then((res) => {
                const matches = Array.isArray(res.data) ? res.data : [];

                // Rounds
                const rounds = [...new Set(matches.map((m) => m.round))];
                const latestRound = rounds.length ? Math.max(...rounds) : null;
                const latestMatches = latestRound ? matches.filter((m) => m.round === latestRound).slice(0, 6) : [];

                // Table top 5
                const tableTop = this.calculateLeagueTable(matches).slice(0, 5);

                // Scorers top 5
                const scorersTop = this.calculateTopScorers(matches).slice(0, 5);

                // Quick stats
                const stats = this.calculateQuickStats(matches);

                this.setState({
                    latestRound,
                    latestMatches,
                    tableTop,
                    scorersTop,
                    stats,
                    selectedLeagueId: leagueId,
                    loadingLeague: false,
                });
            })
            .catch((err) => {
                console.error(`Summary fetch failed for league ${leagueId}:`, err);
                this.setState({ loadingLeague: false });
            });
    };

    // ===== helpers (reuse logic from your other pages) =====
    calculateLeagueTable = (matches) => {
        const teams = {};
        for (const match of matches) {
            const home = match.homeTeam, away = match.awayTeam;
            if (home && !teams[home.id]) teams[home.id] = { id: home.id, name: home.name, points: 0, gf: 0, ga: 0, w: 0, d: 0, l: 0 };
            if (away && !teams[away.id]) teams[away.id] = { id: away.id, name: away.name, points: 0, gf: 0, ga: 0, w: 0, d: 0, l: 0 };

            const hg = match.goals.filter((g) => g.home).length;
            const ag = match.goals.filter((g) => !g.home).length;

            teams[home.id].gf += hg; teams[home.id].ga += ag;
            teams[away.id].gf += ag; teams[away.id].ga += hg;

            if (hg > ag) { teams[home.id].points += 3; teams[home.id].w++; teams[away.id].l++; }
            else if (hg < ag) { teams[away.id].points += 3; teams[away.id].w++; teams[home.id].l++; }
            else { teams[home.id].points++; teams[away.id].points++; teams[home.id].d++; teams[away.id].d++; }
        }
        return Object.values(teams).sort((a, b) =>
            b.points - a.points ||
            (b.gf - b.ga) - (a.gf - a.ga) ||
            b.gf - a.gf
        );
    };

    calculateTopScorers = (matches) => {
        const map = {};
        for (const m of matches) {
            const homeName = m.homeTeam?.name, awayName = m.awayTeam?.name;
            for (const g of m.goals || []) {
                const id = g.scorer.id;
                const name = `${g.scorer.firstName} ${g.scorer.lastName}`;
                const clubName = g.home ? homeName : awayName;
                if (!map[id]) map[id] = { id, name, goals: 0, clubName };
                map[id].goals += 1;
            }
        }
        return Object.values(map).sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name));
    };

    calculateQuickStats = (matches) => {
        let total = 0, earliest = 999, earliestName = "", latest = 0, latestName = "";
        for (const m of matches) {
            for (const g of m.goals || []) {
                const min = parseInt(g.minute);
                total++;
                if (min < earliest) { earliest = min; earliestName = `${g.scorer.firstName} ${g.scorer.lastName}`; }
                if (min > latest) { latest = min; latestName = `${g.scorer.firstName} ${g.scorer.lastName}`; }
            }
        }
        return {
            totalGoals: total,
            earliest: earliest === 999 ? "—" : `${earliest}'`,
            earliestName: earliestName || "—",
            latest: latest === 0 ? "—" : `${latest}'`,
            latestName: latestName || "—",
        };
    };

    // ===== render =====
    render() {
        const { doneLoading, leagues, selectedLeagueId, latestRound, latestMatches, tableTop, scorersTop, stats, loadingLeague } = this.state;

        if (!doneLoading) return <div>Loading…</div>;

        return (
            <div className="container">
                {/* HERO */}
                <section className="home-hero card">
                    <h1 className="pageTitles pageTitles--bright" style={{ marginBottom: 6 }}>SportSite</h1>
                    <p className="hero-sub">Quick glance at standings, results, scorers & stats</p>

                    <nav className="top-nav" style={{ marginTop: 12 }}>
                        {leagues.map((l) => (
                            <button
                                key={l.id}
                                className={selectedLeagueId === l.id ? "active-league" : "league"}
                                onClick={() => this.fetchLeagueSummary(l.id)}
                                disabled={loadingLeague && selectedLeagueId === l.id}
                            >
                                {l.name === "English" ? "Premier League" :
                                    l.name === "Spanish" ? "La Liga" :
                                        l.name === "Italian" ? "Serie A" : l.name}
                            </button>
                        ))}
                    </nav>

                    <div className="home-cta">
                        <NavLink className="cta" to="/tables">View Table</NavLink>
                        <NavLink className="cta" to="/history">Match History</NavLink>
                        <NavLink className="cta" to="/topscorers">Top Scorers</NavLink>
                        <NavLink className="cta" to="/statistics">Full Stats</NavLink>
                    </div>
                </section>

                {/* GRID */}
                <section className="home-grid">
                    {/* Latest Results */}
                    <div className="card">
                        <div className="card-title">
                            Latest Round {latestRound ? <span className="pill">Round {latestRound}</span> : null}
                        </div>
                        {latestMatches.length ? (
                            <div className="mini-matches">
                                {latestMatches.map((m, i) => {
                                    const hg = m.goals.filter(g => g.home).length;
                                    const ag = m.goals.filter(g => !g.home).length;
                                    return (
                                        <div key={i} className="mini-match">
                                            <div className="team left">
                                                <img className="mini-logo" src={ClubLogos[m.homeTeam.name]} alt="" />
                                                <span className="name" title={m.homeTeam.name}>{m.homeTeam.name}</span>
                                            </div>
                                            <div className="mini-score">{hg} - {ag}</div>
                                            <div className="team right">
                                                <span className="name" title={m.awayTeam.name}>{m.awayTeam.name}</span>
                                                <img className="mini-logo" src={ClubLogos[m.awayTeam.name]} alt="" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : <div className="empty-note">No matches found.</div>}
                    </div>

                    {/* Top of the Table */}
                    <div className="card">
                        <div className="card-title">Top of the Table</div>
                        {tableTop.length ? (
                            <ul className="mini-list">
                                {tableTop.map((t, i) => (
                                    <li key={t.id}>
                                        <span className="pos-badge">{i + 1}</span>
                                        <img className="mini-logo" src={ClubLogos[t.name]} alt="" />
                                        <span className="name" title={t.name}>{t.name}</span>
                                        <span className="right stat-pill">{t.points} pts</span>
                                    </li>
                                ))}
                            </ul>
                        ) : <div className="empty-note">Choose a league to see standings.</div>}
                    </div>

                    {/* Top Scorers */}
                    <div className="card">
                        <div className="card-title">Top Scorers</div>
                        {scorersTop.length ? (
                            <ul className="mini-list">
                                {scorersTop.map((s, i) => (
                                    <li key={s.id ?? i}>
                                        <span className={`pos-badge pos-${i + 1}`}>{i + 1}</span>
                                        {s.clubName && <img className="mini-logo" src={ClubLogos[s.clubName]} alt="" title={s.clubName} />}
                                        <span className="name" title={s.name}>{s.name}</span>
                                        <span className="right stat-pill">{s.goals} goals</span>
                                    </li>
                                ))}
                            </ul>
                        ) : <div className="empty-note">Choose a league to see scorers.</div>}
                    </div>

                    {/* Quick Stats */}
                    <div className="card">
                        <div className="card-title">Quick Stats</div>
                        {stats ? (
                            <div className="quick-stats">
                                <div><span className="label">Total goals</span><span className="val">{stats.totalGoals}</span></div>
                                <div><span className="label">Earliest goal</span><span className="val">{stats.earliest} <span className="muted">by {stats.earliestName}</span></span></div>
                                <div><span className="label">Latest goal</span><span className="val">{stats.latest} <span className="muted">by {stats.latestName}</span></span></div>
                            </div>
                        ) : <div className="empty-note">Choose a league to see stats.</div>}
                    </div>
                </section>

                <p className="disclaimer">
                    All clubs, players and results here are part of a simulation — none of the players are real.
                </p>

            </div>
        );
    }
}

export default Home;
