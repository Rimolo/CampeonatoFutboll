// client/src/components/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './AdminDashboard.css';
// --- IMPORT THE DISCIPLINE TABLE COMPONENT ---
import DisciplineTable from './DisciplineTable'; // <--- ADD THIS LINE

const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
const socket = io(SERVER_URL);

const TEAMS = ["Casados ADV", "Shalom y CEM SP", "Baluarte y Timoteo", "Comunidad Horeb", "Comunidad FDV y Misiones"];

function AdminDashboard() {
    const [matches, setMatches] = useState([]);
    // --- STATE FOR DISCIPLINE DATA ---
    const [disciplineData, setDisciplineData] = useState([]); // <--- ADD THIS STATE

    // Función para obtener la fecha actual en formato YYYY-MM-DD
    const getTodayDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Meses son 0-indexados
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [newMatch, setNewMatch] = useState({
        homeTeam: TEAMS[0], // Default a primer equipo
        awayTeam: TEAMS[1], // Default a segundo equipo
        date: getTodayDate(), // Default a la fecha actual
        round: 'Fase de Grupos'
    });
    const [editingMatch, setEditingMatch] = useState(null);

    // --- EFFECT TO FETCH DISCIPLINE DATA ---
    useEffect(() => {
        // Fetch initial discipline data
        const fetchDisciplineData = async () => {
            try {
                // Assuming you have an API endpoint for discipline data
                const response = await fetch(`${SERVER_URL}/api/discipline`);
                const data = await response.json();
                setDisciplineData(data);
            } catch (error) {
                console.error('Error fetching discipline data:', error);
            }
        };

        fetchMatches(); // Existing fetch for matches
        fetchDisciplineData(); // <--- CALL TO FETCH DISCIPLINE DATA

        // --- SOCKET.IO LISTENERS FOR DISCIPLINE UPDATES ---
        socket.on('disciplineUpdated', (updatedDiscipline) => {
            // This assumes updatedDiscipline is the full list or an update for a single item
            // Adjust based on how your backend emits 'disciplineUpdated'
            console.log("Discipline data updated:", updatedDiscipline);
            setDisciplineData(updatedDiscipline);
        });

        // Existing socket listeners for matches
        socket.on('matchUpdated', (updatedMatch) => {
            setMatches(prevMatches =>
                prevMatches.map(match =>
                    match._id === updatedMatch._id ? updatedMatch : match
                )
            );
        });

        socket.on('allMatchesUpdated', (allNewMatches) => {
            setMatches(allNewMatches);
            console.log("Recibidos nuevos partidos desde el servidor para Admin:", allNewMatches);
        });

        socket.on('matchDeleted', (deletedMatchId) => {
            setMatches(prevMatches => prevMatches.filter(match => match._id !== deletedMatchId));
            console.log(`Partido ${deletedMatchId} eliminado.`);
        });

        return () => {
            socket.off('matchUpdated');
            socket.off('allMatchesUpdated');
            socket.off('matchDeleted');
            // --- CLEANUP DISCIPLINE SOCKET LISTENER ---
            socket.off('disciplineUpdated'); // <--- ADD THIS CLEANUP
        };
    }, []);

    const fetchMatches = async () => {
        try {
            const response = await fetch(`${SERVER_URL}/api/matches`);
            const data = await response.json();
            setMatches(data);
        } catch (error) {
            console.error('Error fetching matches:', error);
        }
    };

    const handleNewMatchChange = (e) => {
        const { name, value } = e.target;
        setNewMatch(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateMatch = async (e) => {
        e.preventDefault();
        // Validar que los equipos no sean el mismo
        if (newMatch.homeTeam === newMatch.awayTeam) {
            alert("Los equipos local y visitante no pueden ser el mismo.");
            return;
        }
        try {
            const response = await fetch(`${SERVER_URL}/api/matches`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newMatch, status: 'Programado' })
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error al crear partido: ${response.status} - ${errorText}`);
            }
            const createdMatch = await response.json();
            // El socket 'allMatchesUpdated' debería manejar la actualización del estado,
            // pero si no lo hace consistentemente, puedes agregar el partido aquí:
            // setMatches(prev => [...prev, createdMatch]);
            setNewMatch({ homeTeam: TEAMS[0], awayTeam: TEAMS[1], date: getTodayDate(), round: 'Fase de Grupos' });
            console.log('Partido creado:', createdMatch);
        } catch (error) {
            console.error('Error creating match:', error);
            alert(`Hubo un error al crear el partido: ${error.message}`);
        }
    };

    const handleDeleteMatch = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este partido?')) {
            try {
                const response = await fetch(`${SERVER_URL}/api/matches/${id}`, { method: 'DELETE' });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Error al eliminar partido: ${response.status} - ${errorText}`);
                }
                // El socket listener 'matchDeleted' ya maneja la actualización del estado
                console.log(`Partido ${id} eliminado.`);
            } catch (error) {
                console.error('Error deleting match:', error);
                alert(`Hubo un error al eliminar el partido: ${error.message}`);
            }
        }
    };

    const handleEditMatch = (match) => {
        // Asegurarse de que date esté en formato YYYY-MM-DD para el input type="date"
        setEditingMatch({ ...match, date: match.date.split('T')[0] });
    };

    const handleUpdateEditingMatchChange = (e) => {
        const { name, value, type, checked } = e.target;
        // Manejar el caso especial de `penaltiesEnabled` que podría ser un checkbox
        setEditingMatch(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSaveEditedMatch = async () => {
        if (!editingMatch) return;
        // Validar que los equipos no sean el mismo al editar
        if (editingMatch.homeTeam === editingMatch.awayTeam) {
            alert("Los equipos local y visitante no pueden ser el mismo.");
            return;
        }

        try {
            const response = await fetch(`${SERVER_URL}/api/matches/${editingMatch._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingMatch)
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error al guardar cambios: ${response.status} - ${errorText}`);
            }
            setEditingMatch(null); // Salir del modo edición
            // El socket 'matchUpdated' ya debería actualizar la lista
            console.log('Partido actualizado:', editingMatch);
        } catch (error) {
            console.error('Error updating match:', error);
            alert(`Hubo un error al actualizar el partido: ${error.message}`);
        }
    };

    // Funciones de control de partido (goles, tarjetas, estado, penales)
    const updateMatchStatus = (matchId, status) => {
        socket.emit('updateMatch', { matchId, updates: { status } });
    };

    const updateScore = (matchId, team, change) => {
        socket.emit('updateScore', { matchId, team, scoreChange: change });
    };

    const updateCards = (matchId, team, type, change) => {
        const match = matches.find(m => m._id === matchId);
        if (!match) return;

        const updates = {};
        if (type === 'yellow') {
            updates[`${team}YellowCards`] = (match[`${team}YellowCards`] || 0) + change;
        } else if (type === 'red') {
            updates[`${team}RedCards`] = (match[`${team}RedCards`] || 0) + change;
        }
        socket.emit('updateMatch', { matchId, updates });
    };

    const enablePenalties = (matchId) => {
        socket.emit('enablePenalties', matchId);
    };

    const updatePenalties = (matchId, team, isGoal) => {
        socket.emit('updatePenalties', { matchId, team, isGoal });
    };

    const finishMatch = (matchId) => {
        socket.emit('finishMatch', matchId);
    };

    // --- FUNCTIONS FOR DISCIPLINE TABLE ACTIONS ---
    // These functions will be passed down to DisciplineTable for admin actions
    const handleUpdateTeamDiscipline = (updatedData) => {
        // This function would typically send the update to your backend via socket or API
        // For now, it just emits an event. Your backend needs to handle 'updateTeamDiscipline'
        // and then emit 'disciplineUpdated' back to all clients.
        if (socket) {
            socket.emit('updateTeamDiscipline', updatedData);
        } else {
            console.error("Socket not available to update team discipline.");
        }
    };

    return (
        <div className="admin-dashboard">
            <h1>Panel de Administración de Partidos</h1>

            ---
            <h2>Crear Nuevo Partido</h2>
            <form onSubmit={handleCreateMatch} className="new-match-form">
                <select name="homeTeam" value={newMatch.homeTeam} onChange={handleNewMatchChange} required>
                    {TEAMS.map(team => (
                        <option key={team} value={team}>{team}</option>
                    ))}
                </select>
                <select name="awayTeam" value={newMatch.awayTeam} onChange={handleNewMatchChange} required>
                    {TEAMS.map(team => (
                        <option key={team} value={team}>{team}</option>
                    ))}
                </select>
                <input
                    type="date"
                    name="date"
                    value={newMatch.date}
                    onChange={handleNewMatchChange}
                    required
                />
                <select name="round" value={newMatch.round} onChange={handleNewMatchChange}>
                    <option value="Fase de Grupos">Fase de Grupos</option>
                    <option value="Final">Final</option>
                </select>
                <button type="submit">Crear Partido</button>
            </form>

            ---
            <h2>Gestionar Partidos Existentes</h2>
            <div className="matches-admin-list">
                {matches.length === 0 ? (
                    <p>No hay partidos para gestionar.</p>
                ) : (
                    matches.map(match => (
                        <div key={match._id} className="match-admin-card">
                            {editingMatch && editingMatch._id === match._id ? (
                                // Modo Edición
                                <div className="edit-form">
                                    <label>Local:</label>
                                    <select name="homeTeam" value={editingMatch.homeTeam} onChange={handleUpdateEditingMatchChange}>
                                        {TEAMS.map(team => (
                                            <option key={team} value={team}>{team}</option>
                                        ))}
                                    </select>
                                    <label>Visitante:</label>
                                    <select name="awayTeam" value={editingMatch.awayTeam} onChange={handleUpdateEditingMatchChange}>
                                        {TEAMS.map(team => (
                                            <option key={team} value={team}>{team}</option>
                                        ))}
                                    </select>
                                    <label>Fecha:</label>
                                    <input
                                        type="date"
                                        name="date"
                                        value={editingMatch.date}
                                        onChange={handleUpdateEditingMatchChange}
                                    />
                                    <label>Ronda:</label>
                                    <select name="round" value={editingMatch.round} onChange={handleUpdateEditingMatchChange}>
                                        <option value="Fase de Grupos">Fase de Grupos</option>
                                        <option value="Final">Final</option>
                                    </select>
                                    <label>Estado:</label>
                                    <select name="status" value={editingMatch.status} onChange={handleUpdateEditingMatchChange}>
                                        <option value="Programado">Programado</option>
                                        <option value="En vivo">En Vivo</option>
                                        <option value="Terminado">Finalizado</option>
                                    </select>
                                    <label>Goles Local:</label>
                                    <input type="number" name="homeScore" value={editingMatch.homeScore} onChange={handleUpdateEditingMatchChange} />
                                    <label>Goles Visitante:</label>
                                    <input type="number" name="awayScore" value={editingMatch.awayScore} onChange={handleUpdateEditingMatchChange} />
                                    <label>Amarillas Local:</label>
                                    <input type="number" name="homeYellowCards" value={editingMatch.homeYellowCards || 0} onChange={handleUpdateEditingMatchChange} />
                                    <label>Rojas Local:</label>
                                    <input type="number" name="homeRedCards" value={editingMatch.homeRedCards || 0} onChange={handleUpdateEditingMatchChange} />
                                    <label>Amarillas Visitante:</label>
                                    <input type="number" name="awayYellowCards" value={editingMatch.awayYellowCards || 0} onChange={handleUpdateEditingMatchChange} />
                                    <label>Rojas Visitante:</label>
                                    <input type="number" name="awayRedCards" value={editingMatch.awayRedCards || 0} onChange={handleUpdateEditingMatchChange} />
                                    <label>Penales Habilitados:</label>
                                    <input type="checkbox" name="penaltiesEnabled" checked={editingMatch.penaltiesEnabled || false} onChange={handleUpdateEditingMatchChange} />

                                    {editingMatch.penaltiesEnabled && (
                                        <div className="penalty-edit-section">
                                            <h4>Editar Penales:</h4>
                                            <p>Home: {editingMatch.homePenalties?.map((p, i) => <span key={`hp-${i}`}>{p ? '✅' : '❌'} </span>)}</p>
                                            <p>Away: {editingMatch.awayPenalties?.map((p, i) => <span key={`ap-${i}`}>{p ? '✅' : '❌'} </span>)}</p>
                                            {/* Aquí podrías añadir un botón para añadir penales o reiniciar */}
                                            {/* Por simplicidad, la edición granular de penales se hace vía botones de abajo */}
                                            {/* O podrías permitir un input para reiniciar/limpiar los arrays de penales */}
                                            <button type="button" onClick={() => setEditingMatch(prev => ({...prev, homePenalties: []}))}>Reset Penales Local</button>
                                            <button type="button" onClick={() => setEditingMatch(prev => ({...prev, awayPenalties: []}))}>Reset Penales Visitante</button>
                                        </div>
                                    )}

                                    <button onClick={handleSaveEditedMatch}>Guardar Cambios</button>
                                    <button onClick={() => setEditingMatch(null)}>Cancelar</button>
                                </div>
                            ) : (
                                // Modo Vista
                                <>
                                    <h3>{match.homeTeam} vs {match.awayTeam}</h3>
                                    <p>Fecha: {new Date(match.date).toLocaleDateString()}</p>
                                    <p>Ronda: {match.round}</p>
                                    <p>Estado: **{match.status}**</p>
                                    <p>Marcador: {match.homeScore} - {match.awayScore}</p>
                                    <p>Tarjetas: Local ({match.homeYellowCards || 0}Y, {match.homeRedCards || 0}R) | Visitante ({match.awayYellowCards || 0}Y, {match.awayRedCards || 0}R)</p>

                                    {match.penaltiesEnabled && (
                                        <div className="penalty-controls">
                                            <h4>Penales:</h4>
                                            <p>Local: {match.homePenalties?.filter(p => p).length || 0} / {match.homePenalties?.length || 0}</p>
                                            <p>Visitante: {match.awayPenalties?.filter(p => p).length || 0} / {match.awayPenalties?.length || 0}</p>
                                            {/* Mostrar intentos de penales */}
                                            <p>Intentos Local: {match.homePenalties?.map((p, i) => <span key={`hp-v-${i}`}>{p ? '✅' : '❌'} </span>)}</p>
                                            <p>Intentos Visitante: {match.awayPenalties?.map((p, i) => <span key={`ap-v-${i}`}>{p ? '✅' : '❌'} </span>)}</p>
                                        </div>
                                    )}

                                    <div className="admin-controls">
                                        {/* Botones de control de estado */}
                                        {match.status === 'Programado' && (
                                            <button onClick={() => updateMatchStatus(match._id, 'En vivo')} className="btn-start-live">Poner en Vivo</button>
                                        )}
                                        {match.status === 'En vivo' && (
                                            <button onClick={() => finishMatch(match._id)} className="btn-finish">Finalizar Partido</button>
                                        )}

                                        {/* Controles de marcador */}
                                        {match.status === 'En vivo' && (
                                            <>
                                                <button onClick={() => updateScore(match._id, 'home', 1)} className="btn-score-home">+1 Gol {match.homeTeam}</button>
                                                <button onClick={() => updateScore(match._id, 'away', 1)} className="btn-score-away">+1 Gol {match.awayTeam}</button>
                                            </>
                                        )}

                                        {/* Controles de tarjetas */}
                                        {match.status === 'En vivo' && (
                                            <>
                                                <button className="btn-yellow-card" onClick={() => updateCards(match._id, 'home', 'yellow', 1)}>+1 Amarilla {match.homeTeam}</button>
                                                <button className="btn-red-card" onClick={() => updateCards(match._id, 'home', 'red', 1)}>+1 Roja {match.homeTeam}</button>
                                                <button className="btn-yellow-card" onClick={() => updateCards(match._id, 'away', 'yellow', 1)}>+1 Amarilla {match.awayTeam}</button>
                                                <button className="btn-red-card" onClick={() => updateCards(match._id, 'away', 'red', 1)}>+1 Roja {match.awayTeam}</button>
                                            </>
                                        )}

                                        {/* Controles de penales (ajusta la lógica de visualización según tus necesidades) */}
                                        {match.status === 'En vivo' && match.homeScore === match.awayScore && !match.penaltiesEnabled && (
                                            <button onClick={() => enablePenalties(match._id)} className="btn-enable-penalties">Habilitar Penales</button>
                                        )}
                                        {match.penaltiesEnabled && (
                                            <div className="penalty-controls-live">
                                                <button onClick={() => updatePenalties(match._id, 'home', true)} className="btn-penalty-goal-home">Gol Home</button>
                                                <button onClick={() => updatePenalties(match._id, 'home', false)} className="btn-penalty-miss-home">Fallo Home</button>
                                                <button onClick={() => updatePenalties(match._id, 'away', true)} className="btn-penalty-goal-away">Gol Away</button>
                                                <button onClick={() => updatePenalties(match._id, 'away', false)} className="btn-penalty-miss-away">Fallo Away</button>
                                            </div>
                                        )}

                                        {/* Botones de edición y eliminación */}
                                        <button onClick={() => handleEditMatch(match)} className="btn-edit">Editar</button>
                                        <button onClick={() => handleDeleteMatch(match._id)} className="btn-delete">Eliminar</button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>

            ---
            <h2>Tabla de Disciplina</h2> {/* Add a heading for clarity */}
            <DisciplineTable
                disciplineData={disciplineData}
                isAdminView={true} // <--- Pass true to show all columns for admin
                socket={socket} // Pass the socket for real-time updates
            />

        </div>
    );
}

export default AdminDashboard;