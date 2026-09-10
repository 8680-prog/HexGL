function $(id) {
    return document.getElementById(id);
}

var quality = 2; // 0: low, 1: mid, 2: high
var hud = true;
var controlType = 0;
var godmode = false;

var availableTracks = [
    { id: 'Cityscape_Prime', name: 'Cityscape Prime' },
    { id: 'Cyber_Neon', name: 'Cyber Neon Night' },
    { id: 'Martian_Canyon', name: 'Martian Canyon' },
    { id: 'Toxic_Sector', name: 'Toxic Sector' },
    { id: 'Abyssal_Void', name: 'Abyssal Void' }
];
var selectedTrackIndex = 0;

// Track Selector Toggle
var sTrack = $('s-track');
if (sTrack) {
    sTrack.addEventListener('click', function() {
        selectedTrackIndex = (selectedTrackIndex + 1) % availableTracks.length;
        this.innerText = 'Track: ' + availableTracks[selectedTrackIndex].name;
    }, false);
}

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
