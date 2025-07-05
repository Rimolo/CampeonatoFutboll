// client/src/components/DisciplineTable.js
import React, { useState } from 'react'; // CORRECTED LINE HERE
import './DisciplineTable.css'; // Asegúrate de tener este archivo CSS

const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';

function DisciplineTable({ disciplineData, isAdminView, socket }) {
    const [editingTeam, setEditingTeam] = useState(null);
    const [newDescription, setNewDescription] = useState('');
    const [newPenaltyPoints, setNewPenaltyPoints] = useState('');

    const handleEditClick = (teamName, currentDescription, currentPenaltyPoints) => {
        setEditingTeam(teamName);
        setNewDescription(currentDescription);
        setNewPenaltyPoints(currentPenaltyPoints !== undefined ? currentPenaltyPoints.toString() : '');
    };

    const handleSaveClick = async (teamName) => {
        try {
            const payload = {
                description: newDescription,
                penaltyPoints: parseInt(newPenaltyPoints) || 0
            };
            console.log("Sending payload to backend (DisciplineTable):", payload);
            console.log("To URL (DisciplineTable):", `${SERVER_URL}/api/discipline/${teamName}`);

            const response = await fetch(`${SERVER_URL}/api/discipline/${teamName}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al guardar la disciplina del equipo');
            }

            console.log(`Discipline data for ${teamName} saved via API.`);

            setEditingTeam(null);
            setNewDescription('');
            setNewPenaltyPoints('');

        } catch (error) {
            console.error("Error saving description or penalty points (DisciplineTable):", error);
            alert(`Hubo un error al guardar: ${error.message}`);
        }
    };

    const handleCancelClick = () => {
        setEditingTeam(null);
        setNewDescription('');
        setNewPenaltyPoints('');
    };

    const sortedDisciplineData = [...disciplineData].sort((a, b) => b.penaltyPoints - a.penaltyPoints);

    if (!disciplineData || !Array.isArray(disciplineData) || disciplineData.length === 0) {
        return (
            <div className="discipline-table-container">
                <p>Cargando datos de disciplina o no hay datos disponibles.</p>
            </div>
        );
    }

    return (
        <div className="discipline-table-container">
            <table className="discipline-table">
                <thead>
                    <tr>
                        <th className="centered">Equipo</th>
                        <th className="centered">Tarjetas Amarillas</th>
                        <th className="centered">Tarjetas Rojas</th>
                        {/* Headers for Admin View only */}
                        {isAdminView && (
                            <>
                                <th className="centered">Puntos de Penalización</th>
                                <th className="centered">Descripción / Notas</th>
                                <th className="centered">Acciones</th>
                            </>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {sortedDisciplineData.map((team, index) => (
                        <tr key={index}>
                            <td className="centered">{team.teamName}</td>
                            <td className="centered">{team.yellowCards}</td>
                            <td className="centered">{team.redCards}</td>

                            {/* Data cells for Admin View only */}
                            {isAdminView && (
                                <>
                                    {/* Penalty Points Column */}
                                    <td className={`centered ${team.penaltyPoints < 0 ? 'negative-penalty' : ''}`}>
                                        {editingTeam === team.teamName ? (
                                            <input
                                                type="number"
                                                value={newPenaltyPoints}
                                                onChange={(e) => setNewPenaltyPoints(e.target.value)}
                                                placeholder="Puntos a restar"
                                                className="penalty-points-input"
                                            />
                                        ) : (
                                            team.penaltyPoints
                                        )}
                                    </td>

                                    {/* Description / Notes Column */}
                                    <td>
                                        {editingTeam === team.teamName ? (
                                            <textarea
                                                value={newDescription}
                                                onChange={(e) => setNewDescription(e.target.value)}
                                                rows="2"
                                                cols="30"
                                                placeholder="Descripción"
                                            />
                                        ) : (
                                            team.description || 'N/A'
                                        )}
                                    </td>

                                    {/* Actions Column */}
                                    <td className="centered action-buttons-group">
                                        {editingTeam === team.teamName ? (
                                            <>
                                                <button onClick={() => handleSaveClick(team.teamName)} className="btn-save">Guardar</button>
                                                <button onClick={handleCancelClick} className="btn-cancel">Cancelar</button>
                                            </>
                                        ) : (
                                            <button onClick={() => handleEditClick(team.teamName, team.description, team.penaltyPoints)} className="btn-edit">Editar</button>
                                        )}
                                    </td>
                                </>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default DisciplineTable;