document.addEventListener("DOMContentLoaded", function() {
    var tracks = Object.keys(bkcore.hexgl.tracks);
    var currentTrackIdx = 0;
    var quality = 2;
    var hud = true;
    var controlType = 0;

    var elTrack = document.getElementById("s-track");
    var elStart = document.getElementById("start");

    if (elTrack) {
        elTrack.addEventListener("click", function() {
            currentTrackIdx = (currentTrackIdx + 1) % tracks.length;
            var trackObj = bkcore.hexgl.tracks[tracks[currentTrackIdx]];
            elTrack.innerHTML = "Track: " + trackObj.name + " (" + trackObj.difficulty + ")";
        }, false);
    }

    if (elStart) {
        elStart.addEventListener("click", function() {
            document.getElementById("step-1").style.display = "none";
            document.getElementById("step-4").style.display = "block";

            var hexGL = new bkcore.hexgl.HexGL({
                document: document,
                codePath: '',
                width: window.innerWidth,
                height: window.innerHeight,
                container: document.getElementById("main"),
                overlay: document.getElementById("overlay"),
                gameover: document.getElementById("step-5"),
                quality: quality,
                hud: hud,
                controlType: controlType,
                track: tracks[currentTrackIdx]
            });

            hexGL.load();
        }, false);
    }
}, false);
