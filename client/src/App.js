// client/src/App.js (Updated for conditional navigation)
import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom'; // Import useLocation
import io from 'socket.io-client';
import MatchCard from './components/MatchCard';
import StandingsTable from './components/StandingsTable';
import DisciplineTable from './components/DisciplineTable';
import AdminDashboard from './components/AdminDashboard';

import './App.css';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
const socket = io(SERVER_URL);

function App() {
    const [matches, setMatches] = useState([]);
    const [standings, setStandings] = useState([]);
    const [disciplineData, setDisciplineData] = useState([]);
    const location = useLocation(); // <--- Correctly imported and used here

    useEffect(() => {
        const fetchData = async () => {
            try {
                const matchesRes = await fetch(`${SERVER_URL}/api/matches`);
                const matchesData = await matchesRes.json();
                setMatches(matchesData);

                const standingsRes = await fetch(`${SERVER_URL}/api/matches/standings`);
                const standingsData = await standingsRes.json();
                setStandings(standingsData.teams || []); // Add fallback for safety
                
                // Map disciplineData, ensuring data.teams is an array
                setDisciplineData((standingsData.teams || []).map(team => ({
                    teamName: team.teamName,
                    yellowCards: team.yellowCards || 0,
                    redCards: team.redCards || 0,
                    penaltyPoints: team.penaltyPoints || 0,
                    description: team.description || ''
                })));
            } catch (error) {
                console.error('Error fetching initial data:', error);
            }
        };

        fetchData();

        // Listeners de Socket.IO
        socket.on('scoreUpdated', (updatedMatch) => {
            setMatches(prevMatches =>
                prevMatches.map(match =>
                    match._id === updatedMatch._id ? updatedMatch : match
                )
            );
        });

        socket.on('matchUpdated', (updatedMatch) => {
            setMatches(prevMatches =>
                prevMatches.map(match =>
                    match._id === updatedMatch._id ? updatedMatch : match
                )
            );
            fetch(`${SERVER_URL}/api/matches/standings`)
                .then(res => res.json())
                .then(data => {
                    setStandings(data.teams || []); // Add fallback
                    setDisciplineData((data.teams || []).map(team => ({ // Add fallback
                        teamName: team.teamName,
                        yellowCards: team.yellowCards || 0,
                        redCards: team.redCards || 0,
                        penaltyPoints: team.penaltyPoints || 0,
                        description: team.description || ''
                    })));
                })
                .catch(error => console.error('Error fetching standings after match update:', error));
        });

        socket.on('standingsUpdated', (updatedStandingsData) => {
            setStandings(updatedStandingsData.teams || []); // Add fallback
            setDisciplineData((updatedStandingsData.teams || []).map(team => ({ // Add fallback
                teamName: team.teamName,
                yellowCards: team.yellowCards || 0,
                redCards: team.redCards || 0,
                penaltyPoints: team.penaltyPoints || 0,
                description: team.description || ''
            })));
        });

        socket.on('allMatchesUpdated', (allNewMatches) => {
            setMatches(allNewMatches);
            console.log("Recibidos nuevos partidos desde el servidor:", allNewMatches);
            fetch(`${SERVER_URL}/api/matches/standings`)
                .then(res => res.json())
                .then(data => {
                    setStandings(data.teams || []); // Add fallback
                    setDisciplineData((data.teams || []).map(team => ({ // Add fallback
                        teamName: team.teamName,
                        yellowCards: team.yellowCards || 0,
                        redCards: team.redCards || 0,
                        penaltyPoints: team.penaltyPoints || 0,
                        description: team.description || ''
                    })));
                })
                .catch(error => console.error('Error fetching standings after allMatchesUpdated:', error));
        });

        socket.on('matchDeleted', (deletedMatchId) => {
            setMatches(prevMatches => prevMatches.filter(match => match._id !== deletedMatchId));
            console.log(`Partido ${deletedMatchId} eliminado por evento de Socket.`);
            fetch(`${SERVER_URL}/api/matches/standings`)
                .then(res => res.json())
                .then(data => {
                    setStandings(data.teams || []); // Add fallback
                    setDisciplineData((data.teams || []).map(team => ({ // Add fallback
                        teamName: team.teamName,
                        yellowCards: team.yellowCards || 0,
                        redCards: team.redCards || 0,
                        penaltyPoints: team.penaltyPoints || 0,
                        description: team.description || ''
                    })));
                })
                .catch(error => console.error('Error fetching standings after match deletion:', error));
        });

        socket.on('connect', () => {
            console.log('Connected to Socket.IO from App.js');
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from Socket.IO from App.js');
        });

        return () => {
            socket.off('scoreUpdated');
            socket.off('matchUpdated');
            socket.off('standingsUpdated');
            socket.off('allMatchesUpdated');
            socket.off('matchDeleted');
            socket.off('connect');
            socket.off('disconnect');
        };
    }, []);

    // Filtrar partidos por ronda
    const groupStageMatches = matches.filter(match => match.round === 'Fase de Grupos');
    const finalMatches = matches.filter(match => match.round === 'Final');

    // Determinar si la ruta actual es la de administrador
    const isAdminPath = location.pathname === '/admin'; // <--- This is the key line

    return (
        <div className="App">
            {/* La barra de navegación se muestra SOLO si isAdminPath es true */}
            {isAdminPath && (
                <nav className="main-nav">
                    <Link to="/">Vista Usuario</Link>
                    <Link to="/admin">Panel de Administrador</Link>
                </nav>
            )}

            <Routes>
                {/* Ruta para la vista de usuario (la página principal) */}
                <Route path="/" element={
                    <>
                        <div className="matches-section">
                            <h1>Marcadores de Partidos</h1>

                            <h2>Fase de Grupos</h2>
                            <div className="matches-grid">
                                {groupStageMatches.length > 0 ? (
                                    groupStageMatches.map(match => (
                                        <MatchCard
                                            key={match._id}
                                            match={match}
                                        />
                                    ))
                                ) : (
                                    <p>No hay partidos de la Fase de Grupos disponibles.</p>
                                )}
                            </div>

                            {finalMatches.length > 0 && (
                                <div className="final-round-section">
                                    <hr />
                                    <h2>Ronda Final</h2>
                                    <div className="matches-grid">
                                        {finalMatches.map(match => (
                                            <MatchCard
                                                key={match._id}
                                                match={match}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <hr />

                        <h2>Clasificaciones</h2>
                        <StandingsTable standings={standings} />

                        <hr />

                        <h2>Tarjetas</h2>
                        {/* Pasamos `false` para isAdminView aquí, ya que es la vista de usuario */}
                        <DisciplineTable disciplineData={disciplineData} isAdminView={false} socket={socket} />
                    </>
                } />

                {/* Ruta para el Panel de Administración */}
                <Route
                    path="/admin"
                    element={
                        <AdminDashboard
                            matches={matches}
                            standings={standings}
                            disciplineData={disciplineData}
                            socket={socket}
                        />
                    }
                />
            </Routes>
        </div>
    );
}

export default App;