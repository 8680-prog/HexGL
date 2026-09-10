/**
 * CustomTracks.js - HexGL Multi-Track Extension
 */
var bkcore = bkcore || {};
bkcore.hexgl = bkcore.hexgl || {};
bkcore.hexgl.tracks = bkcore.hexgl.tracks || {};

(function() {
    var cityscape = bkcore.hexgl.tracks.Cityscape;
    if (!cityscape) return;

    var trackConfigs = {
        "Cityscape_Prime": {
            name: "Cityscape Prime",
            laps: 3,
            fogColor: 0x88bbff,
            ambientColor: 0xffffff,
            spawn: { x: -2268, y: 387, z: -886 },
            rotY: 0
        },
        "Cyber_Neon": {
            name: "Cyber Neon Night",
            laps: 3,
            fogColor: 0x110022,
            ambientColor: 0xff00aa,
            spawn: { x: 1200, y: 387, z: 800 },
            rotY: 1.57
        },
        "Martian_Canyon": {
            name: "Martian Canyon",
            laps: 4,
            fogColor: 0x330d00,
            ambientColor: 0xff4400,
            spawn: { x: -1800, y: 387, z: 1200 },
            rotY: 3.14
        },
        "Toxic_Sector": {
            name: "Toxic Sector",
            laps: 4,
            fogColor: 0x00220a,
            ambientColor: 0x39ff14,
            spawn: { x: 500, y: 387, z: -1500 },
            rotY: -1.57
        },
        "Abyssal_Void": {
            name: "Abyssal Void",
            laps: 5,
            fogColor: 0x02020a,
            ambientColor: 0x2288ff,
            spawn: { x: -2268, y: 387, z: -886 },
            rotY: 0
        }
    };

    Object.keys(trackConfigs).forEach(function(key) {
        var cfg = trackConfigs[key];

        bkcore.hexgl.tracks[key] = {
            lib: null,
            materials: {},
            name: cfg.name,
            laps: cfg.laps,
            checkpoints: cityscape.checkpoints,
            spawn: cfg.spawn,
            spawnRotation: { x: 0, y: cfg.rotY, z: 0 },
            analyser: null,
            pixelRatio: cityscape.pixelRatio,

            load: cityscape.load,
            buildMaterials: cityscape.buildMaterials,

            buildScenes: function(display) {
                cityscape.buildScenes.call(this, display);

                if (display && display.scene) {
                    if (display.scene.fog) {
                        display.scene.fog.color.setHex(cfg.fogColor);
                    }
                    if (display.renderer && display.renderer.setClearColorHex) {
                        display.renderer.setClearColorHex(cfg.fogColor, 1.0);
                    }
                    display.scene.children.forEach(function(child) {
                        if (child.color && (child instanceof THREE.AmbientLight || child instanceof THREE.DirectionalLight)) {
                            child.color.setHex(cfg.ambientColor);
                        }
                    });
                }
            }
        };
    });
})();
