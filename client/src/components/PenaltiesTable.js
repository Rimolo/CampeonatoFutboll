// client/src/components/PenaltiesTable.js
import React from 'react';
import './PenaltiesTable.css'; // Crearemos este archivo CSS

const PenaltiesTable = ({ match, onUpdatePenalties }) => {
    if (!match || !match.penaltiesEnabled) {
        return null; // No renderizar si los penales no están habilitados
    }

    const homeTeamName = match.homeTeam;
    const awayTeamName = match.awayTeam;
    const homePenalties = match.homePenalties || [];
    const awayPenalties = match.awayPenalties || [];

    // Determinar el número máximo de rondas de penales para la tabla
    const maxRounds = Math.max(homePenalties.length, awayPenalties.length, 5); // Al menos 5 rondas para empezar

    const renderPenaltyAttempt = (attemptResult) => {
        if (attemptResult === true) {
            return <span className="penalty-goal">&#10003;</span>; // Círculo verde (tick)
        } else if (attemptResult === false) {
            return <span className="penalty-miss">&#10007;</span>; // X roja
        }
        return <span className="penalty-empty">-</span>; // Espacio vacío para intentos no realizados
    };

    return (
        <div className="penalties-table-container">
            <h4>Tanda de Penales</h4>
            <table className="penalties-table">
                <thead>
                    <tr>
                        <th>Equipo</th>
                        {Array.from({ length: maxRounds }).map((_, i) => (
                            <th key={i}>{i + 1}</th> // Columnas para cada intento
                        ))}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="team-name">{homeTeamName}</td>
                        {Array.from({ length: maxRounds }).map((_, i) => (
                            <td key={`home-${i}`} className="penalty-cell">
                                {renderPenaltyAttempt(homePenalties[i])}
                            </td>
                        ))}
                    </tr>
                    <tr>
                        <td className="team-name">{awayTeamName}</td>
                        {Array.from({ length: maxRounds }).map((_, i) => (
                            <td key={`away-${i}`} className="penalty-cell">
                                {renderPenaltyAttempt(awayPenalties[i])}
                            </td>
                        ))}
                    </tr>
                </tbody>
            </table>
            <div className="penalties-controls">
                <div className="penalty-team-controls">
                    <h5>{homeTeamName}</h5>
                    <button onClick={() => onUpdatePenalties(match._id, 'home', true)} className="btn-goal">
                        Gol <span className="icon">&#10003;</span>
                    </button>
                    <button onClick={() => onUpdatePenalties(match._id, 'home', false)} className="btn-miss">
                        Fallo <span className="icon">&#10007;</span>
                    </button>
                </div>
                <div className="penalty-team-controls">
                    <h5>{awayTeamName}</h5>
                    <button onClick={() => onUpdatePenalties(match._id, 'away', true)} className="btn-goal">
                        Gol <span className="icon">&#10003;</span>
                    </button>
                    <button onClick={() => onUpdatePenalties(match._id, 'away', false)} className="btn-miss">
                        Fallo <span className="icon">&#10007;</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PenaltiesTable;