/**
 * Custom Tracks Extension for HexGL
 * File: CustomTracks.js
 */

var bkcore = bkcore || {};
bkcore.hexgl = bkcore.hexgl || {};
bkcore.hexgl.tracks = bkcore.hexgl.tracks || {};

(function() {
    // Uses existing HexGL geometry & texture files so tracks load without missing asset errors
    var baseGeometry = "geometries/tracks/cityscape/track.js";
    var baseTextures = {
        diffuse: "textures/tracks/cityscape/diffuse.jpg",
        collision: "textures/tracks/cityscape/collision.png",
        height: "textures/tracks/cityscape/height.png"
    };

    var trackList = [
        {
            id: "CityscapePrime",
            name: "Cityscape Prime",
            difficulty: "Medium",
            laps: 3,
            spawn: { x: 0, y: 15, z: 0, ry: 0 },
            checkpoints: [
                { x: 0, z: 250, r: 80 },
                { x: 200, z: 500, r: 80 },
                { x: -100, z: 750, r: 80 }
            ],
            boosters: [{ x: 10, z: 120 }, { x: -30, z: 410 }, { x: 50, z: 680 }]
        },
        {
            id: "NeonSprint",
            name: "Neon Sprint",
            difficulty: "Easy",
            laps: 3,
            spawn: { x: 10, y: 15, z: -50, ry: 0 },
            checkpoints: [
                { x: 10, z: 150, r: 90 },
                { x: 80, z: 350, r: 90 },
                { x: 0, z: 550, r: 90 }
            ],
            boosters: [{ x: 0, z: 80 }, { x: 40, z: 280 }, { x: -20, z: 480 }]
        },
        {
            id: "CyberCircuit",
            name: "Cyber Circuit",
            difficulty: "Hard",
            laps: 4,
            spawn: { x: -10, y: 15, z: 0, ry: 1.57 },
            checkpoints: [
                { x: 100, z: 200, r: 60 },
                { x: -150, z: 450, r: 60 },
                { x: 120, z: 700, r: 60 }
            ],
            boosters: [{ x: 50, z: 150 }, { x: -80, z: 380 }]
        },
        {
            id: "ApexCanyon",
            name: "Apex Canyon",
            difficulty: "Medium",
            laps: 3,
            spawn: { x: 0, y: 20, z: 10, ry: 0 },
            checkpoints: [
                { x: -50, z: 300, r: 75 },
                { x: 150, z: 600, r: 75 },
                { x: 0, z: 900, r: 75 }
            ],
            boosters: [{ x: -20, z: 180 }, { x: 80, z: 520 }]
        },
        {
            id: "OrbitalLoop",
            name: "Orbital Loop 9",
            difficulty: "Hard",
            laps: 4,
            spawn: { x: 0, y: 15, z: 0, ry: 3.14 },
            checkpoints: [
                { x: 0, z: -200, r: 65 },
                { x: -120, z: -450, r: 65 },
                { x: 120, z: -700, r: 65 }
            ],
            boosters: [{ x: 0, z: -100 }, { x: -60, z: -320 }]
        },
        {
            id: "HyperionDash",
            name: "Hyperion Dash",
            difficulty: "Expert",
            laps: 5,
            spawn: { x: 0, y: 15, z: 0, ry: 0 },
            checkpoints: [
                { x: 0, z: 300, r: 50 },
                { x: 250, z: 600, r: 50 },
                { x: -250, z: 850, r: 50 }
            ],
            boosters: [{ x: 100, z: 400 }, { x: -100, z: 700 }]
        },
        {
            id: "SubZeroRidge",
            name: "Sub-Zero Ridge",
            difficulty: "Easy",
            laps: 3,
            spawn: { x: 5, y: 15, z: 0, ry: 0 },
            checkpoints: [
                { x: 30, z: 200, r: 85 },
                { x: -100, z: 450, r: 85 },
                { x: 50, z: 650, r: 85 }
            ],
            boosters: [{ x: 20, z: 100 }, { x: -50, z: 320 }]
        },
        {
            id: "MagmaSector",
            name: "Magma Sector",
            difficulty: "Hard",
            laps: 4,
            spawn: { x: 0, y: 25, z: 0, ry: 0 },
            checkpoints: [
                { x: 0, z: 220, r: 55 },
                { x: 180, z: 480, r: 55 },
                { x: -180, z: 720, r: 55 }
            ],
            boosters: [{ x: 0, z: 110 }, { x: 90, z: 360 }]
        },
        {
            id: "SkylineDrift",
            name: "Skyline Drift",
            difficulty: "Medium",
            laps: 3,
            spawn: { x: 0, y: 18, z: 0, ry: 0 },
            checkpoints: [
                { x: 0, z: 280, r: 70 },
                { x: 140, z: 520, r: 70 },
                { x: -140, z: 780, r: 70 }
            ],
            boosters: [{ x: 0, z: 140 }, { x: 70, z: 400 }]
        },
        {
            id: "SolarisGrandPrix",
            name: "Solaris Grand Prix",
            difficulty: "Expert",
            laps: 5,
            spawn: { x: 0, y: 15, z: 0, ry: 0 },
            checkpoints: [
                { x: 0, z: 300, r: 45 },
                { x: 200, z: 600, r: 45 },
                { x: -200, z: 900, r: 45 },
                { x: 0, z: 1200, r: 45 }
            ],
            boosters: [{ x: 0, z: 150 }, { x: 100, z: 450 }, { x: -100, z: 750 }]
        }
    ];

    // Register all 10 track instances into HexGL
    trackList.forEach(function(t) {
        bkcore.hexgl.tracks[t.id] = {
            name: t.name,
            difficulty: t.difficulty,
            laps: t.laps,
            spawn: t.spawn,
            checkpoints: t.checkpoints,
            boosters: t.boosters,
            geometry: baseGeometry,
            textures: baseTextures
        };
    });
})();