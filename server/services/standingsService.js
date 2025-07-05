// server/services/standingsService.js
const Match = require('../models/Match');
const Team = require('../models/Team');

async function calculateStandings() {
    try {
        const calculatedTeamsStats = {};
        const teamNames = new Set();

        const allMatches = await Match.find({});

        // First Pass: Calculate stats (including cards) from matches
        allMatches.forEach(match => {
            const {
                homeTeam, awayTeam,
                homeScore, awayScore,
                homeYellowCards, homeRedCards,
                awayYellowCards, awayRedCards,
                status
            } = match;

            teamNames.add(homeTeam);
            teamNames.add(awayTeam);

            const initializeTeam = (teamName) => {
                if (!calculatedTeamsStats[teamName]) {
                    calculatedTeamsStats[teamName] = {
                        teamName: teamName, played: 0, wins: 0, draws: 0, losses: 0,
                        points: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0,
                        yellowCards: 0, // Accumulate cards here
                        redCards: 0,    // Accumulate cards here
                    };
                }
            };
            initializeTeam(homeTeam);
            initializeTeam(awayTeam);

            if (status === 'Terminado') {
                calculatedTeamsStats[homeTeam].played++;
                calculatedTeamsStats[awayTeam].played++;

                calculatedTeamsStats[homeTeam].goalsFor += homeScore;
                calculatedTeamsStats[homeTeam].goalsAgainst += awayScore;
                calculatedTeamsStats[awayTeam].goalsFor += awayScore;
                calculatedTeamsStats[awayTeam].goalsAgainst += homeScore;

                if (homeScore > awayScore) {
                    calculatedTeamsStats[homeTeam].wins++;
                    calculatedTeamsStats[homeTeam].points += 3;
                    calculatedTeamsStats[awayTeam].losses++;
                } else if (awayScore > homeScore) {
                    calculatedTeamsStats[awayTeam].wins++;
                    calculatedTeamsStats[awayTeam].points += 3;
                    calculatedTeamsStats[homeTeam].losses++;
                } else {
                    calculatedTeamsStats[homeTeam].draws++;
                    calculatedTeamsStats[awayTeam].draws++;
                    calculatedTeamsStats[homeTeam].points += 1;
                    calculatedTeamsStats[awayTeam].points += 1;
                }

                calculatedTeamsStats[homeTeam].goalDifference = calculatedTeamsStats[homeTeam].goalsFor - calculatedTeamsStats[homeTeam].goalsAgainst;
                calculatedTeamsStats[awayTeam].goalDifference = calculatedTeamsStats[awayTeam].goalsFor - calculatedTeamsStats[awayTeam].goalsAgainst;
            }

            // Cards are accumulated regardless of match status (or at least, they are part of match data)
            // Ensure you add the current match's cards to the running total for each team.
            calculatedTeamsStats[homeTeam].yellowCards += homeYellowCards || 0;
            calculatedTeamsStats[homeTeam].redCards += homeRedCards || 0;
            calculatedTeamsStats[awayTeam].yellowCards += awayYellowCards || 0;
            calculatedTeamsStats[awayTeam].redCards += awayRedCards || 0;
        });

        // Second Pass: Merge with existing Team data from DB and UPDATE/CREATE Team documents
        const allTeamNames = Array.from(teamNames);
        const existingTeamsInDb = await Team.find({ teamName: { $in: allTeamNames } });

        const teamDataMap = new Map();
        existingTeamsInDb.forEach(team => teamDataMap.set(team.teamName, team));

        const updateOperations = []; // Use a single array for all promises

        for (const teamName of allTeamNames) {
            const calculatedData = calculatedTeamsStats[teamName] || {
                teamName: teamName, played: 0, wins: 0, draws: 0, losses: 0,
                points: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0,
                yellowCards: 0, redCards: 0,
            };

            const existingTeam = teamDataMap.get(teamName);

            // --- IMPORTANT: Calculate penaltyPoints and handle description here ---
            const newYellowCards = calculatedData.yellowCards;
            const newRedCards = calculatedData.redCards;
            const newPenaltyPoints = (newYellowCards * -1) + (newRedCards * -2); // Automatic calculation

            let teamDescription = existingTeam ? existingTeam.description : ''; // Preserve existing description

            if (existingTeam) {
                // Update existing team document
                existingTeam.set({
                    wins: calculatedData.wins,
                    losses: calculatedData.losses,
                    draws: calculatedData.draws,
                    points: calculatedData.points,
                    goalsFor: calculatedData.goalsFor,
                    goalsAgainst: calculatedData.goalsAgainst,
                    goalDifference: calculatedData.goalDifference,
                    matchesPlayed: calculatedData.played,
                    yellowCards: newYellowCards,
                    redCards: newRedCards,
                    penaltyPoints: newPenaltyPoints, // Set the calculated penalty points
                    description: teamDescription // Preserve the description
                });
                if (existingTeam.isModified()) { // Only save if something actually changed
                    updateOperations.push(existingTeam.save());
                }
            } else {
                // Create new team entry if it doesn't exist in DB
                const newTeam = new Team({
                    teamName: teamName,
                    wins: calculatedData.wins,
                    losses: calculatedData.losses,
                    draws: calculatedData.draws,
                    points: calculatedData.points,
                    goalsFor: calculatedData.goalsFor,
                    goalsAgainst: calculatedData.goalsAgainst,
                    goalDifference: calculatedData.goalDifference,
                    matchesPlayed: calculatedData.played,
                    yellowCards: newYellowCards,
                    redCards: newRedCards,
                    penaltyPoints: newPenaltyPoints, // Set the calculated penalty points for new team
                    description: teamDescription // Default empty description for new team
                });
                updateOperations.push(newTeam.save());
            }
        }

        await Promise.all(updateOperations); // Execute all update/create operations
        console.log("[StandingsService] Team statistics updated/created in DB, including derived penalty points.");

        // Now fetch the actual, updated team data from the database for the final standings and discipline calculations
        // This ensures we get the latest state after all saves.
        const finalTeamsData = await Team.find({});

        const standingsArray = finalTeamsData.map(team => ({
            teamName: team.teamName,
            played: team.matchesPlayed,
            wins: team.wins,
            draws: team.draws,
            losses: team.losses,
            points: team.points,
            goalsFor: team.goalsFor,
            goalsAgainst: team.goalsAgainst,
            goalDifference: team.goalDifference,
            yellowCards: team.yellowCards,
            redCards: team.redCards,
            penaltyPoints: team.penaltyPoints, // This will now be the calculated value
            description: team.description
        })).sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
            if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
            if (a.penaltyPoints !== b.penaltyPoints) return a.penaltyPoints - b.penaltyPoints; // Lower penalty points (less negative) is better
            if (a.redCards !== b.redCards) return a.redCards - b.redCards;
            if (a.yellowCards !== b.yellowCards) return a.yellowCards - b.yellowCards;
            return a.teamName.localeCompare(b.teamName);
        });

        const qualifyingTeams = standingsArray.slice(0, 2).map(team => ({ teamName: team.teamName }));

        return { teams: standingsArray, qualifyingTeams };
    } catch (error) {
        console.error("Error calculating standings:", error);
        throw error;
    }
}

// You can keep calculateDiscipline as is, as it now relies on the updated Team model
async function calculateDiscipline() {
    try {
        const allTeamsData = await Team.find({});

        const disciplineData = allTeamsData.map(team => ({
            teamName: team.teamName,
            yellowCards: team.yellowCards,
            redCards: team.redCards,
            penaltyPoints: team.penaltyPoints, // This will now be the calculated value
            description: team.description
        }));

        disciplineData.sort((a, b) => {
            // Sort by penaltyPoints (ascending, so -5 is worse than -1)
            if (a.penaltyPoints !== b.penaltyPoints) return a.penaltyPoints - b.penaltyPoints;
            // Then by red cards (ascending)
            if (a.redCards !== b.redCards) return a.redCards - b.redCards;
            // Then by yellow cards (ascending)
            if (a.yellowCards !== b.yellowCards) return a.yellowCards - b.yellowCards;
            return a.teamName.localeCompare(b.teamName);
        });

        return { teams: disciplineData };
    } catch (error) {
        console.error("Error calculating discipline data:", error);
        throw error;
    }
}

module.exports = {
    calculateStandings,
    calculateDiscipline
};