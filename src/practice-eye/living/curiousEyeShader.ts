export const EYE_VERTEX_SHADER = `
attribute vec2 aPosition;
varying vec2 vUv;

void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const EYE_FRAGMENT_SHADER = `
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

    // Post-saccadic aqueous fluid wobble (iridodonesis — subtle liquid shimmer of iris tissue!)
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
