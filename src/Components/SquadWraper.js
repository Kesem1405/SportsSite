import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Squad from './Squad';

function SquadWrapper() {
    const params = useParams();
    const location = useLocation();
    return <Squad params={params} location={location} />;
}

export default SquadWrapper;