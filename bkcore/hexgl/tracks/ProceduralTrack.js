/**
 * ProceduralTrack.js - Generates genuinely distinct closed-loop circuits.
 *
 * HexGL's ship physics (collision, height/elevation, checkpoints) are all
 * driven by sampling 2D bitmaps (see ShipControls.js / Gameplay.js /
 * bkcore.ImageData) rather than by raycasting against 3D geometry. That
 * means a real, physically distinct track can be built entirely in code:
 *
 *   1. Pick a seed -> deterministically generate a closed-loop centerline
 *      (a jittered, rounded polygon smoothed with a Catmull-Rom spline).
 *   2. Rasterize that path onto an offscreen canvas as the collision map
 *      (white = drivable, everything else = wall) and a second canvas as
 *      the height map (encodes elevation, flat or hilly per track), plus
 *      checkpoint bands and boost pads baked into the collision map's
 *      color channels exactly the way Cityscape's hand-authored map does.
 *   3. Build a matching 3D ribbon mesh along the same path/heights so what
 *      you see lines up with what you drive on.
 *
 * Every track built this way has its own layout (loop shape, width,
 * elevation, checkpoint count) -- not a re-skin of a shared circuit.
 *
 * Ship model, skybox, HUD textures, audio and controls are all reused
 * from Cityscape.js (cityscape.load / cityscape.buildMaterials) since
 * none of that depends on track layout.
 */
var bkcore = bkcore || {};
bkcore.hexgl = bkcore.hexgl || {};
bkcore.hexgl.tracks = bkcore.hexgl.tracks || {};

