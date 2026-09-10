/*
 * CustomTracks.js
 * Generates additional tracks by cloning the Cityscape track behavior.
 * Each track uses the same geometry/textures but can have different names.
 * To make tracks truly different, you'd need new geometry and texture files.
 */

var bkcore = bkcore || {};
bkcore.hexgl = bkcore.hexgl || {};
bkcore.hexgl.tracks = bkcore.hexgl.tracks || {};

(function() {

    // Helper: create a full track object that mirrors Cityscape's structure
    // but allows overriding the display name.
    function createCityscapeClone(trackName) {
        // We return a new object that has the same load/buildMaterials/buildScenes
        // methods as Cityscape. Since there are no alternate geometry/texture files,
        // every custom track plays the same course — just with a different label.
        var track = {
            lib: null,
            materials: {},
            name: trackName,

            checkpoints: {
                list: [0, 1, 2],
                start: 0,
                last: 2
            },

            spawn: {
                x: -1134 * 2,
                y: 387,
                z: -443 * 2
            },

            spawnRotation: {
                x: 0,
                y: 0,
                z: 0
            },

            analyser: null,
            pixelRatio: 2048.0 / 6000.0
        };

        // Delegate to the same implementation as Cityscape
        track.load           = bkcore.hexgl.tracks.Cityscape.load;
        track.buildMaterials = bkcore.hexgl.tracks.Cityscape.buildMaterials;
        track.buildScenes    = bkcore.hexgl.tracks.Cityscape.buildScenes;

        return track;
    }

    // Register extra tracks — all clones of Cityscape for now.
    // When you create real new geometry/textures for a track, replace its
    // entry with a dedicated file like Cityscape.js.
    var extraTracks = [
        "Cyber Grid Alpha",
        "Neon Skyline",
        "Martian Canyon",
        "Orbital Ring 9",
        "Hyperion Loop"
    ];

    extraTracks.forEach(function(name) {
        // Build a key that's valid as a JS identifier (no spaces)
        var key = name.replace(/\s+/g, '_');
        bkcore.hexgl.tracks[key] = createCityscapeClone(name);
    });

})();
