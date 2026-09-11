/**
 * TrackData.js - Single source of truth for all 50 HexGL track variants.
 *
 * The game ships one 3D circuit model (Cityscape). Each entry below re-skins
 * that circuit with its own fog, lighting and material palette, lap count
 * and (for a couple of extreme variants) wireframe "grid" rendering, so each
 * of the 50 selectable tracks looks and plays distinctly. CustomTracks.js
 * consumes this list to build the actual bkcore.hexgl.tracks.* objects, and
 * launch.js consumes it to render the Polytrack-style track-select grid.
 */
var HEXGL_TRACK_LIST = [
  {
    num: 1, id: "Cityscape_Prime", name: "Cityscape Prime", laps: 3,
    fogColor: 0x88bbff, fogNear: 100, fogFar: 4000,
    trackColor: 0x2fa8ff, sceneryColor: 0x888888, wireframe: false
  },
  {
    num: 2, id: "Cityscape_RushHour", name: "Cityscape Rush Hour", laps: 3,
    fogColor: 0x88bbff, fogNear: 100, fogFar: 4000,
    trackColor: 0x2fa8ff, sceneryColor: 0x888888, wireframe: false
  },
  {
    num: 3, id: "Cityscape_Midnight", name: "Cityscape Midnight", laps: 4,
    fogColor: 0x88bbff, fogNear: 100, fogFar: 4000,
    trackColor: 0x2fa8ff, sceneryColor: 0x888888, wireframe: false
  },
  {
    num: 4, id: "Cityscape_Downpour", name: "Cityscape Downpour", laps: 4,
    fogColor: 0x88bbff, fogNear: 100, fogFar: 4000,
    trackColor: 0x2fa8ff, sceneryColor: 0x888888, wireframe: false
  },
  {
    num: 5, id: "Cityscape_SkylineBlaze", name: "Cityscape Skyline Blaze", laps: 5,
    fogColor: 0x88bbff, fogNear: 100, fogFar: 4000,
    trackColor: 0x2fa8ff, sceneryColor: 0x888888, wireframe: false
  },
  {
    num: 6, id: "CyberNeon_Night", name: "Cyber Neon Night", laps: 3,
    fogColor: 0x0a001a, fogNear: 50, fogFar: 2000,
    trackColor: 0x00ffff, sceneryColor: 0xff00ff, wireframe: false
  },
  {
    num: 7, id: "CyberNeon_Overdrive", name: "Cyber Neon Overdrive", laps: 3,
    fogColor: 0x0a001a, fogNear: 50, fogFar: 2000,
    trackColor: 0x00ffff, sceneryColor: 0xff00ff, wireframe: false
  },
  {
    num: 8, id: "CyberNeon_Blackout", name: "Cyber Neon Blackout", laps: 4,
    fogColor: 0x0a001a, fogNear: 50, fogFar: 2000,
    trackColor: 0x00ffff, sceneryColor: 0xff00ff, wireframe: false
  },
  {
    num: 9, id: "CyberNeon_Pulse", name: "Cyber Neon Pulse", laps: 4,
    fogColor: 0x0a001a, fogNear: 50, fogFar: 2000,
    trackColor: 0x00ffff, sceneryColor: 0xff00ff, wireframe: false
  },
  {
    num: 10, id: "CyberNeon_Matrix", name: "Cyber Neon Matrix", laps: 5,
    fogColor: 0x0a001a, fogNear: 50, fogFar: 2000,
    trackColor: 0x00ffff, sceneryColor: 0xff00ff, wireframe: false
  },
  {
    num: 11, id: "MartianCanyon_Canyon", name: "Martian Canyon", laps: 3,
    fogColor: 0x2b0800, fogNear: 20, fogFar: 1800,
    trackColor: 0xff4400, sceneryColor: 0x661100, wireframe: false
  },
  {
    num: 12, id: "MartianCanyon_DustStorm", name: "Martian Dust Storm", laps: 3,
    fogColor: 0x2b0800, fogNear: 20, fogFar: 1800,
    trackColor: 0xff4400, sceneryColor: 0x661100, wireframe: false
  },
  {
    num: 13, id: "MartianCanyon_RedHorizon", name: "Martian Red Horizon", laps: 4,
    fogColor: 0x2b0800, fogNear: 20, fogFar: 1800,
    trackColor: 0xff4400, sceneryColor: 0x661100, wireframe: false
  },
  {
    num: 14, id: "MartianCanyon_CraterRun", name: "Martian Crater Run", laps: 4,
    fogColor: 0x2b0800, fogNear: 20, fogFar: 1800,
    trackColor: 0xff4400, sceneryColor: 0x661100, wireframe: false
  },
  {
    num: 15, id: "MartianCanyon_SolarFlare", name: "Martian Solar Flare", laps: 5,
    fogColor: 0x2b0800, fogNear: 20, fogFar: 1800,
    trackColor: 0xff4400, sceneryColor: 0x661100, wireframe: false
  },
  {
    num: 16, id: "ToxicSector_Sector", name: "Toxic Sector", laps: 3,
    fogColor: 0x001a05, fogNear: 10, fogFar: 1200,
    trackColor: 0x39ff14, sceneryColor: 0x004411, wireframe: false
  },
  {
    num: 17, id: "ToxicSector_SludgeRun", name: "Toxic Sludge Run", laps: 3,
    fogColor: 0x001a05, fogNear: 10, fogFar: 1200,
    trackColor: 0x39ff14, sceneryColor: 0x004411, wireframe: false
  },
  {
    num: 18, id: "ToxicSector_RadiationZone", name: "Toxic Radiation Zone", laps: 4,
    fogColor: 0x001a05, fogNear: 10, fogFar: 1200,
    trackColor: 0x39ff14, sceneryColor: 0x004411, wireframe: false
  },
  {
    num: 19, id: "ToxicSector_Biohazard", name: "Toxic Biohazard", laps: 4,
    fogColor: 0x001a05, fogNear: 10, fogFar: 1200,
    trackColor: 0x39ff14, sceneryColor: 0x004411, wireframe: false
  },
  {
    num: 20, id: "ToxicSector_ContaminatedCore", name: "Toxic Contaminated Core", laps: 5,
    fogColor: 0x001a05, fogNear: 10, fogFar: 1200,
    trackColor: 0x39ff14, sceneryColor: 0x004411, wireframe: false
  },
  {
    num: 21, id: "AbyssalVoid_Void", name: "Abyssal Void", laps: 3,
    fogColor: 0x150a24, fogNear: 100, fogFar: 3000,
    trackColor: 0x3388ff, sceneryColor: 0x2a1145, wireframe: false
  },
  {
    num: 22, id: "AbyssalVoid_DeepCurrent", name: "Abyssal Deep Current", laps: 3,
    fogColor: 0x150a24, fogNear: 100, fogFar: 3000,
    trackColor: 0x3388ff, sceneryColor: 0x2a1145, wireframe: false
  },
  {
    num: 23, id: "AbyssalVoid_Trench", name: "Abyssal Trench", laps: 4,
    fogColor: 0x150a24, fogNear: 100, fogFar: 3000,
    trackColor: 0x3388ff, sceneryColor: 0x2a1145, wireframe: false
  },
  {
    num: 24, id: "AbyssalVoid_BlackTide", name: "Abyssal Black Tide", laps: 4,
    fogColor: 0x150a24, fogNear: 100, fogFar: 3000,
    trackColor: 0x3388ff, sceneryColor: 0x2a1145, wireframe: false
  },
  {
    num: 25, id: "AbyssalVoid_EventHorizon", name: "Abyssal Event Horizon", laps: 5,
    fogColor: 0x150a24, fogNear: 100, fogFar: 3000,
    trackColor: 0x3388ff, sceneryColor: 0x2a1145, wireframe: true
  },
  {
    num: 26, id: "ArcticFrost_Frost", name: "Arctic Frost", laps: 3,
    fogColor: 0xdff3ff, fogNear: 80, fogFar: 3500,
    trackColor: 0xbfe9ff, sceneryColor: 0x4477aa, wireframe: false
  },
  {
    num: 27, id: "ArcticFrost_Blizzard", name: "Arctic Blizzard", laps: 3,
    fogColor: 0xdff3ff, fogNear: 80, fogFar: 3500,
    trackColor: 0xbfe9ff, sceneryColor: 0x4477aa, wireframe: false
  },
  {
    num: 28, id: "ArcticFrost_GlacierRun", name: "Arctic Glacier Run", laps: 4,
    fogColor: 0xdff3ff, fogNear: 80, fogFar: 3500,
    trackColor: 0xbfe9ff, sceneryColor: 0x4477aa, wireframe: false
  },
  {
    num: 29, id: "ArcticFrost_Permafrost", name: "Arctic Permafrost", laps: 4,
    fogColor: 0xdff3ff, fogNear: 80, fogFar: 3500,
    trackColor: 0xbfe9ff, sceneryColor: 0x4477aa, wireframe: false
  },
  {
    num: 30, id: "ArcticFrost_Aurora", name: "Arctic Aurora", laps: 5,
    fogColor: 0xdff3ff, fogNear: 80, fogFar: 3500,
    trackColor: 0xbfe9ff, sceneryColor: 0x4477aa, wireframe: false
  },
  {
    num: 31, id: "DesertMirage_Mirage", name: "Desert Mirage", laps: 3,
    fogColor: 0xffe3ad, fogNear: 60, fogFar: 3000,
    trackColor: 0xffcc66, sceneryColor: 0xaa7733, wireframe: false
  },
  {
    num: 32, id: "DesertMirage_DuneSea", name: "Desert Dune Sea", laps: 3,
    fogColor: 0xffe3ad, fogNear: 60, fogFar: 3000,
    trackColor: 0xffcc66, sceneryColor: 0xaa7733, wireframe: false
  },
  {
    num: 33, id: "DesertMirage_ScorchedFlats", name: "Desert Scorched Flats", laps: 4,
    fogColor: 0xffe3ad, fogNear: 60, fogFar: 3000,
    trackColor: 0xffcc66, sceneryColor: 0xaa7733, wireframe: false
  },
  {
    num: 34, id: "DesertMirage_HeatHaze", name: "Desert Heat Haze", laps: 4,
    fogColor: 0xffe3ad, fogNear: 60, fogFar: 3000,
    trackColor: 0xffcc66, sceneryColor: 0xaa7733, wireframe: false
  },
  {
    num: 35, id: "DesertMirage_OasisRun", name: "Desert Oasis Run", laps: 5,
    fogColor: 0xffe3ad, fogNear: 60, fogFar: 3000,
    trackColor: 0xffcc66, sceneryColor: 0xaa7733, wireframe: false
  },
  {
    num: 36, id: "VolcanicRidge_Ridge", name: "Volcanic Ridge", laps: 3,
    fogColor: 0x1a0000, fogNear: 15, fogFar: 1500,
    trackColor: 0xff2200, sceneryColor: 0x220000, wireframe: false
  },
  {
    num: 37, id: "VolcanicRidge_LavaFlow", name: "Volcanic Lava Flow", laps: 3,
    fogColor: 0x1a0000, fogNear: 15, fogFar: 1500,
    trackColor: 0xff2200, sceneryColor: 0x220000, wireframe: false
  },
  {
    num: 38, id: "VolcanicRidge_EmberFields", name: "Volcanic Ember Fields", laps: 4,
    fogColor: 0x1a0000, fogNear: 15, fogFar: 1500,
    trackColor: 0xff2200, sceneryColor: 0x220000, wireframe: false
  },
  {
    num: 39, id: "VolcanicRidge_Ashfall", name: "Volcanic Ashfall", laps: 4,
    fogColor: 0x1a0000, fogNear: 15, fogFar: 1500,
    trackColor: 0xff2200, sceneryColor: 0x220000, wireframe: false
  },
  {
    num: 40, id: "VolcanicRidge_MagmaCore", name: "Volcanic Magma Core", laps: 5,
    fogColor: 0x1a0000, fogNear: 15, fogFar: 1500,
    trackColor: 0xff2200, sceneryColor: 0x220000, wireframe: false
  },
  {
    num: 41, id: "DeepSpace_Orbit", name: "Orbital Orbit", laps: 3,
    fogColor: 0x05001a, fogNear: 200, fogFar: 5000,
    trackColor: 0x9955ff, sceneryColor: 0x220044, wireframe: false
  },
  {
    num: 42, id: "DeepSpace_Nebula", name: "Orbital Nebula", laps: 3,
    fogColor: 0x05001a, fogNear: 200, fogFar: 5000,
    trackColor: 0x9955ff, sceneryColor: 0x220044, wireframe: false
  },
  {
    num: 43, id: "DeepSpace_StarDrift", name: "Orbital Star Drift", laps: 4,
    fogColor: 0x05001a, fogNear: 200, fogFar: 5000,
    trackColor: 0x9955ff, sceneryColor: 0x220044, wireframe: false
  },
  {
    num: 44, id: "DeepSpace_ZeroG", name: "Orbital Zero-G", laps: 4,
    fogColor: 0x05001a, fogNear: 200, fogFar: 5000,
    trackColor: 0x9955ff, sceneryColor: 0x220044, wireframe: false
  },
  {
    num: 45, id: "DeepSpace_CosmicRift", name: "Orbital Cosmic Rift", laps: 5,
    fogColor: 0x05001a, fogNear: 200, fogFar: 5000,
    trackColor: 0x9955ff, sceneryColor: 0x220044, wireframe: true
  },
  {
    num: 46, id: "SunsetStrip_Strip", name: "Sunset Strip", laps: 3,
    fogColor: 0xff9966, fogNear: 70, fogFar: 3200,
    trackColor: 0xff6699, sceneryColor: 0x552244, wireframe: false
  },
  {
    num: 47, id: "SunsetStrip_Boulevard", name: "Sunset Boulevard", laps: 3,
    fogColor: 0xff9966, fogNear: 70, fogFar: 3200,
    trackColor: 0xff6699, sceneryColor: 0x552244, wireframe: false
  },
  {
    num: 48, id: "SunsetStrip_NeonDusk", name: "Sunset Neon Dusk", laps: 4,
    fogColor: 0xff9966, fogNear: 70, fogFar: 3200,
    trackColor: 0xff6699, sceneryColor: 0x552244, wireframe: false
  },
  {
    num: 49, id: "SunsetStrip_CoastalRun", name: "Sunset Coastal Run", laps: 4,
    fogColor: 0xff9966, fogNear: 70, fogFar: 3200,
    trackColor: 0xff6699, sceneryColor: 0x552244, wireframe: false
  },
  {
    num: 50, id: "SunsetStrip_TwilightCircuit", name: "Sunset Twilight Circuit", laps: 5,
    fogColor: 0xff9966, fogNear: 70, fogFar: 3200,
    trackColor: 0xff6699, sceneryColor: 0x552244, wireframe: false
  }
];

if (typeof module !== "undefined" && module.exports) module.exports = HEXGL_TRACK_LIST;
