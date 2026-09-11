/**
 * CustomTracks.js - Material & Shader Overrides for Visual Variety
 *
 * Builds all 50 bkcore.hexgl.tracks.* entries from the data-driven list in
 * TrackData.js (HEXGL_TRACK_LIST). Every entry reuses the same Cityscape
 * circuit (geometry, checkpoints, spawn) but overrides fog, track/scenery
 * colors, wireframe mode and lap count so each track looks and plays
 * differently, in the spirit of the original hand-written theme overrides
 * this file used to contain.
 */
var bkcore = bkcore || {};
bkcore.hexgl = bkcore.hexgl || {};
bkcore.hexgl.tracks = bkcore.hexgl.tracks || {};

(function() {
    var cityscape = bkcore.hexgl.tracks.Cityscape;
    if (!cityscape) return;

    var trackList = (typeof HEXGL_TRACK_LIST !== 'undefined') ? HEXGL_TRACK_LIST : [];

    trackList.forEach(function(theme) {
        bkcore.hexgl.tracks[theme.id] = {
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
