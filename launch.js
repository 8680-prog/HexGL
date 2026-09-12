function $(id) {
    return document.getElementById(id);
}

var quality = 2; // 0: low, 1: mid, 2: high
var hud = true;
var controlType = 0;
var godmode = false;

// availableTracks: built from the shared 50-track data list (TrackData.js).
// Falls back to the original single Cityscape track if that file failed to load.
var availableTracks = (typeof HEXGL_TRACK_LIST !== 'undefined' && HEXGL_TRACK_LIST.length)
    ? HEXGL_TRACK_LIST.map(function(t) {
        return { id: t.id, name: t.name, laps: t.laps, num: t.num, wireframe: t.wireframe, swatch: t.trackColor };
      })
    : [{ id: 'Cityscape_Prime', name: 'Cityscape Prime', laps: 3, num: 1, wireframe: false, swatch: 0x2fa8ff }];

var selectedTrackIndex = 0;

function hexColor(n) {
    return '#' + (n >>> 0).toString(16).padStart(6, '0');
}

function setSelectedTrack(index) {
    selectedTrackIndex = index;
    var track = availableTracks[selectedTrackIndex];
    var sTrack = $('s-track');
    if (sTrack) sTrack.innerText = 'Track: ' + track.name;
}

// Track Selector: opens the Polytrack-style track grid instead of cycling in place.
var sTrack = $('s-track');
if (sTrack) {
    sTrack.addEventListener('click', function() {
        openTrackSelect();
    }, false);
}

// Every track is the same original Cityscape circuit, mirrored/stretched
// (see buildOriginalVariant in ProceduralTrack.js) -- there's no generated
// loop shape to draw a preview from anymore. Instead this draws a simple
// road-perspective icon whose proportions/flip reflect that track's actual
// transform (same seeded formula the real track uses, via
// computeVariantTransform), on the track's own swatch color.
function drawTrackPreview(canvas, track) {
    var ctx = canvas.getContext('2d');
    var w = canvas.width, h = canvas.height;
    ctx.fillStyle = hexColor(track.swatch);
    ctx.fillRect(0, 0, w, h);

    var internals = window.bkcore && bkcore.hexgl && bkcore.hexgl.tracks && bkcore.hexgl.tracks._proceduralInternals;
    var transform = (internals && internals.computeVariantTransform)
        ? internals.computeVariantTransform(track)
        : { mirrorX: 1, scaleX: 1, scaleZ: 1 };

    var cx = w / 2, cy = h * 0.86;
    var farW = w * 0.12 * transform.scaleX;
    var nearW = w * 0.5 * transform.scaleX;
    var roadLen = h * 0.7 * (0.8 + transform.scaleZ * 0.3);
    var bend = (transform.mirrorX < 0 ? -1 : 1) * w * 0.1 * Math.abs(transform.scaleX - 1) * 3;

    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.moveTo(cx - nearW / 2, cy);
    ctx.lineTo(cx + nearW / 2, cy);
    ctx.lineTo(cx + farW / 2 + bend, cy - roadLen);
    ctx.lineTo(cx - farW / 2 + bend, cy - roadLen);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ff6a3d';
    ctx.beginPath();
    ctx.arc(cx, cy - 2, 3.5, 0, Math.PI * 2);
    ctx.fill();

    if (track.num === 1) {
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.font = 'bold ' + Math.round(h * 0.15) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ORIGINAL', cx, h * 0.2);
        ctx.textAlign = 'start';
    }
}

