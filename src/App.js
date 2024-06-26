import './App.css';
import axios from 'axios';
import {BrowserRouter, Link, NavLink, Route, Router, Routes} from 'react-router-dom'
import TopScorers from "./Components/TopScorers";
import Statistics from "./Components/Statistics";
import Tables from "./Components/Tables";
import History from "./Components/History";
import SquadWraper from "./Components/SquadWraper";
import SportSite from './SportSite.png';

import React from "react";

function App() {
    return (
        <div className="App">

            <BrowserRouter>
            <div>
                <nav>
                    <NavLink to="/"> <img className="logo" src={SportSite} alt="Logo"/></NavLink>
                    <NavLink to="/Tables" className={({isActive}) => isActive ? "activeLink" : "link"}>Tables</NavLink>
                    <NavLink to="/History"
                             className={({isActive}) => isActive ? "activeLink" : "link"}>History</NavLink>
                    <NavLink to="/TopScorers" className={({isActive}) => isActive ? "activeLink" : "link"}>Top
                        Scorers</NavLink>
                    <NavLink to="/Statistics"
                             className={({isActive}) => isActive ? "activeLink" : "link"}>Statistics</NavLink>
                </nav>
            </div>
            <Routes>
                <Route path="localhost:3000/" element={<App/>}/>
                <Route path="/Tables" element={<Tables/>}/>
                <Route path="/History" element={<History/>}/>
                <Route path="/TopScorers" element={<TopScorers/>}/>
                <Route path="/Statistics" element={<Statistics/>}/>
                <Route path="/squad/:leagueId/:teamId" element={<SquadWraper/>}
                />
            </Routes>
        </BrowserRouter>


        </div>
    );
}

export default App;
