/**
 * CustomTracks.js - Material & Shader Overrides for Visual Variety
 */
var bkcore = bkcore || {};
bkcore.hexgl = bkcore.hexgl || {};
bkcore.hexgl.tracks = bkcore.hexgl.tracks || {};

(function() {
    var cityscape = bkcore.hexgl.tracks.Cityscape;
    if (!cityscape) return;

    var trackThemes = {
        "Cityscape_Prime": {
            name: "Cityscape Prime",
            fogColor: 0x88bbff,
            fogNear: 100, fogFar: 4000,
            trackColor: 0xffffff,
            sceneryColor: 0x888888,
            wireframe: false,
            laps: 3
        },
        "Cyber_Neon": {
            name: "Cyber Neon Night",
            fogColor: 0x0a001a,
            fogNear: 50, fogFar: 2000,
            trackColor: 0x00ffff,
            sceneryColor: 0xff00ff,
            wireframe: false,
            laps: 3
        },
        "Martian_Canyon": {
            name: "Martian Canyon",
            fogColor: 0x2b0800,
            fogNear: 20, fogFar: 1800,
            trackColor: 0xff4400,
            sceneryColor: 0x661100,
            wireframe: false,
            laps: 4
        },
        "Toxic_Sector": {
            name: "Toxic Sector",
            fogColor: 0x001a05,
            fogNear: 10, fogFar: 1200,
            trackColor: 0x39ff14,
            sceneryColor: 0x004411,
            wireframe: false,
            laps: 4
        },
        "Abyssal_Void": {
            name: "Abyssal Void",
            fogColor: 0x010105,
            fogNear: 100, fogFar: 3000,
            trackColor: 0x3388ff,
            sceneryColor: 0x002266,
            wireframe: true, // Grid Matrix Wireframe Mode
            laps: 5
        }
    };

    Object.keys(trackThemes).forEach(function(key) {
        var theme = trackThemes[key];

        bkcore.hexgl.tracks[key] = {
            lib: null,
            materials: {},
            name: theme.name,
            laps: theme.laps,
            checkpoints: cityscape.checkpoints,
            spawn: cityscape.spawn,
            spawnRotation: cityscape.spawnRotation,
            analyser: null,
            pixelRatio: cityscape.pixelRatio,

            load: cityscape.load,
            buildMaterials: cityscape.buildMaterials,

            buildScenes: function(display) {
                cityscape.buildScenes.call(this, display);

                if (!display || !display.scene) return;

                // 1. Fog and Environment Adjustments
                if (display.scene.fog) {
                    display.scene.fog.color.setHex(theme.fogColor);
                    if (display.scene.fog.near) display.scene.fog.near = theme.fogNear;
                    if (display.scene.fog.far) display.scene.fog.far = theme.fogFar;
                }

                if (display.renderer) {
                    if (typeof display.renderer.setClearColorHex === 'function') {
                        display.renderer.setClearColorHex(theme.fogColor, 1.0);
                    } else if (typeof display.renderer.setClearColor === 'function') {
                        display.renderer.setClearColor(theme.fogColor, 1.0);
                    }
                }

                // 2. Traversal: Force Mesh Material & Wireframe Overrides
                display.scene.traverse(function(child) {
                    if (child instanceof THREE.Mesh && child.material) {
                        // Clone material to prevent global state leaks across track resets
                        if (!child.material._cloned) {
                            child.material = child.material.clone();
                            child.material._cloned = true;
                        }

                        // Toggle Wireframe Matrix Mode
                        if (theme.wireframe) {
                            child.material.wireframe = true;
                        }

                        // Tint Road vs City Structures
                        if (child.material.color) {
                            if (child.name && child.name.indexOf("track") !== -1) {
                                child.material.color.setHex(theme.trackColor);
                            } else {
                                child.material.color.setHex(theme.sceneryColor);
                            }
                        }

                        if (child.material.ambient) {
                            child.material.ambient.setHex(theme.trackColor);
                        }
                    } else if (child instanceof THREE.Light && child.color) {
                        child.color.setHex(theme.trackColor);
                    }
                });
            }
        };
    });
})();
