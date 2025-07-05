// client/src/components/StandingsTable.js
import React from 'react';
import './StandingsTable.css'; // Asegúrate de que esta línea esté presente

function StandingsTable({ standings }) {
    // --- AÑADIR ESTA COMPROBACIÓN AQUÍ ---
    if (!standings || !Array.isArray(standings) || standings.length === 0) {
        return (
            <div className="standings-table-container">
                <p>Cargando clasificaciones o no hay datos disponibles...</p>
            </div>
        );
    }
    // ------------------------------------

    return (
        <div className="standings-table-container">
            <table className="standings-table">
                <thead>
                    <tr>
                        <th className="centered"><u><strong>Pos</strong></u></th>
                        <th className="centered"><u><strong>Equipo</strong></u></th>
                        <th className="centered"><u><strong>PJ</strong></u></th>
                        <th className="centered"><u><strong>G</strong></u></th>
                        <th className="centered"><u><strong>E</strong></u></th>
                        <th className="centered"><u><strong>P</strong></u></th>
                        <th className="centered"><u><strong>GF</strong></u></th>
                        <th className="centered"><u><strong>GC</strong></u></th>
                        <th className="centered"><u><strong>DG</strong></u></th>
                        <th className="centered"><u><strong>Pts</strong></u></th>
                    </tr>
                </thead>
                <tbody>
                    {standings.map((team, index) => (
                        // Usar team.teamName como key es mejor si es único,
                        // de lo contrario, index es un fallback aceptable pero no ideal.
                        <tr key={team.teamName || index}>
                            <td className="centered">{index + 1}</td>
                            <td className="team-name">{team.teamName}</td>
                            <td className="centered">{team.played}</td>
                            <td>{team.wins}</td>
                            <td>{team.draws}</td>
                            <td>{team.losses}</td>
                            <td>{team.goalsFor}</td>
                            <td>{team.goalsAgainst}</td>
                            <td className={`centered ${
                                team.goalDifference > 0 ? 'positive-gd' :
                                team.goalDifference < 0 ? 'negative-gd' : 'zero-gd'
                            }`}>
                                {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
                            </td>
                            <td>{team.points}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default StandingsTable;