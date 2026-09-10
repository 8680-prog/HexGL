/**
 * Custom Tracks Extension for HexGL
 * File: CustomTracks.js
 */

var bkcore = bkcore || {};
bkcore.hexgl = bkcore.hexgl || {};
bkcore.hexgl.tracks = bkcore.hexgl.tracks || {};

(function() {
    // Distinct theme configurations for each track
    var configs = {
        NeonCyber: {
            name: "Cyber Neon Night",
            laps: 3,
            fogColor: 0x0a001a,
            ambientColor: 0xff00aa,
            diffuseTint: 0x00ffff,
            boosters: [{x: 0, z: 100}, {x: -40, z: 300}, {x: 40, z: 500}, {x: 0, z: 700}],
            checkpoints: [{x: 0, z: 200, r: 60}, {x: 100, z: 450, r: 60}, {x: -100, z: 750, r: 60}]
        },
        MartianRed: {
            name: "Martian Canyon",
            laps: 3,
            fogColor: 0x2b0800,
            ambientColor: 0xff4500,
            diffuseTint: 0xffaa44,
            boosters: [{x: -20, z: 150}, {x: 20, z: 450}],
            checkpoints: [{x: 0, z: 250, r: 80}, {x: -150, z: 550, r: 80}, {x: 150, z: 800, r: 80}]
        },
        ToxicTrench: {
            name: "Toxic Sector",
            laps: 4,
            fogColor: 0x001a08,
            ambientColor: 0x39ff14,
            diffuseTint: 0x55ff55,
            boosters: [{x: 0, z: 80}, {x: -50, z: 250}, {x: 50, z: 500}, {x: 0, z: 750}],
            checkpoints: [{x: 0, z: 180, r: 45}, {x: 80, z: 400, r: 45}, {x: -80, z: 650, r: 45}]
        },
        AbyssalVoid: {
            name: "Abyssal Void",
            laps: 5,
            fogColor: 0x020208,
            ambientColor: 0x1e90ff,
            diffuseTint: 0x88ccff,
            boosters: [{x: 0, z: 120}, {x: 0, z: 380}, {x: 0, z: 640}],
            checkpoints: [{x: 0, z: 220, r: 35}, {x: 120, z: 500, r: 35}, {x: -120, z: 780, r: 35}]
        }
    };

    // Helper to build extended track prototypes from standard Cityscape
    function createCustomTrackClass(key, cfg) {
        var TrackClass = function(opts) {
            bkcore.hexgl.tracks.Cityscape.call(this, opts);
            this.name = cfg.name;
            this.laps = cfg.laps;
            this.checkpoints = cfg.checkpoints;
            this.boosters = cfg.boosters;
        };

        TrackClass.prototype = Object.create(bkcore.hexgl.tracks.Cityscape.prototype);
        TrackClass.prototype.constructor = TrackClass;

        // Override buildScenes to apply custom atmospheric fog and light colors
        TrackClass.prototype.buildScenes = function(display) {
            bkcore.hexgl.tracks.Cityscape.prototype.buildScenes.call(this, display);
            
            if (display && display.scene) {
                // Apply custom fog and sky background
                display.scene.fog.color.setHex(cfg.fogColor);
                if (display.renderer) {
                    display.renderer.setClearColorHex(cfg.fogColor, 1.0);
                }
                
                // Colorize track lighting
                display.scene.children.forEach(function(child) {
                    if (child instanceof THREE.AmbientLight || child instanceof THREE.DirectionalLight) {
                        child.color.setHex(cfg.ambientColor);
                    }
                });
            }
        };

        return TrackClass;
    }

    // Register all custom tracks into HexGL engine
    for (var trackKey in configs) {
        bkcore.hexgl.tracks[trackKey] = createCustomTrackClass(trackKey, configs[trackKey]);
    }
})();
