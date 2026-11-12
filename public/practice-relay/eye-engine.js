"use strict";
(() => {
  // src/practice-eye/living/curiousEyeShader.ts
  var EYE_VERTEX_SHADER = `
attribute vec2 aPosition;
varying vec2 vUv;

void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;
  var EYE_FRAGMENT_SHADER = `
precision highp float;

varying vec2 vUv;

uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uGaze;           // (gazeX, gazeY) in radians (+X right, +Y up)
uniform float uTorsion;       // iris cyclotorsion angle
uniform float uPupilRadius;   // ~0.14 .. 0.53
uniform float uPupilVel;      // rate of pupil change
uniform vec2 uPupilEcc;       // subtle organic pupil eccentricity
uniform float uFluidWobble;   // post-saccadic iridodonesis
uniform float uRipplePhase;
uniform float uRippleAmp;
uniform float uStromaTension;
uniform float uCuriosity;
uniform float uUncertainty;
uniform float uWonder;
uniform float uStartle;
uniform float uMacroZoom;
uniform float uTearWave;
uniform float uStarburst;
uniform vec2 uFocusPoint;
uniform float uFocusGlow;

#define PI 3.14159265359
#define TAU 6.28318530718

// Crisp sinless hashes for analog film grain & seamless polar fiber noise
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise2D(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// Seamless periodic noise around 0..2PI circle via 2D circle embedding
float periodicFiberNoise(float angle, float freq, float radialCoord, float seed) {
  vec2 circlePos = vec2(cos(angle), sin(angle)) * freq;
  return noise2D(circlePos + vec2(radialCoord * 2.2 + seed, seed * 1.7 - radialCoord * 1.8));
}

float periodicFiberFbm(float angle, float freq, float radialCoord, float seed) {
  float v = 0.0;
  float amp = 0.52;
  float f = freq;
  for (int i = 0; i < 4; i++) {
    vec2 cp = vec2(cos(angle), sin(angle)) * f;
    v += amp * noise2D(cp + vec2(radialCoord * (1.7 + float(i) * 0.85) + seed, seed * 2.1));
    f *= 2.04;
    amp *= 0.48;
  }
  return v;
}

// Anamorphic starburst flare matching the reference's blazing crimson-gold upper-rim highlight
vec3 computeStarburst(vec2 uvDelta, float intensity, float warmth) {
  // Primary spike tilted ~65 degrees (shooting far up-right into the red aura & grazing down-left onto iris)
  float angMain = 1.135;
  vec2 dir1 = vec2(cos(angMain), sin(angMain));
  vec2 dir2 = vec2(-sin(angMain), cos(angMain));

  vec2 q = vec2(dot(uvDelta, dir1), dot(uvDelta, dir2));
  float dist = length(uvDelta);

  // Blazing pinpoint white core + soft warm halo
  float core = exp(-dist * 38.0) * 1.65 + exp(-dist * 12.5) * 0.56;

  // Long needle-sharp primary spike (extended tail shooting upward-right!)
  float upRightReach = mix(0.55, 1.65, smoothstep(-0.12, 0.32, q.x));
  float ray1Width = 0.0022 + abs(q.x) * 0.013;
  float ray1 = exp(-abs(q.y) / ray1Width) * exp(-abs(q.x) * (2.05 / upRightReach));

  // Crisp perpendicular cross-spike
  float ray2Width = 0.0026 + abs(q.y) * 0.020;
  float ray2 = exp(-abs(q.x) / ray2Width) * exp(-abs(q.y) * 4.6) * 0.84;

  // Secondary subtle studio diffraction glints
  float angSub = angMain + 0.54;
  vec2 dSub = vec2(cos(angSub), sin(angSub));
  vec2 dSubP = vec2(-dSub.y, dSub.x);
  vec2 qSub = vec2(dot(uvDelta, dSub), dot(uvDelta, dSubP));
  float ray3 = exp(-abs(qSub.y) / (0.0032 + abs(qSub.x) * 0.028)) * exp(-abs(qSub.x) * 7.8) * 0.36;

  // Twin parallel corneal reflection filaments grazing down-left onto the iris rim (signature detail in reference!)
  float twinFilament = exp(-abs(q.y - 0.0085) / (0.0018 + abs(q.x) * 0.012)) *
                       smoothstep(0.01, -0.09, q.x) * exp(-abs(q.x) * 10.5) * 0.62;

  // Color gradient along spikes: pure white center -> golden apricot -> fiery crimson-red needle tip
  vec3 cCore = vec3(1.00, 0.99, 0.96);
  vec3 cMid  = vec3(1.00, 0.68, 0.30);
  vec3 cTail = mix(vec3(0.95, 0.11, 0.04), vec3(1.00, 0.34, 0.10), warmth * 0.55);

  float tailFactor = smoothstep(0.025, 0.32, dist);
  vec3 rayColor = mix(cMid, cTail, tailFactor);
  rayColor = mix(cCore, rayColor, smoothstep(0.0, 0.068, dist));

  vec3 total = cCore * core + rayColor * (ray1 * 1.42 + ray2 + ray3 + twinFilament);
  return total * intensity;
}

void main() {
  // Normalized aspect-corrected coordinates centered slightly below midpoint for tall starburst headroom
  float minDim = min(uResolution.x, uResolution.y);
  float isPortrait = step(uResolution.x, uResolution.y);
  vec2 centerOffset = vec2(0.0, mix(-0.036, -0.028, isPortrait));
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution.xy) / minDim - centerOffset;

  // Adaptive scale matching the vertical reference composition on portrait & breathing cleanly on desktop
  float baseScale = mix(0.292, 0.352, isPortrait);
  float eyeRadiusScreen = baseScale * uMacroZoom;
  vec2 q = p / eyeRadiusScreen; // Eyeball sphere radius = 1.0 in q-space

  // Tactile analog airbrush / macro film grain
  vec2 grainSeed = gl_FragCoord.xy + floor(uTime * 24.0) * vec2(19.3, 47.1);
  float liveGrain = hash12(grainSeed) - 0.5;
  float paperGrain = hash12(gl_FragCoord.xy * 0.9 + 13.7) - 0.5;
  float grain = liveGrain * 0.38 + paperGrain * 0.62;

  // =========================================================================
  // 1. RETRO-AIRBRUSH DUAL HALO ATMOSPHERE (GRAINY ORANGE TOP / CYAN BOTTOM)
  // =========================================================================
  vec3 bgVoid = vec3(0.076, 0.050, 0.086);

  vec2 auraShift = vec2(uGaze.x * 0.16, uGaze.y * 0.14);

  // Upper fiery orange-crimson diffused corona
  vec2 topCenter = vec2(0.02, 0.36) + auraShift * 0.55;
  vec2 dTop = (q - topCenter) * vec2(0.74, 0.85);
  float topDist = length(dTop);
  float topGlow = exp(-topDist * topDist * 1.15);

  // Bright eclipse crescent hugging the upper rim of the sphere (just like reference!)
  float upperCrescent = exp(-pow(max(0.0, length(q - vec2(0.0, 0.07)) - 0.90), 2.0) * 9.0) *
                        smoothstep(-0.25, 0.80, q.y);

  vec3 fieryRed  = vec3(0.75, 0.15, 0.05);
  vec3 fieryGold = vec3(1.00, 0.56, 0.17);
  vec3 topAuraCol = mix(fieryRed, fieryGold, smoothstep(0.16, 0.88, topGlow + upperCrescent * 0.5));
  float topStrength = (0.94 + 0.18 * uCuriosity + 0.14 * uWonder) * (topGlow * 0.92 + upperCrescent * 0.62);

  // Lower atmospheric cyan-teal-ochre glow
  vec2 botCenter = vec2(-0.02, -0.48) + auraShift * 0.45;
  vec2 dBot = (q - botCenter) * vec2(0.70, 0.82);
  float botDist = length(dBot);
  float botGlow = exp(-botDist * botDist * 1.02) * smoothstep(0.50, -0.35, q.y);

  // Warm muted amber-olive transition right beneath the lower sphere edge
  float underRimAmber = exp(-pow(length(q - vec2(0.0, -0.94)), 2.0) * 3.6) * smoothstep(-0.35, -1.35, q.y);

  vec3 tealDeep   = vec3(0.08, 0.35, 0.41);
  vec3 tealLumen  = vec3(0.24, 0.72, 0.76);
  vec3 ochreUnder = vec3(0.46, 0.44, 0.21);
  vec3 botAuraCol = mix(tealDeep, tealLumen, smoothstep(0.14, 0.80, botGlow));
  botAuraCol = mix(botAuraCol, ochreUnder, clamp(underRimAmber * 0.62, 0.0, 0.62));
  float botStrength = (0.88 + 0.24 * uUncertainty) * botGlow;

  vec3 bgCol = bgVoid + topAuraCol * topStrength + botAuraCol * botStrength;

  // Authentic stippled airbrush noise across the mid-tone gradients
  float haloDensity = clamp(topStrength + botStrength, 0.0, 1.25);
  bgCol += grain * (0.044 + 0.088 * haloDensity);

  // =========================================================================
  // 2. TRUE ORTHONORMAL 3D OCULAR GLOBE & RAISED CORNEAL REFRACTION
  // =========================================================================
  float r2 = dot(q, q);
  float rGlobe = sqrt(r2);
  vec3 finalColor = bgCol;

  // Subtle rim aura scattering right outside r = 1.0
  float rimScatter = exp(-abs(rGlobe - 1.0) * 11.5);
  vec3 rimScatterCol = mix(vec3(0.26, 0.58, 0.62), vec3(1.0, 0.50, 0.15), smoothstep(-0.65, 0.65, q.y));
  finalColor += rimScatterCol * rimScatter * 0.20;

  if (r2 < 1.0) {
    float zFront = sqrt(max(0.0, 1.0 - r2));
    vec3 worldPos = vec3(q.x, q.y, zFront);

    // Construct exact orthonormal 3D Eye Anatomical Basis (looking toward +uGaze.x right, +uGaze.y up)
    vec3 eyeForward = normalize(vec3(
      sin(uGaze.x) * cos(uGaze.y),
      sin(uGaze.y),
      cos(uGaze.x) * cos(uGaze.y)
    ));
    vec3 eyeRight0 = normalize(cross(vec3(0.0, 1.0, 0.0), eyeForward));
    vec3 eyeUp0 = cross(eyeForward, eyeRight0);

    float ct = cos(uTorsion), st = sin(uTorsion);
    vec3 eyeRight = eyeRight0 * ct + eyeUp0 * st;
    vec3 eyeUp    = -eyeRight0 * st + eyeUp0 * ct;

    // Express surface point & camera ray in the Eye's local anatomical space
    vec3 localSurface = vec3(
      dot(worldPos, eyeRight),
      dot(worldPos, eyeUp),
      dot(worldPos, eyeForward)
    );
    vec3 worldView = vec3(0.0, 0.0, -1.0);
    vec3 localView = vec3(
      dot(worldView, eyeRight),
      dot(worldView, eyeUp),
      dot(worldView, eyeForward)
    );

    // Subtle raised corneal cabochon bulge over the iris dome (r_local < 0.86)
    float localRad2D = length(localSurface.xy);
    float corneaDomeMask = smoothstep(0.90, 0.20, localRad2D);
    vec3 corneaNormalLocal = normalize(vec3(
      localSurface.xy * (1.0 + 0.22 * corneaDomeMask),
      max(0.05, localSurface.z)
    ));

    // Snell's law refraction through wet tear film + cornea + aqueous humor (IOR = 1.376)
    vec3 refractedLocal = refract(localView, corneaNormalLocal, 1.0 / 1.376);

    // Concave anterior chamber depth: recessed pupil & gently cupped iris cone give true 3D parallax!
    float chamberDepth = 0.125 + 0.065 * (1.0 - clamp(localRad2D / 0.86, 0.0, 1.0));
    vec3 irisHit3D = localSurface + refractedLocal * (chamberDepth / max(0.30, -refractedLocal.z));
    vec2 irisP = irisHit3D.xy;

    // Post-saccadic aqueous fluid wobble (iridodonesis \u2014 subtle liquid shimmer of iris tissue!)
    float wobbleFalloff = smoothstep(0.90, 0.16, length(irisP));
    float wobbleAng = uFluidWobble * 0.052 * wobbleFalloff;
    float wc = cos(wobbleAng), ws = sin(wobbleAng);
    irisP = mat2(wc, -ws, ws, wc) * irisP;
    irisP += vec2(uFluidWobble * 0.007, -uFluidWobble * 0.005) * wobbleFalloff;

    // =======================================================================
    // 3. FLOW-ADVECTED LOWER-LEFT DOUBLE S-RIBBON FOLD & IRIS ANATOMY
    // =======================================================================
    // Sculpting the iconic lower-left serpentine silk wave from the reference artwork:
    // Lobe 1 (8:00-9:00): upper-left lavender/mint curl tucking over a deep dark teal cleft
    // Lobe 2 (6:30-7:30): luminous pastel rose-pink ribbon sweeping out over glacier cyan!
    float vortexBreath = 1.0 + 0.07 * sin(uTime * 1.3 + uCuriosity * 1.8);

    vec2 cleftPos = vec2(-0.63, -0.37);
    float cleftIndentation = exp(-dot(irisP - cleftPos, irisP - cleftPos) * 15.0);

    vec2 lowerNotchPos = vec2(-0.36, -0.68);
    float lowerNotch = exp(-dot(irisP - lowerNotchPos, irisP - lowerNotchPos) * 16.0);

    vec2 foldCenter = vec2(-0.34, -0.52);
    float foldMask = exp(-dot(irisP - foldCenter, irisP - foldCenter) * 6.8);

    vec2 upperCurlCenter = vec2(-0.58, -0.20);
    float upperCurlMask = exp(-dot(irisP - upperCurlCenter, irisP - upperCurlCenter) * 7.8);

    // Subtle organic pupil eccentricity (sphincter tension asymmetry)
    vec2 pupilSpaceP = irisP + uPupilEcc * smoothstep(0.68, 0.14, length(irisP));
    float rad = length(pupilSpaceP);
    float theta = atan(pupilSpaceP.y, pupilSpaceP.x);

    // Feathery, brush-tufted outer ciliary margin (matching the ragged outer bristles in the reference!)
    float bristlesFine   = periodicFiberNoise(theta, 84.0, 0.88, 4.1);
    float bristlesMedium = periodicFiberNoise(theta, 38.0, 0.72, 11.7);
    float bristlesMacro  = periodicFiberFbm(theta, 12.0, 0.50, 19.3);
    float tuftOutliers   = pow(periodicFiberNoise(theta, 48.0, 0.94, 27.5), 4.0) * 0.048;

    float irisOuterR = 0.852
      + (bristlesFine - 0.5) * 0.028
      + (bristlesMedium - 0.5) * 0.026
      + (bristlesMacro - 0.5) * 0.040
      + tuftOutliers
      - cleftIndentation * 0.165
      - lowerNotch * 0.075;

    // Microscopic fibrous pupillary ruff spikes pulling into the Vantablack pupil core!
    float pupilSpikesFine = (periodicFiberNoise(theta, 115.0, 0.12, 33.1) - 0.5) * 0.017;
    float pupilWave       = (periodicFiberNoise(theta, 10.0, uTime * 0.18, 7.4) - 0.5) * (0.009 + 0.016 * uUncertainty);
    float pupilR = uPupilRadius + pupilSpikesFine + pupilWave;

    // Elastic radial iris coordinate u: 0.0 at pupil margin -> 1.0 at outer ciliary bristles!
    // As uPupilRadius dilates & constricts, u physically compresses & stretches all stroma fibers!
    float uRaw = (rad - pupilR) / max(0.11, irisOuterR - pupilR);

    // Liquid radial ripple wave propagating outward on focus/startle/wonder impulses
    float ripple = sin((uRaw - uRipplePhase * 0.46) * 22.0) *
                   exp(-abs(uRaw - uRipplePhase * 0.46) * 5.2) *
                   uRippleAmp * 0.046;
    float u = clamp(uRaw + ripple, 0.0, 1.25);

    // Accordion fiber buckling when pupil dilates wide ("curious mydriasis") vs taut straight pull when constricted!
    float dilationAmount = smoothstep(0.17, 0.50, uPupilRadius);
    float buckle = sin(u * PI * 2.4 + periodicFiberNoise(theta, 7.0, u, 2.8) * 3.2)
                   * (0.015 + 0.048 * dilationAmount);

    // Tangential silk-ribbon flow warp in the lower-left S-fold so individual strands visibly curl!
    float silkSwirl =
      foldMask * 0.56 * sin((u - 0.42) * 5.0) * vortexBreath -
      upperCurlMask * 0.42 * cos((u - 0.25) * 4.2) * vortexBreath;

    float fiberTheta = theta + buckle + silkSwirl;

    // =======================================================================
    // 4. MULTI-SCALE MACRO IRIS FIBERS, CRYPTS & SILK STRAND SPECULARITY
    // =======================================================================
    float fHair   = periodicFiberNoise(fiberTheta, 175.0, u * 0.30, 1.9);
    float fFine   = periodicFiberNoise(fiberTheta, 88.0,  u * 0.48, 8.4);
    float fBundled = periodicFiberNoise(fiberTheta, 36.0, u * 0.70, 16.2);
    float fMacro  = periodicFiberFbm(fiberTheta,   16.0,  u * 0.85, 24.7);

    float tensionBoost = mix(0.88, 1.36, uStromaTension);
    float fiberRelief = fHair * 0.38 + fFine * 0.30 + fBundled * 0.18 + fMacro * 0.14;
    fiberRelief = clamp((fiberRelief - 0.5) * tensionBoost + 0.5, 0.0, 1.0);

    // Crypts of Fuchs (deep organic openings around the inner collarette u ~ 0.15..0.36)
    float cryptEnvelope = exp(-pow((u - 0.24) / 0.105, 2.0));
    float cryptCell = periodicFiberNoise(fiberTheta * 1.01, 29.0, u * 4.4, 41.0) *
                      periodicFiberNoise(fiberTheta * 0.99 + 0.04, 23.0, u * 3.7, 53.0);
    float cryptDepth = smoothstep(0.45, 0.13, cryptCell) * cryptEnvelope * 0.72;

    // Concentric contraction furrows (delicate iridescent wave-rings when dilated)
    float furrowWave = sin(u * 25.0 + fMacro * 4.5) * 0.5 + 0.5;
    float furrows = pow(furrowWave, 4.2) * smoothstep(0.34, 0.86, u) * (0.07 + 0.17 * dilationAmount);

    // Micro-silk collagen sheen glints
    float silkGlint = pow(fiberRelief, 5.5) * (0.14 + 0.12 * uWonder);

    // =======================================================================
    // 5. EXACT IRIDESCENT CHROMATIC PALETTE (1:1 TRIBUTE TO REFERENCE IMAGE)
    // =======================================================================
    float bottomSector = smoothstep(0.22, -0.82, sin(theta));
    float leftSector   = smoothstep(0.18, -0.78, cos(theta));
    float upperArc     = smoothstep(-0.25, 0.75, sin(theta + 0.35));

    float iridShift = periodicFiberFbm(fiberTheta, 5.0, u * 1.35 - uTime * 0.045, 71.4);

    // Inner Pupillary Ruff -> Blazing Burnt-Crimson & Fiery Tangerine Corona (u: 0.0 -> 0.27)
    vec3 colAbyssRuff  = vec3(0.09, 0.012, 0.010);
    vec3 colMahogany   = vec3(0.54, 0.075, 0.018);
    vec3 colVermilion  = vec3(0.88, 0.23, 0.03);
    vec3 colTangerine  = vec3(1.00, 0.55, 0.13);

    vec3 innerCorona = mix(colVermilion, colTangerine, clamp(fiberRelief * 1.18, 0.0, 1.0));
    innerCorona = mix(colAbyssRuff, innerCorona, smoothstep(0.0, 0.09, u));
    innerCorona = mix(innerCorona, colMahogany, cryptDepth * 0.80);

    // Signature Chartreuse-Lime / Electric Gold Collarette Ring (u ~ 0.265)
    float collaretteRidge = exp(-pow((u - (0.265 + (fMacro - 0.5) * 0.052)) / 0.034, 2.0));
    vec3 colChartreuse = mix(vec3(0.96, 0.89, 0.26), vec3(0.68, 0.98, 0.46), leftSector);

    // Pearlescent Cream, Rose-Peach, Orchid-Magenta & Glacier-Cyan Outer Stroma
    vec3 pearlWhite   = vec3(1.00, 0.94, 0.91);
    vec3 roseBlush    = vec3(1.00, 0.75, 0.71);
    vec3 orchidViolet = vec3(0.91, 0.56, 0.97);
    vec3 mintOpal     = vec3(0.55, 0.97, 0.90);
    vec3 glacierCyan  = vec3(0.19, 0.83, 0.93);
    vec3 cobaltTeal   = vec3(0.05, 0.46, 0.67);
    vec3 coralFringe  = vec3(1.00, 0.55, 0.26);

    vec3 stroma = mix(roseBlush, pearlWhite, smoothstep(0.24, 0.76, fiberRelief));

    // Holographic orchid-magenta arc across upper & right outer stroma (u ~ 0.66..0.88)
    float orchidArc = exp(-pow((u - 0.76 + (iridShift - 0.5) * 0.11) / 0.105, 2.0)) * (0.42 + 0.58 * upperArc);
    stroma = mix(stroma, orchidViolet, clamp(orchidArc * 0.80, 0.0, 0.86));

    // Iridescent mint-aqua curve along the left side (9..11 o'clock)
    float mintArc = leftSector * (1.0 - bottomSector * 0.52) * exp(-pow((u - 0.60) / 0.22, 2.0));
    stroma = mix(stroma, mintOpal, clamp(mintArc * (0.58 + 0.34 * iridShift), 0.0, 0.84));

    // Luminous glacier-cyan & deep turquoise across the bottom hemisphere
    vec3 cyanBlend = mix(cobaltTeal, glacierCyan, smoothstep(0.16, 0.78, fiberRelief + iridShift * 0.24));
    cyanBlend = mix(cyanBlend, pearlWhite, smoothstep(0.66, 0.30, u) * 0.46);
    stroma = mix(stroma, cyanBlend, clamp(bottomSector * smoothstep(0.25, 0.66, u) * 1.10, 0.0, 0.95));

    // Sculpting the Lower-Left Pastel Pink Silk Ribbon Crest & Deep Turquoise Shadow Trough
    float ribbonWave = (irisP.y + 0.49) * 6.6 + sin((irisP.x + 0.34) * 6.4) * 1.38;
    float pinkSilkCrest = exp(-pow(ribbonWave - 0.36, 2.0) * 1.45) * foldMask;
    float deepCyanTrough = exp(-pow(ribbonWave + 0.92, 2.0) * 1.25) * foldMask;
    float upperLeftHook = exp(-pow(length(irisP - vec2(-0.59, -0.25)) / 0.165, 2.0));

    vec3 silkPinkCol = mix(vec3(1.00, 0.71, 0.80), vec3(1.00, 0.92, 0.91), fiberRelief);
    stroma = mix(stroma, vec3(0.04, 0.36, 0.53), clamp(deepCyanTrough * 0.85, 0.0, 0.85));
    stroma = mix(stroma, silkPinkCol, clamp(pinkSilkCrest * 1.18 + upperLeftHook * 0.68, 0.0, 0.95));

    // Coral-apricot & electric cyan bristle tips right at the frayed outer ciliary edge
    float bristleTipZone = smoothstep(0.84, 0.99, u);
    vec3 bristleTipCol = mix(coralFringe, vec3(0.18, 0.87, 0.95), bottomSector * 0.68);
    stroma = mix(stroma, bristleTipCol, bristleTipZone * 0.70);

    // Seamlessly blend Inner Fiery Corona -> Chartreuse Collarette -> Opalescent Stroma
    vec3 irisColor = mix(innerCorona, stroma, smoothstep(0.20, 0.34, u));
    irisColor = mix(irisColor, colChartreuse, clamp(collaretteRidge * (0.50 + 0.36 * fiberRelief), 0.0, 0.74));

    // Apply micro-fibrous relief shading, silk specular glints & contraction furrows
    irisColor *= (0.74 + 0.46 * fiberRelief);
    irisColor += vec3(1.0, 0.96, 0.97) * (furrows + silkGlint);

    // Emotional chromatic modulation (Curiosity/Wonder warm luminescence vs Uncertainty cool crystalline tension)
    irisColor *= (0.95 + 0.14 * uWonder + 0.09 * uCuriosity);
    irisColor = mix(irisColor, irisColor * vec3(0.91, 0.99, 1.07), uUncertainty * 0.30);

    // 3D Corneal Caustic Lighting (refracted light focusing across the opposite concave iris slope!)
    vec3 lightDir = normalize(vec3(0.22, 0.72, 0.66));
    float caustic = clamp(dot(normalize(vec3(-irisP.x, -irisP.y, 0.62)), lightDir), 0.0, 1.0);
    irisColor *= (0.85 + 0.32 * pow(caustic, 2.0));

    // =======================================================================
    // 6. VELVETY ABYSSAL PUPIL & DARK OBSIDIAN GLASSY ORB COMPOSITING
    // =======================================================================
    // Feathered micro-fibrous pupil edge into Vantablack abyss
    float pupilAlpha = smoothstep(pupilR - 0.007, pupilR + 0.011, rad);
    vec3 pupilAbyss = vec3(0.006, 0.003, 0.008);

    // Inside the 8 o'clock cleft & top notches, delicate electric cyan brush wisps trail into the dark orb!
    float cleftCyanWisps = periodicFiberNoise(theta, 98.0, rad, 91.2) * exp(-max(0.0, rad - irisOuterR) * 17.0);
    float topCyanTufts = exp(-pow(theta - 1.48, 2.0) * 18.0) * exp(-max(0.0, rad - irisOuterR) * 26.0);
    vec3 darkLimbalOrb = vec3(0.052, 0.030, 0.048)
                       + vec3(0.06, 0.42, 0.50) * cleftCyanWisps * cleftIndentation * 1.6
                       + vec3(0.12, 0.72, 0.76) * topCyanTufts * bristlesFine * 0.85;

    float irisOuterMask = 1.0 - smoothstep(irisOuterR - 0.013, irisOuterR + 0.015, rad);

    vec3 globeColor = mix(pupilAbyss, irisColor, pupilAlpha);
    globeColor = mix(darkLimbalOrb, globeColor, irisOuterMask);

    // Subtle limbal ambient occlusion ring inside the glass sphere
    globeColor *= 1.0 - 0.18 * smoothstep(0.80, 0.95, rGlobe);

    // =======================================================================
    // 7. WET CORNEAL OPTICS, WARM AMBER GLASS RIM & INTERACTIVE CATCHLIGHTS
    // =======================================================================
    float fresnel = pow(1.0 - max(0.0, worldPos.z), 3.3);

    // Warm copper-amber translucent rim around the dark obsidian sphere (matching reference!)
    vec3 rimAmberTop = vec3(0.98, 0.50, 0.15);
    vec3 rimAmberBot = vec3(0.60, 0.38, 0.16);
    vec3 orbRimGlow  = mix(rimAmberBot, rimAmberTop, smoothstep(-0.8, 0.8, q.y));
    globeColor += orbRimGlow * fresnel * 0.74;

    float outerGlassEdge = smoothstep(0.964, 0.996, rGlobe);
    globeColor = mix(globeColor, orbRimGlow * 0.86, outerGlassEdge * 0.50);

    // Subtle upper fiery & lower cyan wet corneal sky reflections
    globeColor += vec3(1.0, 0.60, 0.36) * smoothstep(0.18, 0.94, worldPos.y) * (1.0 - zFront) * 0.17;
    globeColor += vec3(0.20, 0.76, 0.84) * smoothstep(-0.22, -0.94, worldPos.y) * (1.0 - zFront) * 0.13;

    // Interactive luminous spark catchlight on the wet cornea when user interacts!
    if (uFocusGlow > 0.005) {
      vec2 specPos = uFocusPoint * 0.36 + uGaze * 0.24;
      float dSpec = length(q - specPos);
      float sparkCatch = exp(-dSpec * 28.0) * uFocusGlow * 0.70 + exp(-dSpec * 9.0) * uFocusGlow * 0.16;
      globeColor += vec3(1.0, 0.93, 0.84) * sparkCatch;
    }

    // Living wet tear-film meniscus shimmer sweeping delicately across the cornea
    if (uTearWave > -1.1 && uTearWave < 1.3) {
      float tearY = q.y - (1.0 - (uTearWave + 1.0) * 1.05);
      float tearMeniscus = exp(-tearY * tearY * 95.0) * (0.14 + 0.08 * zFront);
      globeColor += vec3(0.96, 0.97, 1.0) * tearMeniscus;
    }

    // Cohesive micro-grain across dark shadows
    globeColor += grain * 0.022;

    float sphereAA = 1.0 - smoothstep(0.991, 1.002, rGlobe);
    finalColor = mix(finalColor, globeColor, sphereAA);
  }

  // =========================================================================
  // 8. THE SIGNATURE UPPER-RIM ANAMORPHIC CRIMSON-GOLD STARBURST FLARE
  // =========================================================================
  // Sits right at the upper-right crest of the dark amber rim (~12:35 o'clock: q ~ (0.135, 0.985))
  // and glides subtly with corneal curvature as the sentient eye looks & trembles!
  vec2 starAnchor = vec2(0.135, 0.985) + vec2(uGaze.x * 0.12, uGaze.y * 0.09);
  vec2 starDelta = (q - starAnchor) * 0.42;
  finalColor += computeStarburst(starDelta, uStarburst, uCuriosity);

  // Soft filmic highlight rolloff preserving deep Vantablack pupil & rich neon-pastel iridescence
  finalColor = max(finalColor, vec3(0.0));
  finalColor = finalColor / (1.0 + finalColor * 0.15);
  finalColor = pow(finalColor, vec3(0.96));

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

  // src/practice-eye/living/ocularMind.ts
  var OcularMindEngine = class {
    time = 0;
    preset = "autonomous";
    // Autonomous narrative state
    phase = "curious_search";
    phaseTimer = 0;
    phaseDuration = 4.2;
    saccadeTimer = 0;
    nextSaccadeInterval = 0.85;
    // Target & physical gaze kinematics
    targetGazeX = 0.04;
    targetGazeY = 0.03;
    gazeX = 0;
    gazeY = 0;
    gazeVelX = 0;
    gazeVelY = 0;
    // Micro-inspection offset around point of interest
    microOffsetX = 0;
    microOffsetY = 0;
    // Torsional rotation
    irisTorsion = 0;
    irisTorsionVel = 0;
    // Pupil biomechanics
    pupilRadius = 0.31;
    targetPupilRadius = 0.33;
    pupilVelocity = 0;
    // Post-saccadic aqueous wobble (iridodonesis) & ripples
    wobblePos = 0;
    wobbleVel = 0;
    ripplePhase = 0;
    rippleAmp = 0;
    // Emotional state variables (smoothly interpolated 0..1)
    curiosity = 0.68;
    uncertainty = 0.28;
    wonder = 0.22;
    startle = 0;
    trust = 0.45;
    // Camera / presence proximity
    userZoomOffset = 0;
    macroZoom = 1;
    // Tear film shimmer
    tearTimer = 6.5;
    tearWaveProgress = -1.5;
    // Pointer tracking
    pointer = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      speed: 0,
      jerk: 0,
      active: false,
      lastMoveTime: -10,
      isPressed: false,
      pressDuration: 0,
      dwellTime: 0
    };
    // Hesitation / shy look-away vector during high uncertainty
    shyOffsetX = 0;
    shyOffsetY = 0;
    isHesitatingAway = false;
    // Callback hook for optional sound triggers on saccades / ripples
    onSaccade;
    onRipple;
    setPreset(preset) {
      this.preset = preset;
      if (preset === "curious") {
        this.transitionPhase("curious_search");
      } else if (preset === "uncertain") {
        this.transitionPhase("uncertain_hesitation");
      } else if (preset === "wonder") {
        this.transitionPhase("deep_wonder");
      }
      this.triggerMicroSaccade(0.18);
    }
    getPreset() {
      return this.preset;
    }
    onPointerMove(nx, ny, dt) {
      const safeDt = Math.max(dt, 4e-3);
      const nvx = (nx - this.pointer.x) / safeDt;
      const nvy = (ny - this.pointer.y) / safeDt;
      const newSpeed = Math.hypot(nvx, nvy);
      const accel = Math.abs(newSpeed - this.pointer.speed) / safeDt;
      this.pointer.x = nx;
      this.pointer.y = ny;
      this.pointer.vx = nvx;
      this.pointer.vy = nvy;
      this.pointer.speed = this.pointer.speed * 0.6 + newSpeed * 0.4;
      this.pointer.jerk = this.pointer.jerk * 0.7 + accel * 0.3;
      this.pointer.active = true;
      this.pointer.lastMoveTime = this.time;
      if (newSpeed > 4.8 && accel > 38 && this.startle < 0.45) {
        this.startle = Math.min(1, this.startle + 0.65);
        this.uncertainty = Math.min(1, this.uncertainty + 0.42);
        this.trust = Math.max(0.05, this.trust - 0.25);
        this.wobbleVel += (Math.random() > 0.5 ? 1 : -1) * 5.5;
        if (Math.random() < 0.65) {
          this.isHesitatingAway = true;
          const angle = Math.atan2(-ny, -nx) + (Math.random() - 0.5) * 1.3;
          this.shyOffsetX = Math.cos(angle) * 0.28;
          this.shyOffsetY = Math.sin(angle) * 0.24;
        }
        this.onSaccade?.(0.55, this.curiosity, this.uncertainty);
      }
    }
    onPointerDown(nx, ny) {
      this.pointer.x = nx;
      this.pointer.y = ny;
      this.pointer.active = true;
      this.pointer.lastMoveTime = this.time;
      this.pointer.isPressed = true;
      this.pointer.pressDuration = 0;
      const distFromEyeCenter = Math.hypot(nx - this.gazeX * 0.5, ny - this.gazeY * 0.5);
      if (distFromEyeCenter < 0.22) {
        this.startle = Math.min(1, this.startle + 0.52);
        this.pupilRadius = Math.max(0.15, this.pupilRadius - 0.045);
        this.rippleAmp = 1;
        this.ripplePhase = 0;
        this.wobbleVel += 6.2;
        this.onRipple?.(0.9);
      } else {
        this.rippleAmp = Math.max(this.rippleAmp, 0.55);
        this.ripplePhase = 0;
        this.isHesitatingAway = false;
        this.onRipple?.(0.55);
      }
    }
    onPointerUp() {
      if (this.pointer.isPressed && this.pointer.pressDuration > 0.45) {
        this.rippleAmp = Math.min(1, 0.45 + this.pointer.pressDuration * 0.25);
        this.ripplePhase = 0;
        this.wobbleVel += 3.2;
        this.onRipple?.(0.7);
      }
      this.pointer.isPressed = false;
      this.pointer.pressDuration = 0;
    }
    onPointerLeave() {
      this.pointer.active = false;
      this.pointer.isPressed = false;
      this.pointer.pressDuration = 0;
    }
    onDoubleTap() {
      this.tearWaveProgress = -1.1;
      this.startle = Math.min(1, this.startle + 0.35);
      this.wobbleVel += 4.5;
      this.onSaccade?.(0.35, this.curiosity, this.uncertainty);
    }
    onWheelZoom(deltaY) {
      this.userZoomOffset = Math.max(-0.18, Math.min(0.26, this.userZoomOffset - deltaY * 45e-5));
    }
    transitionPhase(next) {
      this.phase = next;
      this.phaseTimer = 0;
      switch (next) {
        case "curious_search":
          this.phaseDuration = 4 + Math.random() * 3.5;
          break;
        case "uncertain_hesitation":
          this.phaseDuration = 3.5 + Math.random() * 3;
          break;
        case "intimate_recognition":
          this.phaseDuration = 3.2 + Math.random() * 2.4;
          break;
        case "anxious_scrutiny":
          this.phaseDuration = 2.8 + Math.random() * 2.2;
          break;
        case "deep_wonder":
          this.phaseDuration = 3.8 + Math.random() * 3;
          break;
      }
    }
    chooseNextAutonomousPhase() {
      if (this.preset === "curious") {
        this.transitionPhase(Math.random() < 0.78 ? "curious_search" : "intimate_recognition");
        return;
      }
      if (this.preset === "uncertain") {
        this.transitionPhase(Math.random() < 0.72 ? "uncertain_hesitation" : "anxious_scrutiny");
        return;
      }
      if (this.preset === "wonder") {
        this.transitionPhase(Math.random() < 0.75 ? "deep_wonder" : "intimate_recognition");
        return;
      }
      const r = Math.random();
      switch (this.phase) {
        case "curious_search":
          if (r < 0.36) this.transitionPhase("uncertain_hesitation");
          else if (r < 0.68) this.transitionPhase("intimate_recognition");
          else if (r < 0.86) this.transitionPhase("deep_wonder");
          else this.transitionPhase("anxious_scrutiny");
          break;
        case "uncertain_hesitation":
          if (r < 0.45) this.transitionPhase("curious_search");
          else if (r < 0.75) this.transitionPhase("anxious_scrutiny");
          else this.transitionPhase("intimate_recognition");
          break;
        case "intimate_recognition":
          if (r < 0.42) this.transitionPhase("deep_wonder");
          else if (r < 0.75) this.transitionPhase("curious_search");
          else this.transitionPhase("uncertain_hesitation");
          break;
        case "anxious_scrutiny":
          if (r < 0.55) this.transitionPhase("curious_search");
          else if (r < 0.82) this.transitionPhase("intimate_recognition");
          else this.transitionPhase("uncertain_hesitation");
          break;
        case "deep_wonder":
          if (r < 0.48) this.transitionPhase("curious_search");
          else if (r < 0.8) this.transitionPhase("uncertain_hesitation");
          else this.transitionPhase("intimate_recognition");
          break;
      }
    }
    triggerMicroSaccade(scale) {
      const angle = Math.random() * Math.PI * 2;
      const rad = (0.25 + Math.random() * 0.75) * scale;
      this.microOffsetX = Math.cos(angle) * rad;
      this.microOffsetY = Math.sin(angle) * rad * 0.85;
      this.wobbleVel += (Math.random() - 0.5) * 5 * Math.min(1, scale * 3);
    }
    step(rawDt) {
      const dt = Math.min(Math.max(rawDt, 1e-3), 0.05);
      this.time += dt;
      const timeSinceMove = this.time - this.pointer.lastMoveTime;
      if (timeSinceMove > 0.06) {
        this.pointer.speed *= Math.exp(-8 * dt);
        this.pointer.jerk *= Math.exp(-10 * dt);
      }
      const pointerRecentlyActive = this.pointer.active && (timeSinceMove < 3.6 || this.pointer.isPressed);
      if (pointerRecentlyActive && this.pointer.speed < 0.9) {
        this.pointer.dwellTime = Math.min(8, this.pointer.dwellTime + dt);
        this.trust = Math.min(1, this.trust + dt * 0.16);
      } else {
        this.pointer.dwellTime = Math.max(0, this.pointer.dwellTime - dt * 1.4);
      }
      if (this.pointer.isPressed) {
        this.pointer.pressDuration += dt;
      }
      this.startle *= Math.exp(-2.3 * dt);
      if (this.isHesitatingAway && Math.random() < dt * 2.2) {
        this.isHesitatingAway = false;
      }
      this.phaseTimer += dt;
      if (this.phaseTimer >= this.phaseDuration && !this.pointer.isPressed) {
        this.chooseNextAutonomousPhase();
      }
      let targetCuriosity = 0.6;
      let targetUncertainty = 0.25;
      let targetWonder = 0.2;
      switch (this.phase) {
        case "curious_search":
          targetCuriosity = 0.88;
          targetUncertainty = 0.22;
          targetWonder = 0.34;
          break;
        case "uncertain_hesitation":
          targetCuriosity = 0.44;
          targetUncertainty = 0.88;
          targetWonder = 0.12;
          break;
        case "intimate_recognition":
          targetCuriosity = 0.78;
          targetUncertainty = 0.34;
          targetWonder = 0.72;
          break;
        case "anxious_scrutiny":
          targetCuriosity = 0.62;
          targetUncertainty = 0.82;
          targetWonder = 0.15;
          break;
        case "deep_wonder":
          targetCuriosity = 0.92;
          targetUncertainty = 0.1;
          targetWonder = 0.95;
          break;
      }
      if (pointerRecentlyActive) {
        if (this.pointer.isPressed) {
          const holdFactor = Math.min(1, this.pointer.pressDuration / 1.8);
          targetCuriosity = 0.95;
          targetWonder = Math.max(targetWonder, 0.55 + 0.43 * holdFactor);
          targetUncertainty = Math.max(0.08, 0.28 * (1 - holdFactor));
        } else if (this.pointer.speed > 2.4) {
          const speedFactor = Math.min(1, (this.pointer.speed - 2) / 4);
          targetUncertainty = Math.max(targetUncertainty, 0.55 + 0.42 * speedFactor);
          targetCuriosity = 0.58;
          targetWonder *= 0.3;
        } else {
          const calmTrust = Math.min(1, this.pointer.dwellTime / 2.2);
          targetCuriosity = Math.max(targetCuriosity, 0.82 + 0.15 * calmTrust);
          targetWonder = Math.max(targetWonder, 0.35 + 0.45 * calmTrust);
          if (this.preset !== "uncertain") {
            targetUncertainty = Math.min(targetUncertainty, 0.38 - 0.2 * calmTrust);
          }
        }
      }
      if (this.preset === "curious") {
        targetCuriosity = Math.max(targetCuriosity, 0.88);
        targetUncertainty = Math.min(targetUncertainty, 0.28);
      } else if (this.preset === "uncertain") {
        targetUncertainty = Math.max(targetUncertainty, 0.85);
        targetWonder = Math.min(targetWonder, 0.22);
      } else if (this.preset === "wonder") {
        targetWonder = Math.max(targetWonder, 0.9);
        targetCuriosity = Math.max(targetCuriosity, 0.85);
        targetUncertainty = Math.min(targetUncertainty, 0.15);
      }
      const emoSmooth = 1 - Math.exp(-2.4 * dt);
      this.curiosity += (targetCuriosity - this.curiosity) * emoSmooth;
      this.uncertainty += (targetUncertainty - this.uncertainty) * emoSmooth;
      this.wonder += (targetWonder - this.wonder) * emoSmooth;
      this.saccadeTimer += dt;
      if (this.saccadeTimer >= this.nextSaccadeInterval) {
        this.saccadeTimer = 0;
        const prevTargetX = this.targetGazeX;
        const prevTargetY = this.targetGazeY;
        if (pointerRecentlyActive) {
          const baseX = Math.max(-0.48, Math.min(0.48, this.pointer.x * 0.46));
          const baseY = Math.max(-0.42, Math.min(0.42, this.pointer.y * 0.42));
          if (this.pointer.isPressed) {
            this.triggerMicroSaccade(0.025);
            this.targetGazeX = baseX + this.microOffsetX;
            this.targetGazeY = baseY + this.microOffsetY;
            this.nextSaccadeInterval = 0.28 + Math.random() * 0.35;
          } else if (this.isHesitatingAway || this.uncertainty > 0.68 && Math.random() < 0.34) {
            const glanceAngle = Math.random() * Math.PI * 2;
            this.targetGazeX = baseX * 0.35 + Math.cos(glanceAngle) * 0.22;
            this.targetGazeY = baseY * 0.35 + Math.sin(glanceAngle) * 0.18;
            this.nextSaccadeInterval = 0.22 + Math.random() * 0.32;
          } else {
            const inspectSpread = 0.045 * this.curiosity + 0.03 * this.uncertainty;
            this.triggerMicroSaccade(inspectSpread);
            this.targetGazeX = baseX + this.microOffsetX;
            this.targetGazeY = baseY + this.microOffsetY;
            this.nextSaccadeInterval = 0.35 + Math.random() * 0.65;
          }
        } else {
          if (this.phase === "intimate_recognition" || this.phase === "deep_wonder") {
            this.triggerMicroSaccade(0.032);
            this.targetGazeX = this.microOffsetX;
            this.targetGazeY = this.microOffsetY;
            this.nextSaccadeInterval = 0.75 + Math.random() * 1.35;
          } else if (this.phase === "curious_search") {
            const r = Math.random();
            if (r < 0.25) {
              this.targetGazeX = (Math.random() - 0.5) * 0.08;
              this.targetGazeY = (Math.random() - 0.5) * 0.08;
            } else if (r < 0.65) {
              this.triggerMicroSaccade(0.11);
              this.targetGazeX = Math.max(-0.44, Math.min(0.44, this.targetGazeX + this.microOffsetX));
              this.targetGazeY = Math.max(-0.38, Math.min(0.38, this.targetGazeY + this.microOffsetY));
            } else {
              const ang = Math.random() * Math.PI * 2;
              const amp = 0.18 + Math.random() * 0.26;
              this.targetGazeX = Math.cos(ang) * amp;
              this.targetGazeY = Math.sin(ang) * amp * 0.85;
            }
            this.nextSaccadeInterval = 0.38 + Math.random() * 0.85;
          } else if (this.phase === "uncertain_hesitation") {
            const r = Math.random();
            if (r < 0.45) {
              this.targetGazeX = this.targetGazeX * 0.4 + (Math.random() - 0.5) * 0.22;
              this.targetGazeY = -0.06 + (Math.random() - 0.5) * 0.2;
            } else {
              this.triggerMicroSaccade(0.14);
              this.targetGazeX = Math.max(-0.38, Math.min(0.38, this.microOffsetX * 1.8));
              this.targetGazeY = Math.max(-0.34, Math.min(0.34, this.microOffsetY * 1.6));
            }
            this.nextSaccadeInterval = 0.24 + Math.random() * 0.58;
          } else {
            this.triggerMicroSaccade(0.09);
            this.targetGazeX = Math.max(-0.36, Math.min(0.36, this.targetGazeX * 0.6 + this.microOffsetX));
            this.targetGazeY = Math.max(-0.32, Math.min(0.32, this.targetGazeY * 0.6 + this.microOffsetY));
            this.nextSaccadeInterval = 0.18 + Math.random() * 0.36;
          }
        }
        const jumpAmp = Math.hypot(this.targetGazeX - prevTargetX, this.targetGazeY - prevTargetY);
        if (jumpAmp > 0.045) {
          this.wobbleVel += (this.targetGazeX >= prevTargetX ? 1 : -1) * Math.min(7.5, jumpAmp * 18);
          this.onSaccade?.(jumpAmp, this.curiosity, this.uncertainty);
        }
      }
      let effectiveTargetX = this.targetGazeX;
      let effectiveTargetY = this.targetGazeY;
      if (pointerRecentlyActive && !this.isHesitatingAway) {
        const pursuitWeight = this.pointer.isPressed ? 0.95 : 0.92;
        const px = Math.max(-0.48, Math.min(0.48, this.pointer.x * 0.46));
        const py = Math.max(-0.42, Math.min(0.42, this.pointer.y * 0.42));
        effectiveTargetX = effectiveTargetX * (1 - pursuitWeight) + (px + this.microOffsetX * 0.6) * pursuitWeight;
        effectiveTargetY = effectiveTargetY * (1 - pursuitWeight) + (py + this.microOffsetY * 0.6) * pursuitWeight;
      } else if (this.isHesitatingAway) {
        effectiveTargetX += this.shyOffsetX * 0.5;
        effectiveTargetY += this.shyOffsetY * 0.5;
      }
      const tremorAmp = 22e-4 + 75e-4 * this.uncertainty + 0.011 * this.startle;
      const tremorX = Math.sin(this.time * 47.3) * tremorAmp * 0.6 + Math.sin(this.time * 29.1 + 1.4) * tremorAmp * 0.4;
      const tremorY = Math.cos(this.time * 43.7 + 0.8) * tremorAmp * 0.6 + Math.sin(this.time * 31.9 + 2.7) * tremorAmp * 0.4;
      const stiffness = 245;
      const damping = 26.5;
      const ax = stiffness * (effectiveTargetX - this.gazeX) - damping * this.gazeVelX;
      const ay = stiffness * (effectiveTargetY - this.gazeY) - damping * this.gazeVelY;
      this.gazeVelX += ax * dt;
      this.gazeVelY += ay * dt;
      this.gazeX += this.gazeVelX * dt;
      this.gazeY += this.gazeVelY * dt;
      const inquisitiveTilt = Math.sin(this.time * 0.85) * 0.045 * this.curiosity + Math.sin(this.time * 2.6) * 0.038 * this.uncertainty + (this.pointer.isPressed ? Math.sin(this.time * 1.4) * 0.075 : 0);
      const listingsTorsion = -this.gazeX * this.gazeY * 0.55 + inquisitiveTilt;
      const torsionAcc = 65 * (listingsTorsion - this.irisTorsion) - 13.5 * this.irisTorsionVel;
      this.irisTorsionVel += torsionAcc * dt;
      this.irisTorsion += this.irisTorsionVel * dt;
      const wobbleAcc = -260 * this.wobblePos - 14.5 * this.wobbleVel;
      this.wobbleVel += wobbleAcc * dt;
      this.wobblePos += this.wobbleVel * dt;
      if (this.rippleAmp > 2e-3) {
        this.ripplePhase += dt * 4.2;
        this.rippleAmp *= Math.exp(-2.1 * dt);
      } else {
        this.rippleAmp = 0;
      }
      const baseFromEmotion = 0.265 + 0.135 * this.curiosity + 0.105 * this.wonder - 0.095 * this.uncertainty - 0.145 * this.startle;
      const hippusAmp = 8e-3 + 0.048 * Math.pow(this.uncertainty, 1.15) + 0.014 * this.curiosity;
      const hippusWave = Math.sin(this.time * 3.85) * 0.52 + Math.sin(this.time * 6.7 + 1.3) * 0.31 + Math.sin(this.time * 1.65 + 2.9) * 0.38;
      const pressDilationBoost = this.pointer.isPressed ? Math.min(0.11, this.pointer.pressDuration * 0.055) : 0;
      const accommodativeShift = -0.025 * Math.max(0, this.userZoomOffset);
      this.targetPupilRadius = Math.max(
        0.145,
        Math.min(
          0.525,
          baseFromEmotion + hippusWave * hippusAmp + pressDilationBoost + accommodativeShift
        )
      );
      const pupilDiff = this.targetPupilRadius - this.pupilRadius;
      const muscleRate = pupilDiff < 0 ? 11.5 : 3.2;
      const desiredPupilVel = pupilDiff * muscleRate;
      this.pupilVelocity += (desiredPupilVel - this.pupilVelocity) * (1 - Math.exp(-16 * dt));
      this.pupilRadius += this.pupilVelocity * dt;
      this.pupilRadius = Math.max(0.135, Math.min(0.535, this.pupilRadius));
      const eccScale = 8e-3 + 0.024 * this.uncertainty + 0.015 * Math.abs(this.pupilVelocity);
      const pupilEccX = Math.sin(this.time * 2.3 + 0.5) * eccScale;
      const pupilEccY = Math.cos(this.time * 1.9 + 1.7) * eccScale;
      const emotionalZoom = 1 + 0.042 * this.curiosity + 0.035 * this.wonder - 0.045 * this.uncertainty - 0.055 * this.startle + this.userZoomOffset;
      this.macroZoom += (emotionalZoom - this.macroZoom) * (1 - Math.exp(-3.2 * dt));
      this.tearTimer -= dt;
      if (this.tearTimer <= 0 && this.tearWaveProgress < -1) {
        this.tearWaveProgress = -1.1;
        this.tearTimer = 8 + Math.random() * 7.5;
      }
      if (this.tearWaveProgress >= -1.15) {
        this.tearWaveProgress += dt * 7.5;
        if (this.tearWaveProgress > 1.6) {
          this.tearWaveProgress = -1.5;
        }
      }
      const starburstIntensity = 0.88 + 0.24 * this.wonder + 0.15 * this.curiosity + 0.08 * Math.sin(this.time * 2.9) + 0.18 * this.startle;
      const stromaTension = Math.min(
        1,
        0.3 + Math.abs(this.pupilVelocity) * 2.4 + 0.4 * this.uncertainty
      );
      const focusGlow = pointerRecentlyActive ? Math.min(1, (this.pointer.isPressed ? 0.95 : 0.42) * (1 - Math.min(1, timeSinceMove / 3.6))) : 0;
      return {
        time: this.time,
        gazeX: this.gazeX + tremorX,
        gazeY: this.gazeY + tremorY,
        irisTorsion: this.irisTorsion,
        pupilRadius: this.pupilRadius,
        pupilVelocity: this.pupilVelocity,
        pupilEccentricityX: pupilEccX,
        pupilEccentricityY: pupilEccY,
        irisFluidWobble: this.wobblePos,
        irisRipplePhase: this.ripplePhase,
        irisRippleAmp: this.rippleAmp,
        stromaTension,
        curiosity: this.curiosity,
        uncertainty: this.uncertainty,
        wonder: this.wonder,
        startle: this.startle,
        macroZoom: this.macroZoom,
        tearFilmWave: this.tearWaveProgress,
        starburstIntensity,
        focusPointX: this.pointer.x,
        focusPointY: this.pointer.y,
        focusGlow
      };
    }
    getTelemetry() {
      const pupilNorm = Math.max(0, Math.min(1, (this.pupilRadius - 0.145) / (0.51 - 0.145)));
      let emotionLabel = "Curious Inquiry";
      let subLabel = "Dilating to drink in light";
      if (this.startle > 0.35) {
        emotionLabel = "Startled Reflex";
        subLabel = "Rapid sphincter constriction \xB7 Wary check";
      } else if (this.pointer.isPressed && this.pointer.pressDuration > 0.3) {
        emotionLabel = "Rapt Fascination";
        subLabel = "Locked on your spark \xB7 Deep mydriasis";
      } else if (this.uncertainty > 0.62 && this.uncertainty > this.curiosity) {
        emotionLabel = "Uncertain Hesitation";
        subLabel = "Pupillary hippus flutter \xB7 Questioning the unseen";
      } else if (this.wonder > 0.68) {
        emotionLabel = "Luminous Wonder";
        subLabel = "Wide-open absorption \xB7 Quiet awe";
      } else if (this.phase === "intimate_recognition" && (!this.pointer.active || this.pointer.dwellTime > 1)) {
        emotionLabel = "Studying You";
        subLabel = "Direct gaze lock \xB7 Inquisitive recognition";
      } else if (this.curiosity > 0.65) {
        emotionLabel = "Insatiable Curiosity";
        subLabel = "Saccadic exploration \xB7 Seeking every detail";
      } else {
        emotionLabel = "Wavering Thought";
        subLabel = "Drifting between curiosity & doubt";
      }
      return {
        emotionLabel,
        subLabel,
        curiosity: this.curiosity,
        uncertainty: this.uncertainty,
        wonder: this.wonder,
        pupilNormalized: pupilNorm,
        phase: this.phase
      };
    }
  };

  // src/practice-eye/living/ocularAudio.ts
  var OcularAudioEngine = class {
    ctx = null;
    masterGain = null;
    filter = null;
    osc1 = null;
    osc2 = null;
    lfo = null;
    lfoGain = null;
    enabled = false;
    lastSaccadeSoundTime = 0;
    toggle() {
      if (!this.enabled) {
        this.start();
        return this.enabled;
      } else {
        this.stop();
        return false;
      }
    }
    isEnabled() {
      return this.enabled;
    }
    start() {
      try {
        if (!this.ctx) {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          this.ctx = new AudioCtx();
          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.value = 1e-4;
          this.filter = this.ctx.createBiquadFilter();
          this.filter.type = "lowpass";
          this.filter.frequency.value = 380;
          this.filter.Q.value = 2.4;
          this.osc1 = this.ctx.createOscillator();
          this.osc1.type = "sine";
          this.osc1.frequency.value = 110;
          this.osc2 = this.ctx.createOscillator();
          this.osc2.type = "triangle";
          this.osc2.frequency.value = 164.81;
          const osc2Gain = this.ctx.createGain();
          osc2Gain.gain.value = 0.28;
          this.lfo = this.ctx.createOscillator();
          this.lfo.type = "sine";
          this.lfo.frequency.value = 3.4;
          this.lfoGain = this.ctx.createGain();
          this.lfoGain.gain.value = 0.6;
          this.lfo.connect(this.lfoGain);
          this.lfoGain.connect(this.osc1.frequency);
          this.lfoGain.connect(this.osc2.frequency);
          this.osc1.connect(this.filter);
          this.osc2.connect(osc2Gain);
          osc2Gain.connect(this.filter);
          this.filter.connect(this.masterGain);
          this.masterGain.connect(this.ctx.destination);
          this.osc1.start();
          this.osc2.start();
          this.lfo.start();
        }
        if (this.ctx.state === "suspended") {
          this.ctx.resume();
        }
        if (this.masterGain && this.ctx) {
          const now = this.ctx.currentTime;
          this.masterGain.gain.cancelScheduledValues(now);
          this.masterGain.gain.setTargetAtTime(0.085, now, 0.45);
        }
        this.enabled = true;
      } catch {
        this.enabled = false;
      }
    }
    stop() {
      this.enabled = false;
      if (this.masterGain && this.ctx) {
        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setTargetAtTime(1e-4, now, 0.25);
      }
    }
    update(pupilNormalized, curiosity, uncertainty, wonder) {
      if (!this.enabled || !this.ctx || !this.filter || !this.lfoGain || !this.osc2) return;
      const now = this.ctx.currentTime;
      const targetCutoff = 210 + pupilNormalized * 720 + wonder * 340 - uncertainty * 90;
      this.filter.frequency.setTargetAtTime(Math.max(160, targetCutoff), now, 0.08);
      this.filter.Q.setTargetAtTime(1.8 + uncertainty * 3.8 + curiosity * 1.2, now, 0.1);
      this.lfoGain.gain.setTargetAtTime(0.25 + uncertainty * 2.8, now, 0.12);
    }
    playSaccadePulse(amplitude, curiosity, uncertainty) {
      if (!this.enabled || !this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;
      if (now - this.lastSaccadeSoundTime < 0.11) return;
      this.lastSaccadeSoundTime = now;
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      const notes = curiosity >= uncertainty ? [329.63, 392, 440, 523.25, 659.25] : [293.66, 311.13, 369.99, 415.3];
      const baseFreq = notes[Math.floor(Math.random() * notes.length)];
      osc.type = "sine";
      osc.frequency.setValueAtTime(baseFreq * (0.98 + amplitude * 0.12), now);
      osc.frequency.exponentialRampToValueAtTime(
        baseFreq * (curiosity >= uncertainty ? 1.03 : 0.96),
        now + 0.16
      );
      const peak = Math.min(0.032, 0.01 + amplitude * 0.035);
      env.gain.setValueAtTime(1e-4, now);
      env.gain.linearRampToValueAtTime(peak, now + 0.014);
      env.gain.exponentialRampToValueAtTime(1e-4, now + 0.22);
      osc.connect(env);
      env.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.24);
    }
    playRippleChime(intensity) {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const freqs = [440, 554.37, 659.25];
      freqs.forEach((f, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, now + idx * 0.045);
        env.gain.setValueAtTime(1e-4, now + idx * 0.045);
        env.gain.linearRampToValueAtTime(0.018 * intensity, now + idx * 0.045 + 0.03);
        env.gain.exponentialRampToValueAtTime(1e-4, now + idx * 0.045 + 0.65);
        osc.connect(env);
        env.connect(this.ctx.destination);
        osc.start(now + idx * 0.045);
        osc.stop(now + idx * 0.045 + 0.7);
      });
    }
    dispose() {
      if (this.ctx) {
        this.ctx.close().catch(() => {
        });
        this.ctx = null;
      }
    }
  };

  // src/practice-eye/living/start.ts
  function compile(gl, type, source) {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }
  function startEye(canvas, onLabel) {
    const mind = new OcularMindEngine();
    mind.setPreset("autonomous");
    const audio = new OcularAudioEngine();
    mind.onSaccade = (amp, cur, unc) => audio.playSaccadePulse(amp, cur, unc);
    mind.onRipple = (intensity) => audio.playRippleChime(intensity);
    let gl = null;
    try {
      gl = canvas.getContext("webgl", { antialias: false, alpha: false, depth: false }) || canvas.getContext("experimental-webgl");
    } catch {
      gl = null;
    }
    let program = null;
    const loc = {};
    if (gl) {
      const vs = compile(gl, gl.VERTEX_SHADER, EYE_VERTEX_SHADER);
      const fs = compile(gl, gl.FRAGMENT_SHADER, EYE_FRAGMENT_SHADER);
      if (vs && fs) {
        program = gl.createProgram();
        if (program) {
          gl.attachShader(program, vs);
          gl.attachShader(program, fs);
          gl.linkProgram(program);
          if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
            gl.useProgram(program);
            const buf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buf);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
            const pos = gl.getAttribLocation(program, "aPosition");
            gl.enableVertexAttribArray(pos);
            gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
            [
              "uResolution",
              "uTime",
              "uGaze",
              "uTorsion",
              "uPupilRadius",
              "uPupilVel",
              "uPupilEcc",
              "uFluidWobble",
              "uRipplePhase",
              "uRippleAmp",
              "uStromaTension",
              "uCuriosity",
              "uUncertainty",
              "uWonder",
              "uStartle",
              "uMacroZoom",
              "uTearWave",
              "uStarburst",
              "uFocusPoint",
              "uFocusGlow"
            ].forEach((name) => {
              loc[name] = gl.getUniformLocation(program, name);
            });
          } else {
            program = null;
            gl = null;
          }
        }
      } else {
        gl = null;
      }
    }
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor((canvas.clientWidth || 320) * dpr));
      const h = Math.max(1, Math.floor((canvas.clientHeight || 320) * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl?.viewport(0, 0, canvas.width, canvas.height);
    };
    fit();
    const toNorm = (cx, cy) => {
      const r = canvas.getBoundingClientRect();
      const nx = (cx - r.left) / Math.max(1, r.width) * 2 - 1;
      const ny = -((cy - r.top) / Math.max(1, r.height) * 2 - 1);
      return { nx, ny };
    };
    let lastPtr = performance.now();
    let lastTap = 0;
    const move = (e) => {
      const now = performance.now();
      const dt = (now - lastPtr) / 1e3;
      lastPtr = now;
      const { nx, ny } = toNorm(e.clientX, e.clientY);
      mind.onPointerMove(nx, ny, dt);
    };
    const down = (e) => {
      const now = performance.now();
      if (now - lastTap < 280) mind.onDoubleTap();
      lastTap = now;
      const { nx, ny } = toNorm(e.clientX, e.clientY);
      mind.onPointerDown(nx, ny);
    };
    window.addEventListener("pointermove", move, { passive: true });
    canvas.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", () => mind.onPointerUp());
    window.addEventListener("resize", fit);
    let raf = 0;
    let prev = performance.now();
    let lastLabel = 0;
    const loop = (now) => {
      const dt = (now - prev) / 1e3;
      prev = now;
      const state = mind.step(dt);
      const tel = mind.getTelemetry();
      if (now - lastLabel > 4200) {
        lastLabel = now;
        const startle = state.startle > 0.45;
        const label = startle ? "who's there?" : tel.phase === "uncertain_hesitation" ? "is it safe?" : tel.phase === "deep_wonder" ? "i want to know everything." : tel.wonder > 0.7 ? "closer\u2026" : tel.curiosity > 0.75 ? "curious\u2026" : "hmm\u2026";
        onLabel(label);
      }
      if (gl && program) {
        gl.useProgram(program);
        gl.uniform2f(loc.uResolution, canvas.width, canvas.height);
        gl.uniform1f(loc.uTime, state.time);
        gl.uniform2f(loc.uGaze, state.gazeX, state.gazeY);
        gl.uniform1f(loc.uTorsion, state.irisTorsion);
        gl.uniform1f(loc.uPupilRadius, state.pupilRadius);
        gl.uniform1f(loc.uPupilVel, state.pupilVelocity);
        gl.uniform2f(loc.uPupilEcc, state.pupilEccentricityX, state.pupilEccentricityY);
        gl.uniform1f(loc.uFluidWobble, state.irisFluidWobble);
        gl.uniform1f(loc.uRipplePhase, state.irisRipplePhase);
        gl.uniform1f(loc.uRippleAmp, state.irisRippleAmp);
        gl.uniform1f(loc.uStromaTension, state.stromaTension);
        gl.uniform1f(loc.uCuriosity, state.curiosity);
        gl.uniform1f(loc.uUncertainty, state.uncertainty);
        gl.uniform1f(loc.uWonder, state.wonder);
        gl.uniform1f(loc.uStartle, state.startle);
        gl.uniform1f(loc.uMacroZoom, state.macroZoom);
        gl.uniform1f(loc.uTearWave, state.tearFilmWave);
        gl.uniform1f(loc.uStarburst, state.starburstIntensity);
        gl.uniform2f(loc.uFocusPoint, state.focusPointX, state.focusPointY);
        gl.uniform1f(loc.uFocusGlow, state.focusGlow);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      audio.dispose();
      window.removeEventListener("resize", fit);
    };
  }

  // src/practice-eye/browser.ts
  window.startVeyraEye = (canvas, onLabel) => startEye(canvas, onLabel ?? (() => {
  }));
})();
