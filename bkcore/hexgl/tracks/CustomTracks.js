/**
 * CustomTracks.js - Builds all 50 bkcore.hexgl.tracks.* entries.
 *
 * Track #1 (Cityscape_Prime) is the real, original hand-built Cityscape
 * circuit -- unmodified, same collision/height maps, same hand-modeled
 * skyscrapers -- so there's always one track in the list that's the actual
 * original game, not a generated approximation of it.
 *
 * Every other entry is a genuinely distinct, procedurally generated
 * closed-loop circuit (see ProceduralTrack.js) -- its own path shape,
 * width, elevation profile and checkpoint layout, derived deterministically
 * from the track's number (used as the generator's seed) -- combined with
 * its own visual theme (fog, track/scenery colors, wireframe mode, lap
 * count) from TrackData.js (HEXGL_TRACK_LIST).
 *
 * Ship model, skybox, HUD, audio and controls are reused from Cityscape.js
 * since none of that depends on track layout.
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
        if (theme.id === 'Cityscape_Prime') {
            // The original track itself, not a procedural stand-in for it.
            bkcore.hexgl.tracks[theme.id] = cityscape;
        } else {
            bkcore.hexgl.tracks[theme.id] = bkcore.hexgl.tracks.buildProcedural(theme, cityscape);
        }
    });
})();
