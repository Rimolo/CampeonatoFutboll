// server/models/Match.js
const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
    homeTeam: { type: String, required: true },
    awayTeam: { type: String, required: true },
    homeScore: { type: Number, default: 0 },
    awayScore: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['Programado', 'En vivo', 'Terminado'], default: 'Programado' },
    round: { type: String, required: true, enum: ['Fase de Grupos', 'Semifinal', 'Final'], default: 'Fase de Grupos' },
    homeYellowCards: { type: Number, default: 0 },
    homeRedCards: { type: Number, default: 0 },
    awayYellowCards: { type: Number, default: 0 },
    awayRedCards: { type: Number, default: 0 },
    penaltiesEnabled: { type: Boolean, default: false }, // Indica si los penales están habilitados para este partido
    homePenalties: [{ type: Boolean }], // Array de booleanos: true para gol, false para fallo
    awayPenalties: [{ type: Boolean }]// Array de booleanos: true para gol, false para fallo
    // Se podrían añadir campos para el score final de penales si fuera necesario
    // homePenaltyScore: { type: Number, default: 0 },
    // awayPenaltyScore: { type: Number, default: 0 },
});

module.exports = mongoose.model('Match', MatchSchema);