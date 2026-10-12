import { useEffect, useState } from 'react';
import AuthForm from './components/AuthForm.jsx';
import DatasetForm from './components/DatasetForm.jsx';
import LiveRace from './components/LiveRace.jsx';
import { clearToken, getToken, setUnauthorizedHandler } from './api.js';

export default function App() {
    const [username, setUsername] = useState(getToken() ? localStorage.getItem('algoarena_username') : null);
    const [raceId, setRaceId] = useState(null);

    function logout() {
        clearToken();
        localStorage.removeItem('algoarena_username');
        setUsername(null);
        setRaceId(null);
    }

    function authenticated(name) {
        localStorage.setItem('algoarena_username', name);
        setUsername(name);
    }

    useEffect(() => {
        setUnauthorizedHandler(logout);
    }, []);

    if (!username) {
        return (
            <div className="page narrow">
                <h1>AlgoArena</h1>
                <AuthForm onAuthenticated={authenticated} />
            </div>
        );
    }

    return (
        <div className="page">
            <header>
                <h1>AlgoArena</h1>
                <div>
                    <span className="muted">{username}</span>
                    <button className="secondary" onClick={logout}>Log out</button>
                </div>
            </header>
            <DatasetForm onRaceCreated={setRaceId} />
            {raceId && <LiveRace key={raceId} raceId={raceId} />}
        </div>
    );
}