var trackGrid = $('track-grid');
if (trackGrid) {
    availableTracks.forEach(function(track, index) {
        var card = document.createElement('div');
        card.className = 'track-card';
        card.setAttribute('data-index', index);

        var swatch = document.createElement('canvas');
        swatch.className = 'swatch';
        swatch.width = 220;
        swatch.height = 76;
        card.appendChild(swatch);
        drawTrackPreview(swatch, track);

        var num = document.createElement('div');
        num.className = 'tnum';
        num.innerText = '#' + track.num;
        card.appendChild(num);

        var info = document.createElement('div');
        info.className = 'info';

        var name = document.createElement('div');
        name.className = 'tname';
        name.innerText = track.name;
        info.appendChild(name);

        var meta = document.createElement('div');
        meta.className = 'tmeta';
        meta.innerHTML = '<span>' + track.laps + ' laps</span>' +
            (track.wireframe ? '<span class="wf">WIREFRAME</span>' : '<span></span>');
        info.appendChild(meta);

        card.appendChild(info);

        card.addEventListener('click', function() {
            setSelectedTrack(index);
            document.querySelectorAll('.track-card.selected').forEach(function(el) {
                el.classList.remove('selected');
            });
            card.classList.add('selected');
            closeTrackSelect();
        }, false);

        trackGrid.appendChild(card);
    });
}

function openTrackSelect() {
    $('step-1').style.display = 'none';
    $('track-select').style.display = 'block';
    var cards = document.querySelectorAll('.track-card');
    if (cards[selectedTrackIndex]) {
        cards[selectedTrackIndex].classList.add('selected');
        cards[selectedTrackIndex].scrollIntoView({ block: 'center' });
    }
}

function closeTrackSelect() {
    $('track-select').style.display = 'none';
    $('step-1').style.display = 'block';
}

var trackSelectClose = $('track-select-close');
if (trackSelectClose) {
    trackSelectClose.addEventListener('click', closeTrackSelect, false);
}

// Initialize default selection label
setSelectedTrack(0);

// Controls Toggle
var sControlType = $('s-controlType');
if (sControlType) {
    sControlType.addEventListener('click', function() {
        controlType = (controlType + 1) % 2;
        var names = ['Keyboard', 'Touch / Gamepad'];
        this.innerText = 'Controls: ' + names[controlType];
    }, false);
}

// Quality Toggle
var sQuality = $('s-quality');
if (sQuality) {
    sQuality.addEventListener('click', function() {
        quality = (quality + 1) % 3;
        var names = ['Low', 'Medium', 'High'];
        this.innerText = 'Quality: ' + names[quality];
    }, false);
}

// HUD Toggle
var sHud = $('s-hud');
if (sHud) {
    sHud.addEventListener('click', function() {
        hud = !hud;
        this.innerText = 'HUD: ' + (hud ? 'On' : 'Off');
    }, false);
}

// Credits Handlers
var sCredits = $('s-credits');
if (sCredits) {
    sCredits.addEventListener('click', function() {
        $('credits').style.display = 'block';
        $('step-1').style.display = 'none';
    }, false);
}

var credits = $('credits');
if (credits) {
    credits.addEventListener('click', function() {
        $('credits').style.display = 'none';
        $('step-1').style.display = 'block';
    }, false);
}

// Start Game Handler
var startBtn = $('start');
if (startBtn) {
    startBtn.addEventListener('click', function() {
        $('step-1').style.display = 'none';
        $('step-2').style.display = 'block';
    }, false);
}

var step2 = $('step-2');
if (step2) {
    step2.addEventListener('click', function() {
        $('step-2').style.display = 'none';
        $('step-3').style.display = 'block';

        var hexGL = new bkcore.hexgl.HexGL({
            document: document,
            codePath: '',
            width: window.innerWidth,
            height: window.innerHeight,
            container: $('main'),
            overlay: $('overlay'),
            gameover: $('step-5'),
            quality: quality,
            hud: hud,
            godmode: godmode,
            controlType: controlType,
            track: availableTracks[selectedTrackIndex].id
        });

        var progressbar = $('progressbar');

        hexGL.load({
            onLoad: function() {
                $('step-3').style.display = 'none';
                $('step-4').style.display = 'block';
                hexGL.init();
                hexGL.start();
            },
            onError: function(err) {
                console.error("HexGL Loading Error:", err);
            },
            onProgress: function(current, total, name) {
                if (progressbar) {
                    progressbar.style.width = Math.floor((current / total) * 100) + '%';
                }
            }
        });
    }, false);
}

// Restart Handler
var step5 = $('step-5');
if (step5) {
    step5.addEventListener('click', function() {
        window.location.reload();
    }, false);
}