(function() {

    // ---- Seeded RNG (mulberry32) so every track is reproducible from its seed ----
    function makeRng(seed) {
        var a = seed >>> 0;
        return function() {
            a |= 0; a = (a + 0x6D2B79F5) | 0;
            var t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    // ---- Closed Catmull-Rom spline sampler ----
    function catmullRomPoint(p0, p1, p2, p3, t) {
        var t2 = t * t, t3 = t2 * t;
        return {
            x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
            z: 0.5 * ((2 * p1.z) + (-p0.z + p2.z) * t + (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 + (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t3)
        };
    }

    function sampleClosedSpline(controlPoints, samplesPerSegment) {
        var n = controlPoints.length;
        var out = [];
        for (var i = 0; i < n; i++) {
            var p0 = controlPoints[(i - 1 + n) % n];
            var p1 = controlPoints[i];
            var p2 = controlPoints[(i + 1) % n];
            var p3 = controlPoints[(i + 2) % n];
            for (var s = 0; s < samplesPerSegment; s++) {
                out.push(catmullRomPoint(p0, p1, p2, p3, s / samplesPerSegment));
            }
        }
        return out;
    }

    // ---- Layout generation: control points -> smooth path + per-point height/tangent/normal ----
    function generateLayout(seed) {
        var rng = makeRng(seed);

        var numPoints = 8 + Math.floor(rng() * 7); // 8..14
        var baseRadius = 900 + rng() * 900; // 900..1800
        var halfWidth = 46 + rng() * 44; // 46..90

        var controlPoints = [];
        for (var i = 0; i < numPoints; i++) {
            var slot = (i / numPoints) * Math.PI * 2;
            var jitter = (rng() - 0.5) * (Math.PI * 2 / numPoints) * 0.6;
            var angle = slot + jitter;
            var radius = baseRadius * (0.68 + rng() * 0.64);
            controlPoints.push({ x: Math.cos(angle) * radius, z: Math.sin(angle) * radius });
        }

        var samplesPerSegment = 24;
        var path = sampleClosedSpline(controlPoints, samplesPerSegment);
        var total = path.length;

        var hilly = rng() < 0.4;
        var hillAmplitude = hilly ? (18 + rng() * 55) : 0;
        var hillFreq = 1 + Math.floor(rng() * 3);
        var hillPhase = rng() * Math.PI * 2;

        for (i = 0; i < total; i++) {
            var t = i / total;
            path[i].height = hilly
                ? hillAmplitude * (0.5 + 0.5 * Math.sin(hillFreq * t * Math.PI * 2 + hillPhase))
                : 0;
        }

        // tangent/normal per sample (finite differences), used for ribbon edges
        for (i = 0; i < total; i++) {
            var prev = path[(i - 1 + total) % total];
            var next = path[(i + 1) % total];
            var tx = next.x - prev.x, tz = next.z - prev.z;
            var tl = Math.sqrt(tx * tx + tz * tz) || 1;
            tx /= tl; tz /= tl;
            path[i].tangent = { x: tx, z: tz };
            path[i].normal = { x: -tz, z: tx }; // perpendicular, world XZ plane
        }

        // Cumulative arc length along the path, used later to tile the road/
        // wall textures at a consistent real-world scale instead of stretching
        // one texture repeat across the whole loop regardless of its length.
        // Distances are unaffected by the rotation applied further down, so
        // computing this now (pre-rotation) is equivalent to doing it after.
        path[0].arc = 0;
        for (i = 1; i < total; i++) {
            var dx = path[i].x - path[i - 1].x, dz = path[i].z - path[i - 1].z;
            path[i].arc = path[i - 1].arc + Math.sqrt(dx * dx + dz * dz);
        }
        var lastDx = path[0].x - path[total - 1].x, lastDz = path[0].z - path[total - 1].z;
        var totalLength = path[total - 1].arc + Math.sqrt(lastDx * lastDx + lastDz * lastDz);

        var checkpointCount = 3 + Math.floor(rng() * 3); // 3..5 (includes start/finish)
        var checkpoints = [];
        for (i = 0; i < checkpointCount; i++) {
            checkpoints.push(Math.floor((i / checkpointCount) * total));
        }

        // IMPORTANT: ShipControls.reset() does not build a proper yaw quaternion
        // from an arbitrary spawnRotation -- it only works correctly for the
        // identity case {x:0,y:0,z:0} (which is why Cityscape always uses that).
        // Rather than fight that, rotate the WHOLE path so the tangent at the
        // start checkpoint points along world +Z, matching the ship's fixed
        // default forward direction under an identity rotation. That lets every
        // procedural track keep spawnRotation at identity and still start the
        // ship facing correctly along the track.
        // Vectors here use a bearing-style angle (angle measured from +Z
        // toward +X, i.e. atan2(x, z), so bearing 0 = (0,1)). Rotating a
        // vector at bearing phi by +alignAngle in that convention is:
        //   newX = x*cos(alignAngle) - z*sin(alignAngle)
        //   newZ = x*sin(alignAngle) + z*cos(alignAngle)
        // which maps a vector originally AT bearing alignAngle to bearing 0.
        // (Verified: this is NOT the same sign pattern as the standard
        // atan2(y,x) rotation matrix -- mixing the two conventions up is
        // what caused the ship to spawn facing an essentially random
        // direction the first time this was written.)
        var startTangent = path[checkpoints[0]].tangent;
        var alignAngle = Math.atan2(startTangent.x, startTangent.z);
        var cosA = Math.cos(alignAngle), sinA = Math.sin(alignAngle);
        for (i = 0; i < total; i++) {
            var p = path[i];
            var rx = p.x * cosA - p.z * sinA;
            var rz = p.x * sinA + p.z * cosA;
            p.x = rx; p.z = rz;
            var ttx = p.tangent.x * cosA - p.tangent.z * sinA;
            var ttz = p.tangent.x * sinA + p.tangent.z * cosA;
            p.tangent.x = ttx; p.tangent.z = ttz;
            var ntx = p.normal.x * cosA - p.normal.z * sinA;
            var ntz = p.normal.x * sinA + p.normal.z * cosA;
            p.normal.x = ntx; p.normal.z = ntz;
        }

        // The original Cityscape track only had a single speed-boost zone on
        // the whole lap -- boosts were a rare, deliberate risk/reward pickup,
        // not something you'd pass every few seconds. 1-3 per lap made every
        // procedural track much more forgiving than that. Match the
        // original's scarcity: exactly one boost pad per track.
        var boostPadCount = 1;
        var boostPads = [];
        for (i = 0; i < boostPadCount; i++) {
            // keep boost pads away from the start/finish line
            var idx = Math.floor(((i + 1) / (boostPadCount + 1)) * total + total * 0.15) % total;
            boostPads.push(idx);
        }

        // One randomized heal/shield pad, kept clear of the start line and
        // every boost pad so they never overlap on the road.
        var healPadIndex = null;
        for (var attempt = 0; attempt < 12; attempt++) {
            var candidate = Math.floor(rng() * total);
            var minSep = total * 0.12;
            var farEnough = Math.abs(candidate - 0) > minSep && Math.abs(candidate - total) > minSep;
            for (var bp = 0; bp < boostPads.length && farEnough; bp++) {
                if (Math.min(Math.abs(candidate - boostPads[bp]), total - Math.abs(candidate - boostPads[bp])) < minSep) farEnough = false;
            }
            if (farEnough) { healPadIndex = candidate; break; }
        }

        return {
            path: path,
            halfWidth: halfWidth,
            checkpoints: checkpoints,
            boostPads: boostPads,
            healPadIndex: healPadIndex,
            hilly: hilly,
            totalLength: totalLength,
            maxRadiusEstimate: baseRadius * 1.32 + halfWidth
        };
    }

    // ---- Rasterize collision + height maps to canvases, return data URLs ----
    function rasterizeMaps(layout, canvasSize, worldSpan) {
        var pixelRatio = canvasSize / worldSpan;
        var path = layout.path;
        var n = path.length;

        function toPx(p) {
            return {
                x: canvasSize / 2 + p.x * pixelRatio,
                y: canvasSize / 2 + p.z * pixelRatio
            };
        }

        // --- Collision map: black = wall, white = track, (255,255,idx) = checkpoint, (255,<127,<127) = boost ---
        var cCanvas = document.createElement('canvas');
        cCanvas.width = cCanvas.height = canvasSize;
        var cctx = cCanvas.getContext('2d');
        cctx.fillStyle = '#000000';
        cctx.fillRect(0, 0, canvasSize, canvasSize);

        cctx.strokeStyle = '#ffffff';
        cctx.lineWidth = layout.halfWidth * 2 * pixelRatio;
        cctx.lineJoin = 'round';
        cctx.lineCap = 'round';
        cctx.beginPath();
        for (var i = 0; i <= n; i++) {
            var p = toPx(path[i % n]);
            if (i === 0) cctx.moveTo(p.x, p.y); else cctx.lineTo(p.x, p.y);
        }
        cctx.closePath();
        cctx.stroke();

        // Checkpoint bands (drawn after, thin, crossing the track)
        cctx.lineWidth = Math.max(3, layout.halfWidth * 0.35 * pixelRatio);
        layout.checkpoints.forEach(function(idx, cpNumber) {
            var p = path[idx];
            var a = { x: p.x + p.normal.x * layout.halfWidth * 1.3, z: p.z + p.normal.z * layout.halfWidth * 1.3 };
            var b = { x: p.x - p.normal.x * layout.halfWidth * 1.3, z: p.z - p.normal.z * layout.halfWidth * 1.3 };
            var pa = toPx(a), pb = toPx(b);
            cctx.strokeStyle = 'rgb(255,255,' + cpNumber + ')';
            cctx.beginPath();
            cctx.moveTo(pa.x, pa.y);
            cctx.lineTo(pb.x, pb.y);
            cctx.stroke();
        });

        // Boost pads
        cctx.lineWidth = Math.max(3, layout.halfWidth * 0.6 * pixelRatio);
        cctx.strokeStyle = 'rgb(255,60,60)';
        layout.boostPads.forEach(function(idx) {
            var p = path[idx];
            var next = path[(idx + 6) % n];
            var pa = toPx(p), pb = toPx(next);
            cctx.beginPath();
            cctx.moveTo(pa.x, pa.y);
            cctx.lineTo(pb.x, pb.y);
            cctx.stroke();
        });

        // --- Height map: white background = "no data" sentinel (>16777), track stroked with r=height (0..255) ---
        var hCanvas = document.createElement('canvas');
        hCanvas.width = hCanvas.height = canvasSize;
        var hctx = hCanvas.getContext('2d');
        hctx.fillStyle = '#ffffff';
        hctx.fillRect(0, 0, canvasSize, canvasSize);

        hctx.lineJoin = 'round';
        hctx.lineCap = 'round';
        hctx.lineWidth = layout.halfWidth * 2.4 * pixelRatio;

        if (!layout.hilly) {
            hctx.strokeStyle = 'rgb(0,0,0)'; // height 0 everywhere
            hctx.beginPath();
            for (i = 0; i <= n; i++) {
                var hp = toPx(path[i % n]);
                if (i === 0) hctx.moveTo(hp.x, hp.y); else hctx.lineTo(hp.x, hp.y);
            }
            hctx.closePath();
            hctx.stroke();
        } else {
            // vary stroke color per-segment to encode elevation along the path
            for (i = 0; i < n; i++) {
                var p1 = toPx(path[i]);
                var p2 = toPx(path[(i + 1) % n]);
                var h = Math.max(0, Math.min(255, Math.round(path[i].height)));
                hctx.strokeStyle = 'rgb(' + h + ',0,0)';
                hctx.beginPath();
                hctx.moveTo(p1.x, p1.y);
                hctx.lineTo(p2.x, p2.y);
                hctx.stroke();
            }
        }

        return {
            collisionDataURL: cCanvas.toDataURL('image/png'),
            heightDataURL: hCanvas.toDataURL('image/png'),
            pixelRatio: pixelRatio
        };
    }

    // Blends a theme color toward white so it reads as a subtle color GRADE
    // on top of the original road/building photo textures instead of a hard
    // multiply that washes the texture out into a flat cartoon color. amount
    // 0 = no tint (pure original texture), 1 = full theme color (old
    // behavior). Keeping this low is what keeps the original texture detail
    // (concrete grain, panel seams, window glass) visible per track while
    // still giving every track its own color identity.
    function tintTowardsWhite(colorHex, amount) {
        var r = (colorHex >> 16) & 0xff, g = (colorHex >> 8) & 0xff, b = colorHex & 0xff;
        var nr = Math.round(255 * (1 - amount) + r * amount);
        var ng = Math.round(255 * (1 - amount) + g * amount);
        var nb = Math.round(255 * (1 - amount) + b * amount);
        return (nr << 16) | (ng << 8) | nb;
    }

    // ---- Procedural buildings: cheap, camera-facing-agnostic city skyline ----
    // The original Cityscape track surrounds its road with hand-modeled
    // skyscrapers (scrapers1/scrapers2 geometries). Those meshes are baked
    // to that one specific track layout and can't be reused as-is on a
    // different path, so here every building is a simple box, textured with
    // the SAME original scraper photo textures (not a flat color), scattered
    // along this track's own generated path. Two merged THREE.Geometry
    // objects (one per texture) keep the whole skyline to two draw calls
    // no matter how many buildings are placed.
    function buildBuildingsMeshes(layout, materialA, materialB, seed) {
        var rng = makeRng((seed * 104729 + 7) >>> 0);
        var path = layout.path;
        var n = path.length;

        var geoA = new THREE.Geometry();
        var geoB = new THREE.Geometry();

        function addBuilding(geo, cx, cz, groundY, halfW, halfD, height, angle) {
            var v0 = geo.vertices.length;
            var cosA = Math.cos(angle), sinA = Math.sin(angle);
            function rot(x, z) { return { x: cx + x * cosA - z * sinA, z: cz + x * sinA + z * cosA }; }
            var c0 = rot(-halfW, -halfD), c1 = rot(halfW, -halfD), c2 = rot(halfW, halfD), c3 = rot(-halfW, halfD);
            var corners = [c0, c1, c2, c3];
            for (var k = 0; k < 4; k++) geo.vertices.push(new THREE.Vector3(corners[k].x, groundY, corners[k].z));
            for (k = 0; k < 4; k++) geo.vertices.push(new THREE.Vector3(corners[k].x, groundY + height, corners[k].z));

            var sideIdx = [[0, 1], [1, 2], [2, 3], [3, 0]];
            for (var s = 0; s < 4; s++) {
                var a = v0 + sideIdx[s][0], b = v0 + sideIdx[s][1];
                var at = a + 4, bt = b + 4;
                geo.faces.push(new THREE.Face3(a, b, bt), new THREE.Face3(a, bt, at));
                geo.faceVertexUvs[0].push(
                    [new THREE.UV(0, 0), new THREE.UV(1, 0), new THREE.UV(1, 1)],
                    [new THREE.UV(0, 0), new THREE.UV(1, 1), new THREE.UV(0, 1)]
                );
            }
            // roof cap so nothing looks hollow from the chase camera on hills
            geo.faces.push(new THREE.Face3(v0 + 4, v0 + 5, v0 + 6), new THREE.Face3(v0 + 4, v0 + 6, v0 + 7));
            geo.faceVertexUvs[0].push(
                [new THREE.UV(0, 0), new THREE.UV(1, 0), new THREE.UV(1, 1)],
                [new THREE.UV(0, 0), new THREE.UV(1, 1), new THREE.UV(0, 1)]
            );
        }

        // Sample roughly ~90 slots around the loop regardless of how many
        // spline points it has, then randomly skip some for natural gaps.
        var slotStep = Math.max(1, Math.floor(n / 90));
        for (var i = 0; i < n; i += slotStep) {
            var p = path[i];
            for (var side = -1; side <= 1; side += 2) {
                if (rng() < 0.4) continue; // leave gaps, not a solid wall of buildings
                var setback = layout.halfWidth + 24 + rng() * 100;
                var bx = p.x + p.normal.x * setback * side;
                var bz = p.z + p.normal.z * setback * side;
                var halfW = 14 + rng() * 22;
                var halfD = 14 + rng() * 22;
                var height = 55 + rng() * 230;
                var angle = Math.atan2(p.tangent.x, p.tangent.z);
                var geo = rng() < 0.5 ? geoA : geoB;
                // This is a flyover circuit, not a street-level one -- the
                // road sits high above the city, not among its rooftops.
                // Drop every building's base well below the road surface
                // (with some per-building variety) so the skyline reads as
                // a city seen from above, the way the original track does,
                // instead of buildings sprouting from the same ground plane
                // the ship drives on.
                var cityDrop = 300 + rng() * 120;
                addBuilding(geo, bx, bz, p.height - cityDrop, halfW, halfD, height, angle);
            }
        }

        var meshes = [];
        [[geoA, materialA], [geoB, materialB]].forEach(function(pair) {
            var geo = pair[0], mat = pair[1];
            if (geo.vertices.length === 0) return;
            geo.computeFaceNormals();
            geo.computeBoundingSphere();
            var mesh = new THREE.Mesh(geo, mat);
            mesh.doubleSided = true;
            mesh.frustumCulled = false;
            meshes.push(mesh);
        });
        return meshes;
    }

    // ---- Cloud layer: sells the "flyover high above the city" read ----
    // Camera-facing sprites (not meshes -- no geometry/tangent risk at all),
    // using the game's own existing soft particle cloud texture. First cut
    // of this scattered clouds from near the track center outward at a big
    // scale, which put many large semi-transparent sprites close enough to
    // the camera (and stacked enough in the same view direction) that their
    // blending accumulated into a near-total white screen wash instead of a
    // background cloud layer -- the opposite of the intended effect. Fixed
    // by keeping every cloud small, low-opacity, spaced evenly by angle
    // (never randomly clustered in one direction), and pushed out past the
    // building field, so they read as a distant bank under the horizon
    // rather than fog wrapped around the camera.
    function buildCloudLayer(layout, cloudTexture, seed) {
        var group = new THREE.Object3D();
        if (!cloudTexture) return group;

        var rng = makeRng((seed * 40503 + 17) >>> 0);
        var outerRadius = layout.maxRadiusEstimate * 1.5;
        var count = 20;

        for (var i = 0; i < count; i++) {
            // Evenly spaced around the loop with a little jitter, NOT fully
            // random -- that's what previously let several big sprites land
            // in the same view direction and stack into an opaque wall.
            var ang = (i / count) * Math.PI * 2 + (rng() - 0.5) * (Math.PI * 2 / count) * 0.6;
            var rr = outerRadius * (0.85 + rng() * 0.3); // stay past the building field
            var x = Math.cos(ang) * rr;
            var z = Math.sin(ang) * rr;
            // Just below the road, well above the dropped-down buildings --
            // a visible layer you're flying over, not a fog bank around you.
            var y = -90 - rng() * 70;

            var sprite = new THREE.Sprite({
                map: cloudTexture,
                color: 0xffffff,
                blending: THREE.NormalBlending,
                useScreenCoordinates: false
            });
            sprite.opacity = 0.22 + rng() * 0.16;
            var scale = 110 + rng() * 90;
            sprite.scale.set(scale, scale * (0.45 + rng() * 0.2), 1);
            sprite.position.set(x, y, z);
            group.add(sprite);
        }

        return group;
    }

    // A second, much less fragile piece of the same "flying above clouds"
    // read: one big flat plane, textured with the same cloud puff image
    // tiled across it (not stretched -- cloud.png is a clean 256x256 power-
    // of-two texture, so RepeatWrapping tiles it cleanly), sitting below
    // even the lowest dropped building. A single mesh with one opacity
    // value can't stack into a whiteout the way many overlapping sprites
    // did, so this is the safe way to guarantee a visible cloud layer shows
    // up in the gaps between buildings and past the horizon, regardless of
    // which way a given track's start line happens to face.
    function buildCloudFloor(layout, cloudTexture) {
        if (!cloudTexture) return null;
        cloudTexture.wrapS = cloudTexture.wrapT = THREE.RepeatWrapping;
        cloudTexture.needsUpdate = true;

        var size = layout.maxRadiusEstimate * 3.6;
        var repeats = 7;
        var geo = new THREE.PlaneGeometry(size, size, 1, 1);
        geo.faceVertexUvs[0].forEach(function(uvSet) {
            uvSet.forEach(function(uv) { uv.u *= repeats; uv.v *= repeats; });
        });
        geo.computeFaceNormals();
        geo.computeBoundingSphere();

        var material = new THREE.MeshBasicMaterial({
            map: cloudTexture,
            color: 0xffffff,
            transparent: true,
            opacity: 0.5,
            depthWrite: false
        });
        var mesh = new THREE.Mesh(geo, material);
        mesh.doubleSided = true;
        mesh.frustumCulled = false;
        // Sits below the deepest building base (buildings bottom out around
        // -300 to -420 relative to the road, see buildBuildingsMeshes).
        mesh.position.y = -480;
        return mesh;
    }

    // ---- Build a drivable ribbon mesh (old three.js r50 Geometry API: vertices/faces, no BufferGeometry) ----
    // The road and walls are textured with HexGL's own original diffuse
    // images (see buildProcedural below), tiled along the path using real
    // arc length so the texture repeats at a consistent scale regardless of
    // how long an individual track's loop is, instead of stretching one
    // repeat across the whole thing. Bright edge-stripe geometry is layered
    // on top for navigation contrast, since a track's road color can still
    // occasionally read close to its sky color from a distance.
    function buildRibbonMesh(layout, trackMaterial, wallMaterial, stripeMaterial, tileLength) {
        var path = layout.path;
        var n = path.length;
        var hw = layout.halfWidth;
        var stripeWidth = Math.min(7, hw * 0.16);
        var stripeLift = 0.4; // avoid z-fighting with the main surface
        var uRepeatsAcrossWidth = Math.max(1, Math.round((hw * 2) / tileLength));

        var geo = new THREE.Geometry();
        var wallGeo = new THREE.Geometry();
        var stripeGeo = new THREE.Geometry();
        // Low guardrail-height, not a tall canyon wall -- the original
        // Cityscape track is an open elevated road with the city and sky
        // visible around it, not a walled-in tunnel. A short edge barrier
        // keeps the collision boundary readable without enclosing the view.
        var wallHeight = 5;

        for (var i = 0; i < n; i++) {
            var p = path[i];
            var lx = p.x + p.normal.x * hw, lz = p.z + p.normal.z * hw;
            var rx = p.x - p.normal.x * hw, rz = p.z - p.normal.z * hw;
            var lix = p.x + p.normal.x * (hw - stripeWidth), liz = p.z + p.normal.z * (hw - stripeWidth);
            var rix = p.x - p.normal.x * (hw - stripeWidth), riz = p.z - p.normal.z * (hw - stripeWidth);

            geo.vertices.push(new THREE.Vector3(lx, p.height, lz));   // 2*i
            geo.vertices.push(new THREE.Vector3(rx, p.height, rz));   // 2*i+1

            wallGeo.vertices.push(new THREE.Vector3(lx, p.height, lz));            // 4*i
            wallGeo.vertices.push(new THREE.Vector3(lx, p.height + wallHeight, lz)); // 4*i+1
            wallGeo.vertices.push(new THREE.Vector3(rx, p.height, rz));            // 4*i+2
            wallGeo.vertices.push(new THREE.Vector3(rx, p.height + wallHeight, rz)); // 4*i+3

            // 4 verts/sample: leftOuter, leftInner, rightInner, rightOuter (all lifted slightly)
            stripeGeo.vertices.push(new THREE.Vector3(lx, p.height + stripeLift, lz));   // 4*i
            stripeGeo.vertices.push(new THREE.Vector3(lix, p.height + stripeLift, liz)); // 4*i+1
            stripeGeo.vertices.push(new THREE.Vector3(rix, p.height + stripeLift, riz)); // 4*i+2
            stripeGeo.vertices.push(new THREE.Vector3(rx, p.height + stripeLift, rz));   // 4*i+3
        }

        for (i = 0; i < n; i++) {
            var a = 2 * i, b = 2 * i + 1;
            var c = 2 * ((i + 1) % n), d = 2 * ((i + 1) % n) + 1;

            // v tiles along real arc length (not 0..1 over the whole loop),
            // so the road texture repeats at a consistent world-space scale
            // on every track regardless of that track's total length.
            var arcI = path[i].arc / tileLength;
            var arcNext = (i === n - 1 ? (path[i].arc + (path[0].arc + layout.totalLength - path[i].arc)) : path[i + 1].arc) / tileLength;
            var f1 = new THREE.Face3(a, b, d);
            var f2 = new THREE.Face3(a, d, c);
            geo.faces.push(f1, f2);
            geo.faceVertexUvs[0].push(
                [new THREE.UV(0, arcI), new THREE.UV(uRepeatsAcrossWidth, arcI), new THREE.UV(uRepeatsAcrossWidth, arcNext)],
                [new THREE.UV(0, arcI), new THREE.UV(uRepeatsAcrossWidth, arcNext), new THREE.UV(0, arcNext)]
            );

            var la = 4 * i, lb = 4 * i + 1, ra = 4 * i + 2, rb = 4 * i + 3;
            var lc = 4 * ((i + 1) % n), ld = 4 * ((i + 1) % n) + 1;
            var rc = 4 * ((i + 1) % n) + 2, rd = 4 * ((i + 1) % n) + 3;

            // left wall (facing inward)
            wallGeo.faces.push(new THREE.Face3(la, lb, ld), new THREE.Face3(la, ld, lc));
            // right wall (facing inward)
            wallGeo.faces.push(new THREE.Face3(ra, rc, rd), new THREE.Face3(ra, rd, rb));
            wallGeo.faceVertexUvs[0].push(
                [new THREE.UV(arcI, 0), new THREE.UV(arcI, 1), new THREE.UV(arcNext, 1)],
                [new THREE.UV(arcI, 0), new THREE.UV(arcNext, 1), new THREE.UV(arcNext, 0)],
                [new THREE.UV(arcI, 0), new THREE.UV(arcI, 1), new THREE.UV(arcNext, 1)],
                [new THREE.UV(arcI, 0), new THREE.UV(arcNext, 1), new THREE.UV(arcNext, 0)]
            );

            // Edge stripes: leftOuter(0)-leftInner(1) strip, rightInner(2)-rightOuter(3) strip
            var sa = 4 * i, sb = 4 * i + 1, sc = 4 * i + 2, sd = 4 * i + 3;
            var sna = 4 * ((i + 1) % n), snb = 4 * ((i + 1) % n) + 1;
            var snc = 4 * ((i + 1) % n) + 2, snd = 4 * ((i + 1) % n) + 3;
            stripeGeo.faces.push(
                new THREE.Face3(sa, sb, snb), new THREE.Face3(sa, snb, sna),   // left stripe
                new THREE.Face3(sc, sd, snd), new THREE.Face3(sc, snd, snc)    // right stripe
            );
            stripeGeo.faceVertexUvs[0].push(
                [new THREE.UV(0, 0), new THREE.UV(1, 0), new THREE.UV(1, 1)],
                [new THREE.UV(0, 0), new THREE.UV(1, 1), new THREE.UV(0, 1)],
                [new THREE.UV(0, 0), new THREE.UV(1, 0), new THREE.UV(1, 1)],
                [new THREE.UV(0, 0), new THREE.UV(1, 1), new THREE.UV(0, 1)]
            );
        }

        geo.computeFaceNormals();
        wallGeo.computeFaceNormals();
        stripeGeo.computeFaceNormals();

        // THREE.Mesh defaults to frustumCulled=true, and this three.js
        // build's frustum test dereferences geometry.boundingSphere
        // unconditionally -- which is null until this is called. Belt and
        // suspenders: compute it AND disable frustumCulled, since these
        // meshes are small enough that culling buys nothing anyway.
        geo.computeBoundingSphere();
        wallGeo.computeBoundingSphere();
        stripeGeo.computeBoundingSphere();

        var trackMesh = new THREE.Mesh(geo, trackMaterial);
        trackMesh.doubleSided = true;
        trackMesh.frustumCulled = false;
        var wallMesh = new THREE.Mesh(wallGeo, wallMaterial);
        wallMesh.doubleSided = true;
        wallMesh.frustumCulled = false;
        var stripeMesh = new THREE.Mesh(stripeGeo, stripeMaterial);
        stripeMesh.doubleSided = true;
        stripeMesh.frustumCulled = false;

        return { trackMesh: trackMesh, wallMesh: wallMesh, stripeMesh: stripeMesh };
    }

    // ---- Public factory: build a full track object for bkcore.hexgl.tracks[id] ----
    bkcore.hexgl.tracks.buildProcedural = function(theme, cityscape) {
        var CANVAS_SIZE = 2048;
        var WORLD_SPAN = 6000;

        return {
            lib: null,
            materials: {},
            name: theme.name,
            laps: theme.laps,
            analyser: null,
            pixelRatio: WORLD_SPAN > 0 ? CANVAS_SIZE / WORLD_SPAN : 1,

            // Ship model / skybox / HUD / audio are layout-independent: reuse Cityscape's loader.
            load: cityscape.load,
            buildMaterials: cityscape.buildMaterials,

            buildScenes: function(display, quality) {
                var self = this;
                var layout = generateLayout(theme.seed);
                var maps = rasterizeMaps(layout, CANVAS_SIZE, WORLD_SPAN);

                // spawn at checkpoint 0, facing the path's tangent direction there
                var startIdx = layout.checkpoints[0];
                var startPt = layout.path[startIdx];
                this.spawn = { x: startPt.x, y: startPt.height + 12, z: startPt.z };
                // Identity: the path was pre-rotated in generateLayout() so the
                // start tangent already points along world +Z, which is this
                // engine's fixed default forward direction under no rotation.
                this.spawnRotation = { x: 0, y: 0, z: 0 };

                this.checkpoints = {
                    list: layout.checkpoints.map(function(_, idx) { return idx; }),
                    start: 0,
                    last: layout.checkpoints.length - 1
                };

                // --- SKYBOX (same approach as Cityscape.buildScenes) ---
                var sceneCube = new THREE.Scene();
                var cameraCube = new THREE.PerspectiveCamera(70, display.width / display.height, 1, 6000);
                sceneCube.add(cameraCube);

                // Tint the skybox photo per theme so each track's background
                // actually looks different (not just the fog/ground). The
                // stock "cube" shader samples the cubemap with no color
                // control at all, so this is a small custom fragment shader
                // -- same vertex shader and tCube/tFlip uniforms, plus one
                // more uniform that multiplies the sampled color. Lifted
                // toward white (never below ~0.35 per channel) so it reads as
                // a color grade on the same sunset photo, not a black filter.
                var skyshader = THREE.ShaderUtils.lib["cube"];
                skyshader.uniforms["tCube"].texture = this.lib.get("texturesCube", "skybox.dawnclouds");
                var tintR = 0.35 + 0.65 * (((theme.fogColor >> 16) & 0xff) / 255);
                var tintG = 0.35 + 0.65 * (((theme.fogColor >> 8) & 0xff) / 255);
                var tintB = 0.35 + 0.65 * ((theme.fogColor & 0xff) / 255);
                var tintedUniforms = {
                    tCube: skyshader.uniforms.tCube,
                    tFlip: skyshader.uniforms.tFlip,
                    tintColor: { type: 'c', value: new THREE.Color(0).setRGB(tintR, tintG, tintB) }
                };
                var tintedFragmentShader = [
                    'uniform samplerCube tCube;',
                    'uniform float tFlip;',
                    'uniform vec3 tintColor;',
                    'varying vec3 vViewPosition;',
                    'void main() {',
                    'vec3 wPos = cameraPosition - vViewPosition;',
                    'vec4 texel = textureCube( tCube, vec3( tFlip * wPos.x, wPos.yz ) );',
                    'gl_FragColor = vec4( texel.rgb * tintColor, texel.a );',
                    '}'
                ].join('\n');
                var skymaterial = new THREE.ShaderMaterial({
                    fragmentShader: tintedFragmentShader,
                    vertexShader: skyshader.vertexShader,
                    uniforms: tintedUniforms,
                    depthWrite: false
                });
                var skymesh = new THREE.Mesh(new THREE.CubeGeometry(100, 100, 100), skymaterial);
                skymesh.flipSided = true;
                sceneCube.add(skymesh);
                display.manager.add("sky", sceneCube, cameraCube);

                // --- MAIN SCENE ---
                var ambient = 0xbbbbbb, diffuse = 0xffffff;
                var camera = new THREE.PerspectiveCamera(70, display.width / display.height, 1, 60000);
                // CRITICAL: this three.js build's Object3D.updateMatrix() rebuilds
                // the local matrix from the (Euler) .rotation property every time
                // updateMatrixWorld() runs -- which happens every frame, since the
                // camera is added to the scene and WebGLRenderer.render() calls
                // scene.updateMatrixWorld(), which recurses into the camera. That
                // clobbers the matrix camera.lookAt() just computed, rebuilding it
                // from a *decomposed* Euler angle triple instead. The decomposition
                // is not guaranteed to round-trip back to the same matrix, and it
                // provably doesn't here: aligning the track's start tangent exactly
                // to +Z (see generateLayout) puts the chase camera's look direction
                // exactly in the YZ plane, a degenerate case where the Euler
                // round-trip produces a genuinely different (wrong) orientation --
                // that's what was pointing the camera into empty space every frame.
                // Disabling matrixAutoUpdate stops the rebuild-from-Euler step, so
                // camera.matrix keeps exactly what lookAt() set; matrixWorldNeedsUpdate
                // is forced true each frame (see the render loop below) so the world
                // matrix still refreshes from that correct local matrix.
                camera.matrixAutoUpdate = false;
                var scene = new THREE.Scene();
                scene.add(camera);
                scene.add(new THREE.AmbientLight(ambient));

                var sun = new THREE.DirectionalLight(diffuse, 1.5, 30000);
                sun.position.set(-4000, 1200, 1800);
                sun.lookAt(new THREE.Vector3());
                scene.add(sun);

                // --- SHIP ---
                var ship = display.createMesh(scene, this.lib.get("geometries", "ship.feisar"), this.spawn.x, this.spawn.y + 5, this.spawn.z, this.materials.ship);

                var booster = display.createMesh(ship, this.lib.get("geometries", "booster"), 0, 0.665, -3.8, this.materials.booster);
                booster.depthWrite = false;

                var boosterSprite = new THREE.Sprite({
                    map: this.lib.get("textures", "booster.sprite"),
                    blending: THREE.AdditiveBlending,
                    useScreenCoordinates: false,
                    color: 0xffffff
                });
                boosterSprite.scale.set(0.02, 0.02, 0.02);
                boosterSprite.mergeWith3D = false;
                booster.add(boosterSprite);

                var boosterLight = new THREE.PointLight(0x00a2ff, 4.0, 60);
                boosterLight.position.set(0, 0.665, -4);
                if (quality > 0) ship.add(boosterLight);

                // --- SHIP CONTROLS: point collision/height at our generated maps ---
                var shipControls = new bkcore.hexgl.ShipControls(display);
                shipControls.collisionMap = new bkcore.ImageData(maps.collisionDataURL, function() {
                    shipControls.collisionMap.loaded = true;
                });
                shipControls.collisionPixelRatio = maps.pixelRatio;
                shipControls.collisionDetection = true;
                shipControls.heightMap = new bkcore.ImageData(maps.heightDataURL, function() {
                    shipControls.heightMap.loaded = true;
                });
                shipControls.heightPixelRatio = maps.pixelRatio;
                shipControls.heightBias = 0.0;
                shipControls.heightScale = 1.0;
                shipControls.control(ship);
                display.components.shipControls = shipControls;
                display.tweakShipControls();

                // Gameplay reads its own checkpoint analyser off the collision map (same image the ship uses).
                this.analyser = shipControls.collisionMap;

                // --- SHIP EFFECTS ---
                var fxParams = {
                    scene: scene,
                    shipControls: shipControls,
                    booster: booster,
                    boosterSprite: boosterSprite,
                    boosterLight: boosterLight,
                    useParticles: false
                };
                if (quality > 2) {
                    fxParams.textureCloud = this.lib.get("textures", "cloud");
                    fxParams.textureSpark = this.lib.get("textures", "spark");
                    fxParams.useParticles = true;
                }
                display.components.shipEffects = new bkcore.hexgl.ShipEffects(fxParams);

                // --- PROCEDURAL TRACK MESH ---
                // Use HexGL's own original road/building textures (not flat
                // colors) so the track reads as "the original game", tiled
                // along real arc length so the repeat scale looks right
                // regardless of a given track's total loop length. Each
                // theme tints its own road/wall color on top of the same
                // shared texture (multiply), which is how the game already
                // reads as "different track, same visual language" rather
                // than 50 unrelated art styles.
                var TILE_LENGTH = 90; // world units per texture repeat
                var roadTexture = this.lib.get("textures", "track.cityscape.diffuse");
                var wallTexture = this.lib.get("textures", "track.cityscape.scrapers1.diffuse");
                // NPOT textures (this build's HIGH-quality scrapers art isn't
                // power-of-two) can't tile with REPEAT under WebGL1 -- fall
                // back to the always-POT road texture for walls too rather
                // than risk a silently-clamped, stretched-looking wall.
                var wallTexIsPOT = wallTexture && wallTexture.image &&
                    (wallTexture.image.width & (wallTexture.image.width - 1)) === 0 &&
                    (wallTexture.image.height & (wallTexture.image.height - 1)) === 0;
                if (!wallTexIsPOT) wallTexture = roadTexture;
                if (roadTexture) { roadTexture.wrapS = roadTexture.wrapT = THREE.RepeatWrapping; roadTexture.needsUpdate = true; }
                if (wallTexture) { wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping; wallTexture.needsUpdate = true; }

                // Tint LIGHTLY (not a full-strength color multiply) so the
                // actual original road/building photo texture still reads as
                // itself -- a hard multiply here is what was making every
                // track look like a flat recolored cutout instead of the
                // original game's textured city. The theme identity now
                // comes through as a color grade plus the tinted skybox,
                // fog, and boost/heal pad colors, not by erasing the texture.
                var trackTint = tintTowardsWhite(theme.trackColor, 0.22);
                var wallTint = tintTowardsWhite(theme.sceneryColor, 0.28);
                var trackMaterial = new THREE.MeshBasicMaterial({ map: roadTexture, color: trackTint, wireframe: !!theme.wireframe });
                var wallMaterial = new THREE.MeshBasicMaterial({ map: wallTexture, color: wallTint, wireframe: !!theme.wireframe });

                // Edge stripes need to read clearly against THIS theme's sky/fog
                // color specifically (a fixed white or fixed dark color would fail
                // for some of the 50 themes -- e.g. white stripes vanish against
                // Arctic Frost's near-white fog). Pick white or near-black by the
                // fog color's perceived luminance so it always contrasts.
                var fr = (theme.fogColor >> 16) & 0xff, fg = (theme.fogColor >> 8) & 0xff, fb = theme.fogColor & 0xff;
                var fogLuminance = 0.299 * fr + 0.587 * fg + 0.114 * fb;
                var stripeColor = fogLuminance > 150 ? 0x101010 : 0xffffff;
                var stripeMaterial = new THREE.MeshBasicMaterial({ color: stripeColor });
                var built = buildRibbonMesh(layout, trackMaterial, wallMaterial, stripeMaterial, TILE_LENGTH);
                scene.add(built.trackMesh);
                scene.add(built.wallMesh);
                scene.add(built.stripeMesh);

                // --- BUILDINGS: real scraper photo textures (same art the
                // original Cityscape uses for its skyscrapers) scattered
                // along this track's own generated path, tinted to match
                // the theme the same light way as the road/walls. Two
                // textures (scrapers1/scrapers2) alternate per building for
                // the same "not one repeated building" variety the original
                // scene has. ---
                var scraperTexA = this.lib.get("textures", "track.cityscape.scrapers1.diffuse");
                var scraperTexB = this.lib.get("textures", "track.cityscape.scrapers2.diffuse");
                var buildingTint = tintTowardsWhite(theme.sceneryColor, 0.3);
                var buildingMatA = new THREE.MeshBasicMaterial({ map: scraperTexA || wallTexture, color: buildingTint, wireframe: !!theme.wireframe });
                var buildingMatB = new THREE.MeshBasicMaterial({ map: scraperTexB || wallTexture, color: buildingTint, wireframe: !!theme.wireframe });
                buildBuildingsMeshes(layout, buildingMatA, buildingMatB, theme.seed).forEach(function(mesh) {
                    scene.add(mesh);
                });

                // --- CLOUD LAYER: sits between the road and the dropped-down
                // city below, so the track reads as a flyover high above the
                // clouds rather than a road sitting on the ground next to the
                // skyline. ---
                var cloudTexture = this.lib.get("textures", "cloud");
                scene.add(buildCloudLayer(layout, cloudTexture, theme.seed));
                var cloudFloor = buildCloudFloor(layout, cloudTexture);
                if (cloudFloor) scene.add(cloudFloor);

                // --- BOOST PADS & HEAL PAD: visible markers using the game's
                // own original bonus-pad art (materials.bonusBase / bonusSpeed),
                // placed at the layout's generated pad locations. ---
                var padMaterial = this.materials.bonusBase || new THREE.MeshBasicMaterial({ color: 0x888888 });
                var boostGlowMaterial = this.materials.bonusSpeed || new THREE.MeshBasicMaterial({ color: 0x0096ff });
                var healGlowMaterial = new THREE.MeshBasicMaterial({ color: 0x33ff88 });

                function makePad(p, glowMaterial) {
                    // Same frustumCulled/boundingSphere issue as the ribbon mesh
                    // (see buildRibbonMesh) applies to any THREE.Mesh here too --
                    // disable culling outright rather than risk it silently
                    // vanishing again.
                    var group = new THREE.Object3D();
                    var baseGeo = new THREE.CubeGeometry(hwPadSize(layout), 1.2, hwPadSize(layout));
                    baseGeo.computeBoundingSphere();
                    var base = new THREE.Mesh(baseGeo, padMaterial);
                    base.position.set(p.x, p.height + 0.6, p.z);
                    base.frustumCulled = false;
                    var glowGeo = new THREE.CubeGeometry(hwPadSize(layout) * 0.7, 2.2, hwPadSize(layout) * 0.7);
                    glowGeo.computeBoundingSphere();
                    var glow = new THREE.Mesh(glowGeo, glowMaterial);
                    glow.position.set(p.x, p.height + 1.6, p.z);
                    glow.frustumCulled = false;
                    group.add(base);
                    group.add(glow);
                    return group;
                }
                function hwPadSize(l) { return Math.min(18, l.halfWidth * 0.4); }

                layout.boostPads.forEach(function(idx) {
                    scene.add(makePad(layout.path[idx], boostGlowMaterial));
                });

                // One randomized, single-use heal/shield pad per track. "Single
                // use" is enforced at runtime below (see render loop): once the
                // ship passes through it once, it won't heal again this race.
                var healIdx = layout.healPadIndex;
                var healPadMesh = null;
                var healUsed = false;
                if (healIdx != null) {
                    healPadMesh = makePad(layout.path[healIdx], healGlowMaterial);
                    scene.add(healPadMesh);
                }

                // --- MINIMAP (top-right, drawn each frame in the render loop below) ---
                var minimapSize = 150;
                var minimapCanvas = document.createElement('canvas');
                minimapCanvas.width = minimapSize;
                minimapCanvas.height = minimapSize;
                // index.html has a global `canvas { width: 100% }` rule meant
                // for the main WebGL canvas -- it also matches this minimap
                // canvas and was blowing it up to fill most of the screen.
                // Explicit inline width/height (higher specificity than the
                // stylesheet rule) pins it back to its real size.
                minimapCanvas.style.position = 'absolute';
                minimapCanvas.style.top = '14px';
                minimapCanvas.style.right = '14px';
                minimapCanvas.style.width = minimapSize + 'px';
                minimapCanvas.style.height = minimapSize + 'px';
                minimapCanvas.style.zIndex = '9998';
                minimapCanvas.style.borderRadius = '50%';
                minimapCanvas.style.border = '2px solid rgba(255,255,255,0.55)';
                minimapCanvas.style.background = 'rgba(0,0,0,0.4)';
                minimapCanvas.style.pointerEvents = 'none';
                (display.containers.overlay || document.body).appendChild(minimapCanvas);
                var minimapCtx = minimapCanvas.getContext('2d');

                // Precompute the track's screen-space points once -- the loop
                // shape itself never changes, only the ship marker moves.
                var mmMinX = Infinity, mmMaxX = -Infinity, mmMinZ = Infinity, mmMaxZ = -Infinity;
                for (i = 0; i < layout.path.length; i++) {
                    mmMinX = Math.min(mmMinX, layout.path[i].x); mmMaxX = Math.max(mmMaxX, layout.path[i].x);
                    mmMinZ = Math.min(mmMinZ, layout.path[i].z); mmMaxZ = Math.max(mmMaxZ, layout.path[i].z);
                }
                var mmSpan = Math.max(mmMaxX - mmMinX, mmMaxZ - mmMinZ) || 1;
                var mmPad = minimapSize * 0.14;
                var mmScale = (minimapSize - mmPad * 2) / mmSpan;
                var mmOffX = (minimapSize - (mmMaxX - mmMinX) * mmScale) / 2;
                var mmOffZ = (minimapSize - (mmMaxZ - mmMinZ) * mmScale) / 2;
                function mmProject(x, z) {
                    return {
                        x: (x - mmMinX) * mmScale + mmOffX,
                        y: (z - mmMinZ) * mmScale + mmOffZ
                    };
                }
                var mmPathPx = layout.path.map(function(p) { return mmProject(p.x, p.z); });

                function drawMinimap(shipX, shipZ) {
                    minimapCtx.clearRect(0, 0, minimapSize, minimapSize);
                    minimapCtx.lineWidth = 3;
                    minimapCtx.strokeStyle = 'rgba(255,255,255,0.85)';
                    minimapCtx.beginPath();
                    for (var k = 0; k <= mmPathPx.length; k++) {
                        var pt = mmPathPx[k % mmPathPx.length];
                        if (k === 0) minimapCtx.moveTo(pt.x, pt.y); else minimapCtx.lineTo(pt.x, pt.y);
                    }
                    minimapCtx.closePath();
                    minimapCtx.stroke();

                    // Boost/heal pad locations are intentionally NOT marked
                    // here -- the original track never telegraphed its power-up
                    // spot on a map either, you found it (or didn't) by
                    // learning the circuit. The pads are still clearly
                    // visible in-world when you're actually on top of them
                    // (see makePad() below); the minimap just shows the loop
                    // shape and where you are on it, like the original.

                    // ship marker
                    var sp = mmProject(shipX, shipZ);
                    minimapCtx.fillStyle = '#ff6a3d';
                    minimapCtx.beginPath();
                    minimapCtx.arc(sp.x, sp.y, 5, 0, Math.PI * 2);
                    minimapCtx.fill();
                }

                // --- CAMERA ---
                display.components.cameraChase = new bkcore.hexgl.CameraChase({
                    target: ship,
                    camera: camera,
                    cameraCube: display.manager.get("sky").camera,
                    lerp: 0.5,
                    yoffset: 8.0,
                    zoffset: 10.0,
                    viewOffset: 10.0
                });

                display.manager.add("game", scene, camera, function(delta, renderer) {
                    if (delta > 25 && this.objects.lowFPS < 1000) this.objects.lowFPS++;
                    var dt = delta / 16.6;
                    this.objects.components.shipControls.update(dt);
                    this.objects.components.shipEffects.update(dt);
                    this.objects.components.cameraChase.update(dt, this.objects.components.shipControls.getSpeedRatio());

                    // Single-use heal pad: proximity check against the ship's
                    // current position (kept simple -- flat-plane XZ distance --
                    // rather than sampling another bitmap channel like boost
                    // pads do). Once triggered, hide the marker and never heal
                    // again this race.
                    if (healIdx != null && !healUsed) {
                        var shipPos = this.objects.components.shipControls.dummy.position;
                        var healPt = layout.path[healIdx];
                        var hdx = shipPos.x - healPt.x, hdz = shipPos.z - healPt.z;
                        if (Math.sqrt(hdx * hdx + hdz * hdz) < hwPadSize(layout) * 1.6) {
                            this.objects.components.shipControls.shield = this.objects.components.shipControls.maxShield;
                            healUsed = true;
                            if (healPadMesh) healPadMesh.visible = false;
                        }
                    }
                    drawMinimap(this.objects.components.shipControls.dummy.position.x, this.objects.components.shipControls.dummy.position.z);
                    // camera.matrixAutoUpdate is disabled (see where `camera` is
                    // created) so updateMatrixWorld() won't rebuild the matrix from
                    // Euler .rotation -- but that also means the translation this
                    // engine's normal updateMatrix() would have written (matrix.
                    // setPosition(this.position)) never happens either, since
                    // lookAt()/Matrix4.lookAt() only ever touches the rotation part
                    // of the matrix. Write the translation back in ourselves, then
                    // force the world-matrix refresh from that now-complete matrix.
                    camera.matrix.setPosition(camera.position);
                    camera.matrixWorldNeedsUpdate = true;
                    this.objects.composers.game.render(dt);
                    if (this.objects.hud) this.objects.hud.update(
                        this.objects.components.shipControls.getRealSpeed(100),
                        this.objects.components.shipControls.getRealSpeedRatio(),
                        this.objects.components.shipControls.getShield(100),
                        this.objects.components.shipControls.getShieldRatio()
                    );
                    if (this.objects.components.shipControls.getShieldRatio() < 0.2)
                        this.objects.extras.vignetteColor.setHex(0x992020);
                    else
                        this.objects.extras.vignetteColor.setHex(theme.trackColor);
                }, {
                    components: display.components,
                    composers: display.composers,
                    extras: display.extras,
                    quality: quality,
                    hud: display.hud,
                    time: 0.0,
                    lowFPS: 0
                });

                // Apply fog / clear color for this theme now that the scene exists.
                if (display.renderer) {
                    if (typeof display.renderer.setClearColorHex === 'function') display.renderer.setClearColorHex(theme.fogColor, 1.0);
                    else if (typeof display.renderer.setClearColor === 'function') display.renderer.setClearColor(theme.fogColor, 1.0);
                }
                scene.fog = new THREE.Fog(theme.fogColor, theme.fogNear, theme.fogFar);
            }
        };
    };

    // expose internals for testing
    bkcore.hexgl.tracks._proceduralInternals = {
        makeRng: makeRng,
        generateLayout: generateLayout,
        rasterizeMaps: rasterizeMaps
    };
})();
