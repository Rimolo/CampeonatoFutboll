// server/app.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const Match = require('./models/Match');
const Team = require('./models/Team'); // Ensure Team model is imported
const standingsService = require('./services/standingsService');
const { checkGroupStageCompletion, generateKnockoutMatches } = require('./services/tournamentService');

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

exports.io = io; // Export io for use in other modules like matchRoutes and disciplineRoutes

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Conectado a MongoDB'))
.catch(err => console.error('Error de conexión a MongoDB:', err));

app.use(cors());
app.use(express.json());

const matchRoutes = require('./routes/matchRoutes');
const disciplineRoutes = require('./routes/disciplineRoutes');
app.use('/api/matches', matchRoutes);
app.use('/api/discipline', disciplineRoutes);

io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado:', socket.id);

    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
    });

    // 1. Listener para ACTUALIZAR GOL (evento 'updateScore')
    socket.on('updateScore', async ({ matchId, team, scoreChange }) => {
        try {
            const match = await Match.findById(matchId);
            if (!match) return;

            if (team === 'home') {
                match.homeScore += scoreChange;
            } else if (team === 'away') {
                match.awayScore += scoreChange;
            }
            await match.save();

            io.emit('matchUpdated', match);
            console.log(`Marcador de partido ${matchId} actualizado: ${match.homeScore} - ${match.awayScore}`);

            if (match.status === 'En vivo' || match.status === 'Terminado') {
                const updatedStandings = await standingsService.calculateStandings(); // This will now save to Team model
                io.emit('standingsUpdated', updatedStandings);
                console.log("[App.js] Clasificaciones y disciplina (via Team model) actualizadas y emitidas debido a cambio de marcador.");
            }

        } catch (error) {
            console.error('Error al actualizar el marcador (updateScore):', error);
        }
    });

    // 2. Listener para ACTUALIZAR PARTIDO (evento 'updateMatch')
    socket.on('updateMatch', async ({ matchId, updates }) => {
        try {
            const match = await Match.findById(matchId);
            if (!match) {
                console.log(`Partido ${matchId} no encontrado para actualizar.`);
                return;
            }

            Object.assign(match, updates);

            await match.save();

            io.emit('matchUpdated', match);
            console.log(`Partido ${matchId} actualizado (via updateMatch):`, updates);

            if (updates.status !== undefined ||
                updates.homeYellowCards !== undefined || updates.homeRedCards !== undefined ||
                updates.awayYellowCards !== undefined || updates.awayRedCards !== undefined) {

                const updatedStandings = await standingsService.calculateStandings(); // This will now save to Team model
                io.emit('standingsUpdated', updatedStandings);
                console.log("[App.js] Clasificaciones y disciplina (via Team model) actualizadas y emitidas debido a cambio de estado o tarjetas.");
            }

        } catch (error) {
            console.error('Error al actualizar el partido (updateMatch):', error);
        }
    });

    // 3. Listener para FINALIZAR PARTIDO (evento 'finishMatch')
    socket.on('finishMatch', async (matchId) => {
        try {
            const match = await Match.findById(matchId);
            if (!match || match.status === 'Terminado') {
                console.log(`[App.js] Partido ${matchId} no encontrado o ya finalizado.`);
                return;
            }

            const originalRound = match.round;
            match.status = 'Terminado';
            await match.save();

            io.emit('matchUpdated', match);
            console.log(`[App.js] Partido ${matchId} finalizado. Estado actual: ${match.status}, Ronda: ${originalRound}`);

            const updatedStandings = await standingsService.calculateStandings(); // This will now save to Team model
            io.emit('standingsUpdated', updatedStandings);
            console.log("[App.js] Clasificaciones y disciplina (via Team model) actualizadas y emitidas.");

            if (originalRound === 'Fase de Grupos') {
                console.log(`[App.js] El partido finalizado (vía finishMatch) es de 'Fase de Grupos'. Verificando si la fase ha terminado...`);
                const groupStageFinished = await checkGroupStageCompletion();
                if (groupStageFinished) {
                    console.log("[App.js] detectó: Fase de Grupos COMPLETADA.");
                    await generateKnockoutMatches();
                    const allMatches = await Match.find({});
                    io.emit('allMatchesUpdated', allMatches);
                    console.log("[App.js] Nuevos partidos generados y todos los partidos emitidos al cliente (después de finishMatch).");
                } else {
                    console.log("[App.js] Fase de Grupos AÚN NO completada (después de finishMatch).");
                }
            } else {
                console.log(`[App.js] El partido finalizado NO era de 'Fase de Grupos' (era: ${originalRound}). No se verifica fin de fase.`);
            }

        } catch (error) {
            console.error('[App.js] Error al finalizar el partido (finishMatch):', error);
        }
    });

    // 4. Listener para HABILITAR PENALES (evento 'enablePenalties')
    socket.on('enablePenalties', async (matchId) => {
        try {
            const match = await Match.findById(matchId);
            if (!match) {
                console.log(`Partido ${matchId} no encontrado para habilitar penales.`);
                return;
            }

            match.penaltiesEnabled = true;
            await match.save();

            io.emit('matchUpdated', match);
            console.log(`Penales habilitados para el partido: ${matchId}`);
        } catch (error) {
            console.error('Error al habilitar penales:', error);
        }
    });

    // 5. Listener para ACTUALIZAR PENALES (evento 'updatePenalties')
    socket.on('updatePenalties', async ({ matchId, team, isGoal }) => {
        try {
            const match = await Match.findById(matchId);
            if (!match) {
                console.log(`Partido ${matchId} no encontrado para actualizar penales.`);
                return;
            }

            if (team === 'home') {
                if (!Array.isArray(match.homePenalties)) {
                    match.homePenalties = [];
                }
                match.homePenalties.push(isGoal);
            } else if (team === 'away') {
                if (!Array.isArray(match.awayPenalties)) {
                    match.awayPenalties = [];
                }
                match.awayPenalties.push(isGoal);
            } else {
                console.warn(`Equipo desconocido para actualizar penales: ${team}`);
                return;
            }

            await match.save();

            io.emit('matchUpdated', match);
            console.log(`Penal para ${team} en partido ${matchId} registrado: ${isGoal ? 'Gol' : 'Fallo'}`);
        } catch (error) {
            console.error('Error al actualizar penales:', error);
        }
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));