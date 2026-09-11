/**
 * CustomTracks.js - Material & Shader Overrides for Visual Variety
 *
 * Builds all 50 bkcore.hexgl.tracks.* entries from the data-driven list in
 * TrackData.js (HEXGL_TRACK_LIST). Every entry reuses the same Cityscape
 * circuit (geometry, checkpoints, spawn) but overrides fog, track/scenery
 * colors, wireframe mode and lap count so each track looks and plays
 * differently.
 *
 * IMPORTANT FIX: the HexGL instance passed into buildScenes (called `ctx`
 * in Cityscape.js, `display` here) does NOT expose the live THREE.Scene as
 * `display.scene` -- there is no such property. The actual scene is stored
 * inside the render manager and must be read back via
 * `display.manager.get("game").scene`. The previous version of this file
 * checked `display.scene` directly, which was always undefined, so the
 * `if (!display || !display.scene) return;` guard silently bailed out on
 * every single track and none of the re-theming below ever ran -- every
 * track rendered as plain, unmodified Cityscape. Fixed below.
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

            buildScenes: function(display, quality) {
                // Remember the untouched road material reference BEFORE
                // buildScenes clones/assigns materials onto meshes, so we
                // can tell the road mesh apart from scenery meshes below
                // (Cityscape.js never sets mesh.name, so name-based
                // matching doesn't work).
                var trackMaterialRef = this.materials.track;

                // Forward both arguments -- the original wrapper dropped
                // `quality`, which silently disabled shadows/particles.
                cityscape.buildScenes.call(this, display, quality);

                if (!display || !display.manager) return;
                var setup = display.manager.get("game");
                if (!setup || !setup.scene) return;
                var scene = setup.scene;

                // 1. Fog and Environment Adjustments
                if (scene.fog) {
                    scene.fog.color.setHex(theme.fogColor);
                    if (scene.fog.near) scene.fog.near = theme.fogNear;
                    if (scene.fog.far) scene.fog.far = theme.fogFar;
                }

                if (display.renderer) {
                    if (typeof display.renderer.setClearColorHex === 'function') {
                        display.renderer.setClearColorHex(theme.fogColor, 1.0);
                    } else if (typeof display.renderer.setClearColor === 'function') {
                        display.renderer.setClearColor(theme.fogColor, 1.0);
                    }
                }

                // 2. Traversal: Force Mesh Material & Wireframe Overrides
                //
                // NOTE: this build of three.js (r50-era) predates
                // Object3D.prototype.traverse -- it does not exist on scene/
                // mesh instances here. The equivalent in this version is the
                // free function THREE.SceneUtils.traverseHierarchy(root, cb).
                THREE.SceneUtils.traverseHierarchy(scene, function(child) {
                    if (child instanceof THREE.Mesh && child.material) {
                        var isTrackMesh = (child.material === trackMaterialRef);

                        // NOTE: no material cloning here (this three.js build's
                        // materials don't all implement .clone(), and it isn't
                        // needed anyway -- each track's materials are built fresh
                        // by buildMaterials() on every page load, and "Restart"
                        // does a full window.location.reload(), so there is no
                        // shared state across track plays to protect against.

                        // Toggle Wireframe Matrix Mode
                        if (theme.wireframe) {
                            child.material.wireframe = true;
                        }

                        // Tint Road vs City Structures
                        if (child.material.color) {
                            if (isTrackMesh) {
                                child.material.color.setHex(theme.trackColor);
                            } else {
                                child.material.color.setHex(theme.sceneryColor);
                            }
                        }

                        if (child.material.ambient) {
                            child.material.ambient.setHex(isTrackMesh ? theme.trackColor : theme.sceneryColor);
                        }
                    } else if (child instanceof THREE.Light && child.color) {
                        child.color.setHex(theme.trackColor);
                    }
                });
            }
        };
    });
})();
