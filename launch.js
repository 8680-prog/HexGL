// HexGL Launcher — based on original CoffeeScript-generated launch.js
// with track selection added.
(function() {

  var $ = function(_) { return document.getElementById(_); };

  // ── Build ordered list of track keys and names ──
  var trackKeys = Object.keys(bkcore.hexgl.tracks);  // e.g. ["Cityscape", "Cyber_Grid_Alpha", …]
  var currentTrackIdx = 0;

  // ── Init game ──
  function init(controlType, quality, hud, godmode) {
    var hexGL = new bkcore.hexgl.HexGL({
      document: document,
      width: window.innerWidth,
      height: window.innerHeight,
      container: $('main'),
      overlay: $('overlay'),
      gameover: $('step-5'),
      quality: quality,
      difficulty: 0,
      hud: hud === 1,
      controlType: controlType,
      godmode: godmode,
      track: trackKeys[currentTrackIdx]
    });

    window.hexGL = hexGL;
    var progressbar = $('progressbar');

    hexGL.load({
      onLoad: function() {
        console.log('LOADED.');
        hexGL.init();
        $('step-3').style.display = 'none';
        $('step-4').style.display = 'block';
        hexGL.start();
      },
      onError: function(s) {
        console.error("Error loading " + s + ".");
      },
      onProgress: function(p, t, n) {
        console.log("LOADED " + t + " : " + n + " (" + p.loaded + "/" + p.total + ").");
        progressbar.style.width = "" + (p.loaded / p.total * 100) + "%";
      }
    });
  }

  // ── URL-parameter helper ──
  var u = bkcore.Utils.getURLParameter;
  var defaultControls = bkcore.Utils.isTouchDevice() ? 1 : 0;

  // ── Settings array: [paramName, labels, defaultIdx, currentIdx, prefix] ──
  var s = [
    ['controlType', ['KEYBOARD', 'TOUCH', 'LEAP MOTION CONTROLLER', 'GAMEPAD'], defaultControls, defaultControls, 'Controls: '],
    ['quality',     ['LOW', 'MID', 'HIGH', 'VERY HIGH'],                        3,               3,               'Quality: '],
    ['hud',         ['OFF', 'ON'],                                               1,               1,               'HUD: '],
    ['godmode',     ['OFF', 'ON'],                                               0,               1,               'Godmode: ']
  ];

  // Wire each setting element to cycle on click
  for (var _i = 0; _i < s.length; _i++) {
    (function(a) {
      var fromURL = u(a[0]);
      if (fromURL != null) a[3] = fromURL;
      else a[3] = a[2];

      var e = $("s-" + a[0]);
      if (!e) return;

      var refresh = function() { e.innerHTML = a[4] + a[1][a[3]]; };
      refresh();

      e.onclick = function() {
        a[3] = (a[3] + 1) % a[1].length;
        refresh();
      };
    })(s[_i]);
  }

  // ── Track selector ──
  var elTrack = $('s-track');
  if (elTrack) {
    var refreshTrackLabel = function() {
      var t = bkcore.hexgl.tracks[trackKeys[currentTrackIdx]];
      elTrack.innerHTML = 'Track: ' + (t.name || trackKeys[currentTrackIdx]);
    };
    refreshTrackLabel();

    elTrack.onclick = function() {
      currentTrackIdx = (currentTrackIdx + 1) % trackKeys.length;
      refreshTrackLabel();
    };
  }

  // ── Step navigation ──

  // Step 2 — control-help screen → load game
  $('step-2').onclick = function() {
    $('step-2').style.display = 'none';
    $('step-3').style.display = 'block';
    init(s[0][3], s[1][3], s[2][3], s[3][3]);
  };

  // Step 5 — game-over screen → reload
  $('step-5').onclick = function() {
    window.location.reload();
  };

  // Credits toggle
  $('s-credits').onclick = function() {
    $('step-1').style.display = 'none';
    $('credits').style.display = 'block';
  };
  $('credits').onclick = function() {
    $('step-1').style.display = 'block';
    $('credits').style.display = 'none';
  };

  // ── WebGL check ──
  var hasWebGL = function() {
    var gl = null;
    var canvas = document.createElement('canvas');
    try { gl = canvas.getContext("webgl"); } catch(e) {}
    if (gl == null) {
      try { gl = canvas.getContext("experimental-webgl"); } catch(e) {}
    }
    return gl != null;
  };

  if (!hasWebGL()) {
    var getWebGL = $('start');
    getWebGL.innerHTML = 'WebGL is not supported!';
    getWebGL.onclick = function() {
      window.location.href = 'http://get.webgl.org/';
    };
  } else {
    $('start').onclick = function() {
      $('step-1').style.display = 'none';
      $('step-2').style.display = 'block';
      $('step-2').style.backgroundImage = "url(css/help-" + s[0][3] + ".png)";
    };
  }

}).call(this);
