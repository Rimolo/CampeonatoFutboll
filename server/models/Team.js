// server/models/Team.js
const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
    teamName: { type: String, required: true, unique: true },
    // Campos para las estadísticas de la tabla de posiciones (si las manejas aquí)
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    goalsFor: { type: Number, default: 0 },
    goalsAgainst: { type: Number, default: 0 },
    goalDifference: { type: Number, default: 0 },
    matchesPlayed: { type: Number, default: 0 },

    // Campos para la disciplina acumulativa (tarjetas, descripción, puntos de penalización)
    yellowCards: { type: Number, default: 0 }, // Total de tarjetas amarillas del equipo en el torneo
    redCards: { type: Number, default: 0 },   // Total de tarjetas rojas del equipo en el torneo
    penaltyPoints: { type: Number, default: 0 }, // Puntos a restar por el admin
    description: { type: String, default: '' } // Descripción/notas del admin
});

module.exports = mongoose.model('Team', TeamSchema);