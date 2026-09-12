/**
 * CustomTracks.js - Builds all 50 bkcore.hexgl.tracks.* entries.
 *
 * Every track uses the SAME real, original hand-built Cityscape assets --
 * same road/building geometry, same textures, same collision and height
 * data (see buildOriginalVariant in ProceduralTrack.js) -- not a generated
 * approximation of them. Only two things vary per track:
 *   - route: a mirror + independent X/Z stretch, applied identically to
 *     the 3D meshes and to the collision/height bitmaps, seeded from the
 *     track's number;
 *   - theme: skybox tint plus a light ambient tint on the original
 *     materials, from TrackData.js (HEXGL_TRACK_LIST).
 * Track #1 (Cityscape_Prime) gets the identity transform, so it's
 * pixel-for-pixel the original.
 *
 * Ship model, skybox base, HUD, audio and controls are reused from
 * Cityscape.js since none of that depends on the route.
 */
var bkcore = bkcore || {};
bkcore.hexgl = bkcore.hexgl || {};
bkcore.hexgl.tracks = bkcore.hexgl.tracks || {};

(function() {
    var cityscape = bkcore.hexgl.tracks.Cityscape;
    if (!cityscape) return;

    var trackList = (typeof HEXGL_TRACK_LIST !== 'undefined') ? HEXGL_TRACK_LIST : [];

    trackList.forEach(function(theme) {
        theme.seed = theme.num;
        bkcore.hexgl.tracks[theme.id] = bkcore.hexgl.tracks.buildOriginalVariant(theme, cityscape);
    });
})();
