// server/routes/matchRoutes.js
const express = require('express');
const router = express.Router();
const Match = require('../models/Match'); // Asegúrate de que la ruta sea correcta

// Importar ambas funciones: calculateStandings Y calculateDiscipline
const { calculateStandings, calculateDiscipline } = require('../services/standingsService');

// Para emitir eventos de Socket.IO cuando se crea o elimina un partido desde la API REST
// Necesitamos importar la instancia de 'io' que se exporta desde app.js
let io;
// Esto es una forma de inyectar 'io' si no quieres una importación circular directa
// O podrías simplemente requerirlo directamente si app.js lo exporta como 'module.exports.io'
// Por simplicidad, asumiremos que app.js lo exporta como exports.io y lo importamos así:
try {
    io = require('../app').io; // Asegúrate de que '../app' es la ruta correcta a tu archivo app.js
} catch (error) {
    console.error("Error al importar io en matchRoutes.js:", error.message);
    console.warn("Socket.IO no estará disponible para emitir eventos desde las rutas REST.");
}


// Obtener todos los partidos
router.get('/', async (req, res) => {
    try {
        const matches = await Match.find();
        res.json(matches);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Crear un nuevo partido
router.post('/', async (req, res) => {
    const match = new Match({
        homeTeam: req.body.homeTeam,
        awayTeam: req.body.awayTeam,
        date: req.body.date,
        status: req.body.status || 'Programado', // Asegura un estado inicial si no se provee
        round: req.body.round || 'Fase de Grupos' // Asegura una ronda inicial
    });
    try {
        const newMatch = await match.save();
        // Opcional: Emitir por Socket.IO que un nuevo partido ha sido creado
        // Esto ayudará a que el admin dashboard y el usuario se actualicen si están abiertos
        if (io) {
            // Emite todos los partidos actualizados para que el frontend no tenga que hacer un fetch extra
            const allMatches = await Match.find({});
            io.emit('allMatchesUpdated', allMatches);
            console.log(`[matchRoutes] Partido creado y emitido 'allMatchesUpdated'. ID: ${newMatch._id}`);
        }
        res.status(201).json(newMatch);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Obtener clasificaciones
router.get('/standings', async (req, res) => {
    try {
        const standings = await calculateStandings();
        res.json(standings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtener datos de disciplina
router.get('/discipline', async (req, res) => {
    try {
        const disciplineData = await calculateDiscipline();
        res.json(disciplineData);
    } catch (error) {
        console.error('Error al obtener los datos de disciplina:', error);
        res.status(500).json({ message: 'Error al obtener los datos de disciplina.' });
    }
});

// Obtener un partido por ID (útil si necesitas una vista de edición de un solo partido)
router.get('/:id', async (req, res) => {
    try {
        const match = await Match.findById(req.params.id);
        if (!match) return res.status(404).json({ message: 'Partido no encontrado' });
        res.json(match);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Actualizar un partido por ID
router.put('/:id', async (req, res) => {
    try {
        const match = await Match.findById(req.params.id);
        if (!match) return res.status(404).json({ message: 'Partido no encontrado' });

        // Actualiza los campos que se envíen en el body.
        // Esto es robusto y permite actualizar cualquier campo.
        Object.assign(match, req.body);

        await match.save();

        // Emitir evento de Socket.IO para notificar a todos los clientes sobre el partido actualizado
        if (io) {
            io.emit('matchUpdated', match);
            console.log(`[matchRoutes] Partido actualizado y emitido 'matchUpdated'. ID: ${match._id}`);
        }
        res.json(match);
    } catch (err) {
        // Manejar errores de validación de Mongoose o otros errores
        res.status(400).json({ message: err.message });
    }
});

// Eliminar un partido por ID
router.delete('/:id', async (req, res) => {
    try {
        const match = await Match.findByIdAndDelete(req.params.id);
        if (!match) return res.status(404).json({ message: 'Partido no encontrado' });

        // Emitir evento de Socket.IO para notificar la eliminación a todos los clientes
        if (io) {
            io.emit('matchDeleted', req.params.id); // Envía el ID del partido eliminado
            console.log(`[matchRoutes] Partido eliminado y emitido 'matchDeleted'. ID: ${req.params.id}`);

            // Recalcular y emitir clasificaciones y disciplina si un partido eliminado afecta los datos
            const updatedStandings = await calculateStandings();
            io.emit('standingsUpdated', updatedStandings);
            console.log("[matchRoutes] Clasificaciones actualizadas y emitidas después de eliminación.");

            const updatedDiscipline = await calculateDiscipline();
            io.emit('disciplineUpdated', updatedDiscipline);
            console.log("[matchRoutes] Datos de disciplina actualizados y emitidos después de eliminación.");

            // Opcional: emitir todos los partidos restantes si la eliminación puede afectar la lista global
            const remainingMatches = await Match.find({});
            io.emit('allMatchesUpdated', remainingMatches);
            console.log("[matchRoutes] Todos los partidos restantes emitidos después de eliminación.");
        }

        res.json({ message: 'Partido eliminado correctamente' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;