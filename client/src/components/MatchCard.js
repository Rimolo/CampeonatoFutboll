// client/src/components/MatchCard.js
import React from 'react';
import './MatchCard.css'; // Estilos opcionales (pero necesarios para tarjetas ahora)

// MatchCard ahora recibe las props de control de forma opcional.
// Si no se pasan (como en la vista de usuario), los botones no se renderizarán.
function MatchCard({ match, onUpdateScore, onUpdateMatch, onFinishMatch, onEnablePenalties, onUpdatePenalties }) {
    // Asegurarse de que los valores de tarjetas existan, si no, usar 0
    const homeYellowCards = match.homeYellowCards || 0;
    const homeRedCards = match.homeRedCards || 0;
    const awayYellowCards = match.awayYellowCards || 0;
    const awayRedCards = match.awayRedCards || 0;

    // Determina si los controles de admin deben ser visibles
    // Esto es true si AL MENOS una de las funciones de control se ha pasado como prop.
    // En la práctica, esto será true solo cuando el MatchCard se use dentro de AdminDashboard.
    const showAdminControls = onUpdateScore || onUpdateMatch || onFinishMatch || onEnablePenalties || onUpdatePenalties;

    // Funciones para los botones (solo se llamarán si las props existen)
    const handleHomeGoal = () => { if (onUpdateScore) onUpdateScore(match._id, 'home', 1); };
    const handleAwayGoal = () => { if (onUpdateScore) onUpdateScore(match._id, 'away', 1); };
    const handleFinishClick = () => { if (onFinishMatch) onFinishMatch(match._id); };
    const handleGoLiveClick = () => {
        if (match.status === 'Programado' && onUpdateMatch) {
            onUpdateMatch(match._id, { status: 'En Vivo' }); // Changed to 'En Vivo' for consistency
        }
    };
    const handleYellowCard = (team) => {
        if (!showAdminControls || match.status !== 'En Vivo' || !onUpdateMatch) return; // Consistent 'En Vivo'
        const updates = {};
        if (team === 'home') {
            updates.homeYellowCards = homeYellowCards + 1;
        } else {
            updates.awayYellowCards = awayYellowCards + 1;
        }
        onUpdateMatch(match._id, updates);
    };
    const handleRedCard = (team) => {
        if (!showAdminControls || match.status !== 'En Vivo' || !onUpdateMatch) return; // Consistent 'En Vivo'
        const updates = {};
        if (team === 'home') {
            updates.homeRedCards = homeRedCards + 1;
        } else {
            updates.awayRedCards = awayRedCards + 1;
        }
        onUpdateMatch(match._id, updates);
    };
    const handleEnablePenaltiesClick = () => {
        if (onEnablePenalties) onEnablePenalties(match._id);
    };
    const handlePenaltyAttempt = (team, isGoal) => {
        if (onUpdatePenalties) onUpdatePenalties(match._id, team, isGoal);
    };

    const penaltiesScore = match.penaltiesEnabled ?
        `Penales: ${match.homePenalties?.filter(p => p).length || 0} - ${match.awayPenalties?.filter(p => p).length || 0}` : '';

    return (
        <div className={`match-card ${match.status}`}>
            {!showAdminControls ? (
                <>
                    {/* Nombre del equipo LOCAL (azul) */}
                    <p className="team-name">{match.homeTeam}</p>
                    <p className="team-name"><strong>VS</strong></p>
                    {/* Nombre del equipo VISITANTE (azul) */}
                    <p className="team-name">{match.awayTeam}</p>

                    {/* Línea separadora después del nombre del equipo LOCAL */}
                    <div className="score-separator"></div>

                    {/* Marcador principal (ya lo tienes con su clase match-score) */}
                    <p className="match-score">
                        {match.homeScore} - {match.awayScore}
                    </p>

                    {/* Línea separadora antes del nombre del equipo VISITANTE */}
                    <div className="score-separator"></div>

                    {/* --- INICIO DEL CÓDIGO AGREGADO/REUBICADO PARA TARJETAS EN VISTA DE USUARIO --- */}
                    {/* Tarjetas visibles para el usuario (si hay alguna) */}
                    {(homeYellowCards > 0 || homeRedCards > 0 || awayYellowCards > 0 || awayRedCards > 0) && (
                        <div className="public-card-indicators-container">
                            <span className="card-indicators">
                                {homeYellowCards > 0 && <span className="card yellow-card">{homeYellowCards}Y</span>}
                                {homeRedCards > 0 && <span className="card red-card">{homeRedCards}R</span>}
                                {' | '} {/* Separador visual */}
                                {awayYellowCards > 0 && <span className="card yellow-card">{awayYellowCards}Y</span>}
                                {awayRedCards > 0 && <span className="card red-card">{awayRedCards}R</span>}
                            </span>
                        </div>
                    )}
                    {/* --- FIN DEL CÓDIGO AGREGADO/REUBICADO PARA TARJETAS EN VISTA DE USUARIO --- */}
                </>
            ) : (
                // Si es showAdminControls (vista de admin), mantenemos el h3 original para los equipos
                // ya que tu admin CSS probablemente espera esa estructura.
                <h3>{match.homeTeam} vs {match.awayTeam}</h3>
            )}

            {/* Penalties display (visible for both if applicable) */}
            {penaltiesScore && <p className="penalties-display">{penaltiesScore}</p>}

            {/*
                CONDITIONAL DISPLAY FOR STATUS:
                - If the match is 'Terminado', we rely on the "Partido Finalizado" message below.
                - Otherwise, show the current status with "Estado:".
                This logic applies to BOTH admin and non-admin views to avoid redundancy.
            */}
            {match.status !== 'Terminado' && (
                <p>Estado: <strong>{match.status}</strong></p>
            )}

            {/* Renderizar controles solo si showAdminControls es true */}
            {showAdminControls && (
                <>
                    {/* Tarjetas al lado del marcador en vista de ADMIN (esto ya lo tienes) */}
                    <div className="admin-card-indicators-wrapper">
                        <p className="match-score-admin">
                            Marcador: {match.homeScore} - {match.awayScore}
                            <span className="card-indicators">
                                {homeYellowCards > 0 && <span className="card yellow-card">{homeYellowCards}Y</span>}
                                {homeRedCards > 0 && <span className="card red-card">{homeRedCards}R</span>}
                                {' | '} {/* Separador visual */}
                                {awayYellowCards > 0 && <span className="card yellow-card">{awayYellowCards}Y</span>}
                                {awayRedCards > 0 && <span className="card red-card">{awayRedCards}R</span>}
                            </span>
                        </p>
                    </div>

                    {/*
                       CONTROLES PRINCIPALES DEL PARTIDO (Goles, Tarjetas, Finalizar)
                       Estos solo deben mostrarse si el partido está 'En Vivo'.
                       Si el partido está 'Terminado', estos controles no deberían aparecer.
                    */}
                    {match.status === 'En Vivo' && (
                        <div className="match-controls-live">
                            <div className="score-buttons">
                                <button onClick={handleHomeGoal}>Gol {match.homeTeam}</button>
                                <button onClick={handleAwayGoal}>Gol {match.awayTeam}</button>
                            </div>

                            {/* Botones para Tarjetas */}
                            <div className="card-buttons">
                                <button className="btn-yellow" onClick={() => handleYellowCard('home')}>+1 Amarilla {match.homeTeam}</button>
                                <button className="btn-yellow" onClick={() => handleYellowCard('away')}>+1 Amarilla {match.awayTeam}</button>
                                <button className="btn-red" onClick={() => handleRedCard('home')}>+1 Roja {match.homeTeam}</button>
                                <button className="btn-red" onClick={() => handleRedCard('away')}>+1 Roja {match.awayTeam}</button>
                            </div>

                            {/* Botón para finalizar el partido */}
                            <button onClick={handleFinishClick} className="btn-finish">Finalizar Partido</button>

                            {/* Botón para Habilitar Tanda de Penales (solo si no está habilitado, es empate, Y EL PARTIDO NO ESTÁ TERMINADO) */}
                            {match.homeScore === match.awayScore && !match.penaltiesEnabled && match.status !== 'Terminado' && (
                                <button onClick={handleEnablePenaltiesClick} className="btn-enable-penalties">Habilitar Tanda de Penales</button>
                            )}
                        </div>
                    )}
                    
                    {/*
                       CONTROLES Y VISUALIZACIÓN DE PENALES
                       El bloque completo de penales se muestra SI penaltiesEnabled es true.
                       Los botones de acción internos (Gol/Fallo) se ocultan si el partido está 'Terminado'.
                    */}
                    {match.penaltiesEnabled && (
                        <div className="penalty-shootout-controls">
                            <h4>Tanda de Penales</h4>
                            {/* Los botones de acción de penales se ocultan si el partido está 'Terminado' */}
                            {match.status !== 'Terminado' && (
                                <div className="penalty-buttons">
                                    <button onClick={() => handlePenaltyAttempt('home', true)}>Gol {match.homeTeam} (Penal)</button>
                                    <button onClick={() => handlePenaltyAttempt('home', false)}>Fallo {match.homeTeam} (Penal)</button>
                                    <button onClick={() => handlePenaltyAttempt('away', true)}>Gol {match.awayTeam} (Penal)</button>
                                    <button onClick={() => handlePenaltyAttempt('away', false)}>Fallo {match.awayTeam} (Penal)</button>
                                </div>
                            )}
                            {/* Mostrar intentos de penal (estos siempre serán visibles si penaltiesEnabled es true) */}
                            <p>Penales {match.homeTeam}: {match.homePenalties?.filter(p => p).length || 0} / {match.homePenalties?.length || 0}</p>
                            <p>Penales {match.awayTeam}: {match.awayPenalties?.filter(p => p).length || 0} / {match.awayPenalties?.length || 0}</p>
                        </div>
                    )}


                    {/* Si el partido está 'Programado', muestra el botón para ponerlo 'En Vivo' */}
                    {match.status === 'Programado' && (
                        <div className="match-controls-scheduled">
                            <button onClick={handleGoLiveClick} className="btn-start">Poner en Vivo</button>
                        </div>
                    )}
                </>
            )}

            {/* Mensaje de partido finalizado para todas las vistas si el estado es 'Terminado' */}
            {match.status === 'Terminado' && (
                <p>Partido Finalizado</p>
            )}
        </div>
    );
}

export default MatchCard;