// server/services/tournamentService.js
const Match = require('../models/Match');
const { calculateStandings } = require('./standingsService');

async function checkGroupStageCompletion() {
    // Reconfirma este número. Si son 5 equipos y se han jugado 5 partidos únicos en la fase de grupos,
    // significa que cada equipo ha jugado 2 veces.
    // Si tu fixture de 5 equipos realmente implica 5 partidos para la fase de grupos, este número es correcto.
    const totalGroupStageMatchesExpected = 5; // <--- CONFIRMADO: 5 partidos para la Fase de Grupos

    console.log(`[TournamentService] Verificando fin de fase de grupos. Partidos esperados: ${totalGroupStageMatchesExpected}`);
    const finishedGroupMatches = await Match.countDocuments({ status: 'Terminado', round: 'Fase de Grupos' });
    console.log(`[TournamentService] Partidos de 'Fase de Grupos' finalizados encontrados: ${finishedGroupMatches}`);

    const isComplete = finishedGroupMatches >= totalGroupStageMatchesExpected;
    console.log(`[TournamentService] Fase de Grupos completada: ${isComplete}`);
    return isComplete;
}

async function generateKnockoutMatches() {
    console.log("[TournamentService] Intentando generar partidos de eliminatorias...");
    try {
        const groupStageStandings = await calculateStandings();
        const teams = groupStageStandings.teams;

        console.log("[TournamentService] Clasificaciones obtenidas para generación de cruces:", teams.map(t => t.teamName));

        if (teams.length < 4) {
            console.warn("[TournamentService] No hay suficientes equipos para generar cruces de la ronda final (se necesitan al menos 4). Equipos actuales:", teams.length);
            return;
        }

        // --- CAMBIOS AQUÍ ---
        const firstPlace = teams[0].teamName;
        const secondPlace = teams[1].teamName;
        const thirdPlace = teams[2].teamName;
        const fourthPlace = teams[3].teamName; // **CORREGIDO: Ahora es el cuarto equipo (índice 3)**
        // --------------------

        const newMatches = [];

        // Partido 2 de la ronda final: 3º vs 4º
        newMatches.push(new Match({
            homeTeam: thirdPlace,
            awayTeam: fourthPlace, // **CAMBIADO: Ahora es 3º vs 4º**
            date: new Date(Date.now() + 24 * 60 * 60 * 1000 + 1000 * 60 * 60 * 2), // Ejemplo: Mañana + 2 horas
            status: 'Programado',
            round: 'Final' // **CAMBIADO: Ahora es 'Final'**
        }));

        // Partido 1 de la ronda final: 1º vs 2º
        newMatches.push(new Match({
            homeTeam: firstPlace,
            awayTeam: secondPlace, // **CAMBIADO: Ahora es 1º vs 2º**
            date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Ejemplo: Mañana
            status: 'Programado',
            round: 'Final' // **CAMBIADO: Ahora es 'Final'**
        }));

        

        await Match.insertMany(newMatches);
        console.log("[TournamentService] Partidos de la ronda final generados:", newMatches.length, newMatches.map(m => `${m.homeTeam} vs ${m.awayTeam} (Ronda: ${m.round})`));

    } catch (error) {
        console.error('[TournamentService] Error al generar partidos de la ronda final:', error);
    }
}

module.exports = { checkGroupStageCompletion, generateKnockoutMatches };