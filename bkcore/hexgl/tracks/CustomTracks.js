var bkcore = bkcore || {};
bkcore.hexgl = bkcore.hexgl || {};
bkcore.hexgl.tracks = bkcore.hexgl.tracks || {};

(function() {
    var baseGeometry = "geometries/tracks/cityscape/track.js";
    var baseTextures = {
        diffuse: "textures/tracks/cityscape/diffuse.jpg",
        collision: "textures/tracks/cityscape/collision.png",
        height: "textures/tracks/cityscape/height.png"
    };

    var trackNames = [
        "Cityscape Prime", "Cyber Grid Alpha", "Neon Skyline", "Martian Canyon", "Orbital Ring 9",
        "Hyperion Loop", "Abyssal Trench", "Magma Heights", "Aero Ridge", "Solaris Circuit",
        "Zenith Valley", "Quantum Drift", "Starlight Express", "Nebula Pass", "Vortex Run",
        "Apex Speedway", "Titan Crater", "Chrono Shift", "Cyberpunk City", "Astra Boulevard",
        "Echo Basin", "Velocity Void", "Plasma Peak", "Andromeda Arch", "Horizon Expressway",
        "Glacial Pass", "Phantom Highway", "Supernova Loop", "Pulsar Park", "Singularity Straight",
        "Eclipse Ridge", "Omega Oval", "Crimson Canyon", "Warp Zone", "Galaxy Gateway",
        "Comet Crucible", "Flux Freeway", "Iron Oasis", "Nova Nexus", "Obsidian Way",
        "Aurora Avenue", "Darkstar Drive", "Infinity Raceway", "Astro Alley", "Cyber Chasm",
        "Meteor Ring", "Photon Pathway", "Solstice Sector", "Vector Valley", "Zenith Zone"
    ];

    var difficulties = ["Easy", "Medium", "Hard", "Expert"];

    trackNames.forEach(function(name, index) {
        var id = "Track_" + (index + 1);
        bkcore.hexgl.tracks[id] = {
            id: id,
            name: name,
            difficulty: difficulties[index % 4],
            laps: 3 + (index % 3),
            spawn: { x: (index % 5) * 2, y: 15, z: 0, ry: (index * 0.1) % 3.14 },
            checkpoints: [
                { x: 0, z: 200 + (index * 5), r: 85 },
                { x: 150 - (index * 3), z: 500 + (index * 5), r: 85 },
                { x: -150 + (index * 3), z: 800 + (index * 5), r: 85 }
            ],
            boosters: [
                { x: 10, z: 120 + (index * 2) },
                { x: -30, z: 400 + (index * 2) }
            ],
            geometry: baseGeometry,
            textures: baseTextures
        };
    });
})();
