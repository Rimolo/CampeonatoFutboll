// server/routes/disciplineRoutes.js
const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const standingsService = require('../services/standingsService');
const { io } = require('../app'); // Import the io instance from app.js

// GET all discipline data
router.get('/', async (req, res) => {
    try {
        const disciplineData = await Team.find({}, 'teamName yellowCards redCards penaltyPoints description');
        res.json(disciplineData);
    } catch (error) {
        console.error('Error fetching discipline data:', error);
        res.status(500).json({ message: 'Error fetching discipline data', error: error.message });
    }
});

// PUT (update) a team's discipline data by teamName
router.put('/:teamName', async (req, res) => {
    const { teamName } = req.params;
    const { description, penaltyPoints } = req.body;

    try {
        const updatedTeam = await Team.findOneAndUpdate(
            { teamName: teamName },
            {
                $set: {
                    description: description,
                    penaltyPoints: penaltyPoints // Ensure this is a number
                }
            },
            { new: true, runValidators: true } // Return the updated doc and run schema validators
        );

        if (!updatedTeam) {
            return res.status(404).json({ message: 'Team not found' });
        }

        console.log(`[DisciplineRoutes] Disciplina de ${teamName} actualizada vía API:`, { description, penaltyPoints });

        // Recalculate standings (if penalty points affect standings)
        // Even if they don't affect main standings, recalculating ensures the Team model's
        // other stats are fresh, and it also triggers standingsUpdated for other clients.
        await standingsService.calculateStandings();

        // Fetch all discipline data to emit the most up-to-date view to all clients
        const allDisciplineData = await Team.find({}, 'teamName yellowCards redCards penaltyPoints description');
        io.emit('disciplineUpdated', allDisciplineData); // Broadcast the update

        res.json({ message: 'Discipline data updated successfully', team: updatedTeam });

    } catch (error) {
        console.error('Error updating discipline data:', error);
        res.status(500).json({ message: 'Error updating discipline data', error: error.message });
    }
});

module.exports = router;