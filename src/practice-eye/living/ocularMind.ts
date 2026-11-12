export type EmotionPreset = 'autonomous' | 'curious' | 'uncertain' | 'wonder';

export type NarrativePhase =
  | 'curious_search'
  | 'uncertain_hesitation'
  | 'intimate_recognition'
  | 'anxious_scrutiny'
  | 'deep_wonder';

export interface OcularTelemetry {
  emotionLabel: string;
  subLabel: string;
  curiosity: number;
  uncertainty: number;
  wonder: number;
  pupilNormalized: number; // 0..1 visual meter
  phase: NarrativePhase;
}

export interface OcularFrameState {
  time: number;
  // 3D Eye orientation (radians)
  gazeX: number;
  gazeY: number;
  irisTorsion: number;
  // Pupil dynamics (in normalized iris space, ~0.14 to 0.54)
  pupilRadius: number;
  pupilVelocity: number;
  pupilEccentricityX: number;
  pupilEccentricityY: number;
  // Fluid & tissue micro-dynamics
  irisFluidWobble: number;
  irisRipplePhase: number;
  irisRippleAmp: number;
  stromaTension: number;
  // Emotional dimensions (0..1)
  curiosity: number;
  uncertainty: number;
  wonder: number;
  startle: number;
  // Optical & camera presence
  macroZoom: number;
  tearFilmWave: number; // -1..2 vertical sweep coordinate
  starburstIntensity: number;
  // Pointer focus light in normalized screen coords
  focusPointX: number;
  focusPointY: number;
  focusGlow: number;
}

interface PointerTracker {
  x: number; // -1..1
  y: number; // -1..1 (up is +)
  vx: number;
  vy: number;
  speed: number;
  jerk: number;
  active: boolean;
  lastMoveTime: number;
  isPressed: boolean;
  pressDuration: number;
  dwellTime: number;
}

export class OcularMindEngine {
  private time = 0;
  private preset: EmotionPreset = 'autonomous';

  // Autonomous narrative state
  private phase: NarrativePhase = 'curious_search';
  private phaseTimer = 0;
  private phaseDuration = 4.2;
  private saccadeTimer = 0;
  private nextSaccadeInterval = 0.85;

  // Target & physical gaze kinematics
  private targetGazeX = 0.04;
  private targetGazeY = 0.03;
  private gazeX = 0.0;
  private gazeY = 0.0;
  private gazeVelX = 0.0;
  private gazeVelY = 0.0;

  // Micro-inspection offset around point of interest
  private microOffsetX = 0.0;
  private microOffsetY = 0.0;

  // Torsional rotation
  private irisTorsion = 0.0;
  private irisTorsionVel = 0.0;

  // Pupil biomechanics
  private pupilRadius = 0.31;
  private targetPupilRadius = 0.33;
  private pupilVelocity = 0.0;

  // Post-saccadic aqueous wobble (iridodonesis) & ripples
  private wobblePos = 0.0;
  private wobbleVel = 0.0;
  private ripplePhase = 0.0;
  private rippleAmp = 0.0;

  // Emotional state variables (smoothly interpolated 0..1)
  private curiosity = 0.68;
  private uncertainty = 0.28;
  private wonder = 0.22;
  private startle = 0.0;
  private trust = 0.45;

  // Camera / presence proximity
  private userZoomOffset = 0.0;
  private macroZoom = 1.0;

  // Tear film shimmer
  private tearTimer = 6.5;
  private tearWaveProgress = -1.5;

  // Pointer tracking
  private pointer: PointerTracker = {
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
    dwellTime: 0,
  };

  // Hesitation / shy look-away vector during high uncertainty
  private shyOffsetX = 0;
  private shyOffsetY = 0;
  private isHesitatingAway = false;

  // Callback hook for optional sound triggers on saccades / ripples
  public onSaccade?: (amplitude: number, curiosity: number, uncertainty: number) => void;
  public onRipple?: (intensity: number) => void;

  public setPreset(preset: EmotionPreset) {
    this.preset = preset;
    if (preset === 'curious') {
      this.transitionPhase('curious_search');
    } else if (preset === 'uncertain') {
      this.transitionPhase('uncertain_hesitation');
    } else if (preset === 'wonder') {
      this.transitionPhase('deep_wonder');
    }
    this.triggerMicroSaccade(0.18);
  }

  public getPreset(): EmotionPreset {
    return this.preset;
  }

  public onPointerMove(nx: number, ny: number, dt: number) {
    const safeDt = Math.max(dt, 0.004);
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

    // Sudden erratic whip triggers startle + uncertainty reflex!
    if (newSpeed > 4.8 && accel > 38.0 && this.startle < 0.45) {
      this.startle = Math.min(1.0, this.startle + 0.65);
      this.uncertainty = Math.min(1.0, this.uncertainty + 0.42);
      this.trust = Math.max(0.05, this.trust - 0.25);
      this.wobbleVel += (Math.random() > 0.5 ? 1 : -1) * 5.5;
      // Briefly hesitate away before peeking back
      if (Math.random() < 0.65) {
        this.isHesitatingAway = true;
        const angle = Math.atan2(-ny, -nx) + (Math.random() - 0.5) * 1.3;
        this.shyOffsetX = Math.cos(angle) * 0.28;
        this.shyOffsetY = Math.sin(angle) * 0.24;
      }
      this.onSaccade?.(0.55, this.curiosity, this.uncertainty);
    }
  }

  public onPointerDown(nx: number, ny: number) {
    this.pointer.x = nx;
    this.pointer.y = ny;
    this.pointer.active = true;
    this.pointer.lastMoveTime = this.time;
    this.pointer.isPressed = true;
    this.pointer.pressDuration = 0;

    // Clicking directly on the pupil center causes a crisp photoreflex + ripple!
    const distFromEyeCenter = Math.hypot(nx - this.gazeX * 0.5, ny - this.gazeY * 0.5);
    if (distFromEyeCenter < 0.22) {
      this.startle = Math.min(1.0, this.startle + 0.52);
      this.pupilRadius = Math.max(0.15, this.pupilRadius - 0.045);
      this.rippleAmp = 1.0;
      this.ripplePhase = 0.0;
      this.wobbleVel += 6.2;
      this.onRipple?.(0.9);
    } else {
      // Offering a point of inquiry in space -> immediate inquisitive saccade
      this.rippleAmp = Math.max(this.rippleAmp, 0.55);
      this.ripplePhase = 0.0;
      this.isHesitatingAway = false;
      this.onRipple?.(0.55);
    }
  }

  public onPointerUp() {
    if (this.pointer.isPressed && this.pointer.pressDuration > 0.45) {
      // Releasing after deep focus sends a warm wonder-ripple across the iris
      this.rippleAmp = Math.min(1.0, 0.45 + this.pointer.pressDuration * 0.25);
      this.ripplePhase = 0.0;
      this.wobbleVel += 3.2;
      this.onRipple?.(0.7);
    }
    this.pointer.isPressed = false;
    this.pointer.pressDuration = 0;
  }

  public onPointerLeave() {
    this.pointer.active = false;
    this.pointer.isPressed = false;
    this.pointer.pressDuration = 0;
  }

  public onDoubleTap() {
    // Trigger wet corneal tear-film refreshment wave & brief pupil reflex
    this.tearWaveProgress = -1.1;
    this.startle = Math.min(1.0, this.startle + 0.35);
    this.wobbleVel += 4.5;
    this.onSaccade?.(0.35, this.curiosity, this.uncertainty);
  }

  public onWheelZoom(deltaY: number) {
    this.userZoomOffset = Math.max(-0.18, Math.min(0.26, this.userZoomOffset - deltaY * 0.00045));
  }

  private transitionPhase(next: NarrativePhase) {
    this.phase = next;
    this.phaseTimer = 0;
    switch (next) {
      case 'curious_search':
        this.phaseDuration = 4.0 + Math.random() * 3.5;
        break;
      case 'uncertain_hesitation':
        this.phaseDuration = 3.5 + Math.random() * 3.0;
        break;
      case 'intimate_recognition':
        this.phaseDuration = 3.2 + Math.random() * 2.4;
        break;
      case 'anxious_scrutiny':
        this.phaseDuration = 2.8 + Math.random() * 2.2;
        break;
      case 'deep_wonder':
        this.phaseDuration = 3.8 + Math.random() * 3.0;
        break;
    }
  }

  private chooseNextAutonomousPhase() {
    if (this.preset === 'curious') {
      this.transitionPhase(Math.random() < 0.78 ? 'curious_search' : 'intimate_recognition');
      return;
    }
    if (this.preset === 'uncertain') {
      this.transitionPhase(Math.random() < 0.72 ? 'uncertain_hesitation' : 'anxious_scrutiny');
      return;
    }
    if (this.preset === 'wonder') {
      this.transitionPhase(Math.random() < 0.75 ? 'deep_wonder' : 'intimate_recognition');
      return;
    }

    // Rich organic emotional storytelling arc
    const r = Math.random();
    switch (this.phase) {
      case 'curious_search':
        if (r < 0.36) this.transitionPhase('uncertain_hesitation');
        else if (r < 0.68) this.transitionPhase('intimate_recognition');
        else if (r < 0.86) this.transitionPhase('deep_wonder');
        else this.transitionPhase('anxious_scrutiny');
        break;
      case 'uncertain_hesitation':
        if (r < 0.45) this.transitionPhase('curious_search');
        else if (r < 0.75) this.transitionPhase('anxious_scrutiny');
        else this.transitionPhase('intimate_recognition');
        break;
      case 'intimate_recognition':
        if (r < 0.42) this.transitionPhase('deep_wonder');
        else if (r < 0.75) this.transitionPhase('curious_search');
        else this.transitionPhase('uncertain_hesitation');
        break;
      case 'anxious_scrutiny':
        if (r < 0.55) this.transitionPhase('curious_search');
        else if (r < 0.82) this.transitionPhase('intimate_recognition');
        else this.transitionPhase('uncertain_hesitation');
        break;
      case 'deep_wonder':
        if (r < 0.48) this.transitionPhase('curious_search');
        else if (r < 0.80) this.transitionPhase('uncertain_hesitation');
        else this.transitionPhase('intimate_recognition');
        break;
    }
  }

  private triggerMicroSaccade(scale: number) {
    const angle = Math.random() * Math.PI * 2;
    const rad = (0.25 + Math.random() * 0.75) * scale;
    this.microOffsetX = Math.cos(angle) * rad;
    this.microOffsetY = Math.sin(angle) * rad * 0.85;
    this.wobbleVel += (Math.random() - 0.5) * 5.0 * Math.min(1.0, scale * 3.0);
  }

  public step(rawDt: number): OcularFrameState {
    const dt = Math.min(Math.max(rawDt, 0.001), 0.05);
    this.time += dt;

    // 1. Decay pointer velocity when pointer stops moving
    const timeSinceMove = this.time - this.pointer.lastMoveTime;
    if (timeSinceMove > 0.06) {
      this.pointer.speed *= Math.exp(-8.0 * dt);
      this.pointer.jerk *= Math.exp(-10.0 * dt);
    }

    const pointerRecentlyActive = this.pointer.active && (timeSinceMove < 3.6 || this.pointer.isPressed);

    if (pointerRecentlyActive && this.pointer.speed < 0.9) {
      this.pointer.dwellTime = Math.min(8.0, this.pointer.dwellTime + dt);
      this.trust = Math.min(1.0, this.trust + dt * 0.16);
    } else {
      this.pointer.dwellTime = Math.max(0.0, this.pointer.dwellTime - dt * 1.4);
    }

    if (this.pointer.isPressed) {
      this.pointer.pressDuration += dt;
    }

    // Natural startle recovery
    this.startle *= Math.exp(-2.3 * dt);
    if (this.isHesitatingAway && Math.random() < dt * 2.2) {
      this.isHesitatingAway = false;
    }

    // 2. Advance Narrative Phase
    this.phaseTimer += dt;
    if (this.phaseTimer >= this.phaseDuration && !this.pointer.isPressed) {
      this.chooseNextAutonomousPhase();
    }

    // 3. Compute Target Emotional Drives based on Narrative + Live User Interaction
    let targetCuriosity = 0.6;
    let targetUncertainty = 0.25;
    let targetWonder = 0.2;

    switch (this.phase) {
      case 'curious_search':
        targetCuriosity = 0.88;
        targetUncertainty = 0.22;
        targetWonder = 0.34;
        break;
      case 'uncertain_hesitation':
        targetCuriosity = 0.44;
        targetUncertainty = 0.88;
        targetWonder = 0.12;
        break;
      case 'intimate_recognition':
        targetCuriosity = 0.78;
        targetUncertainty = 0.34;
        targetWonder = 0.72;
        break;
      case 'anxious_scrutiny':
        targetCuriosity = 0.62;
        targetUncertainty = 0.82;
        targetWonder = 0.15;
        break;
      case 'deep_wonder':
        targetCuriosity = 0.92;
        targetUncertainty = 0.10;
        targetWonder = 0.95;
        break;
    }

    // Blend live pointer psychology!
    if (pointerRecentlyActive) {
      if (this.pointer.isPressed) {
        // Holding creates intense mesmerized curiosity -> wonder!
        const holdFactor = Math.min(1.0, this.pointer.pressDuration / 1.8);
        targetCuriosity = 0.95;
        targetWonder = Math.max(targetWonder, 0.55 + 0.43 * holdFactor);
        targetUncertainty = Math.max(0.08, 0.28 * (1.0 - holdFactor));
      } else if (this.pointer.speed > 2.4) {
        // Fast restless movement evokes uncertainty & cautious alertness
        const speedFactor = Math.min(1.0, (this.pointer.speed - 2.0) / 4.0);
        targetUncertainty = Math.max(targetUncertainty, 0.55 + 0.42 * speedFactor);
        targetCuriosity = 0.58;
        targetWonder *= 0.3;
      } else {
        // Gentle presence draws deep curiosity!
        const calmTrust = Math.min(1.0, this.pointer.dwellTime / 2.2);
        targetCuriosity = Math.max(targetCuriosity, 0.82 + 0.15 * calmTrust);
        targetWonder = Math.max(targetWonder, 0.35 + 0.45 * calmTrust);
        if (this.preset !== 'uncertain') {
          targetUncertainty = Math.min(targetUncertainty, 0.38 - 0.2 * calmTrust);
        }
      }
    }

    // Preset overrides keep emotional signature distinct when user chooses one
    if (this.preset === 'curious') {
      targetCuriosity = Math.max(targetCuriosity, 0.88);
      targetUncertainty = Math.min(targetUncertainty, 0.28);
    } else if (this.preset === 'uncertain') {
      targetUncertainty = Math.max(targetUncertainty, 0.85);
      targetWonder = Math.min(targetWonder, 0.22);
    } else if (this.preset === 'wonder') {
      targetWonder = Math.max(targetWonder, 0.9);
      targetCuriosity = Math.max(targetCuriosity, 0.85);
      targetUncertainty = Math.min(targetUncertainty, 0.15);
    }

    const emoSmooth = 1.0 - Math.exp(-2.4 * dt);
    this.curiosity += (targetCuriosity - this.curiosity) * emoSmooth;
    this.uncertainty += (targetUncertainty - this.uncertainty) * emoSmooth;
    this.wonder += (targetWonder - this.wonder) * emoSmooth;

    // 4. Saccadic Gaze Decision Maker
    this.saccadeTimer += dt;
    if (this.saccadeTimer >= this.nextSaccadeInterval) {
      this.saccadeTimer = 0;

      const prevTargetX = this.targetGazeX;
      const prevTargetY = this.targetGazeY;

      if (pointerRecentlyActive) {
        // Map screen pointer (-1..1) to realistic eye angular range (~-0.46..0.46 rad)
        const baseX = Math.max(-0.48, Math.min(0.48, this.pointer.x * 0.46));
        const baseY = Math.max(-0.42, Math.min(0.42, this.pointer.y * 0.42));

        if (this.pointer.isPressed) {
          // Ultra-tight micro-fixations studying the held mystery spark
          this.triggerMicroSaccade(0.025);
          this.targetGazeX = baseX + this.microOffsetX;
          this.targetGazeY = baseY + this.microOffsetY;
          this.nextSaccadeInterval = 0.28 + Math.random() * 0.35;
        } else if (this.isHesitatingAway || (this.uncertainty > 0.68 && Math.random() < 0.34)) {
          // Uncertain shy glance away or side-peek before returning to pointer!
          const glanceAngle = Math.random() * Math.PI * 2;
          this.targetGazeX = baseX * 0.35 + Math.cos(glanceAngle) * 0.22;
          this.targetGazeY = baseY * 0.35 + Math.sin(glanceAngle) * 0.18;
          this.nextSaccadeInterval = 0.22 + Math.random() * 0.32;
        } else {
          // Curious triangular inspection around the user's cursor ("studying every detail")
          const inspectSpread = 0.045 * this.curiosity + 0.03 * this.uncertainty;
          this.triggerMicroSaccade(inspectSpread);
          this.targetGazeX = baseX + this.microOffsetX;
          this.targetGazeY = baseY + this.microOffsetY;
          this.nextSaccadeInterval = 0.35 + Math.random() * 0.65;
        }
      } else {
        // Pure autonomous sentient gaze choreography!
        if (this.phase === 'intimate_recognition' || this.phase === 'deep_wonder') {
          // Locks eyes directly with the viewer with tiny living micro-fixations!
          this.triggerMicroSaccade(0.032);
          this.targetGazeX = this.microOffsetX;
          this.targetGazeY = this.microOffsetY;
          this.nextSaccadeInterval = 0.75 + Math.random() * 1.35;
        } else if (this.phase === 'curious_search') {
          // Eagerly explores corners & invisible details in space
          const r = Math.random();
          if (r < 0.25) {
            // Sudden return to check on viewer!
            this.targetGazeX = (Math.random() - 0.5) * 0.08;
            this.targetGazeY = (Math.random() - 0.5) * 0.08;
          } else if (r < 0.65) {
            // Micro-inspection cluster near current region
            this.triggerMicroSaccade(0.11);
            this.targetGazeX = Math.max(-0.44, Math.min(0.44, this.targetGazeX + this.microOffsetX));
            this.targetGazeY = Math.max(-0.38, Math.min(0.38, this.targetGazeY + this.microOffsetY));
          } else {
            // Wide inquisitive saccade to a new quadrant
            const ang = Math.random() * Math.PI * 2;
            const amp = 0.18 + Math.random() * 0.26;
            this.targetGazeX = Math.cos(ang) * amp;
            this.targetGazeY = Math.sin(ang) * amp * 0.85;
          }
          this.nextSaccadeInterval = 0.38 + Math.random() * 0.85;
        } else if (this.phase === 'uncertain_hesitation') {
          // Tentative half-steps, second-guessing, glancing downward/sideways in thought
          const r = Math.random();
          if (r < 0.45) {
            // Pull halfway back or hesitate sideways
            this.targetGazeX = this.targetGazeX * 0.4 + (Math.random() - 0.5) * 0.22;
            this.targetGazeY = -0.06 + (Math.random() - 0.5) * 0.20;
          } else {
            // Nervous quick double-check
            this.triggerMicroSaccade(0.14);
            this.targetGazeX = Math.max(-0.38, Math.min(0.38, this.microOffsetX * 1.8));
            this.targetGazeY = Math.max(-0.34, Math.min(0.34, this.microOffsetY * 1.6));
          }
          this.nextSaccadeInterval = 0.24 + Math.random() * 0.58;
        } else {
          // Anxious scrutiny: rapid tight darting focus
          this.triggerMicroSaccade(0.09);
          this.targetGazeX = Math.max(-0.36, Math.min(0.36, this.targetGazeX * 0.6 + this.microOffsetX));
          this.targetGazeY = Math.max(-0.32, Math.min(0.32, this.targetGazeY * 0.6 + this.microOffsetY));
          this.nextSaccadeInterval = 0.18 + Math.random() * 0.36;
        }
      }

      const jumpAmp = Math.hypot(this.targetGazeX - prevTargetX, this.targetGazeY - prevTargetY);
      if (jumpAmp > 0.045) {
        this.wobbleVel += (this.targetGazeX >= prevTargetX ? 1 : -1) * Math.min(7.5, jumpAmp * 18.0);
        this.onSaccade?.(jumpAmp, this.curiosity, this.uncertainty);
      }
    }

    // Continuous smooth pursuit blend when user gently glides pointer
    let effectiveTargetX = this.targetGazeX;
    let effectiveTargetY = this.targetGazeY;
    if (pointerRecentlyActive && !this.isHesitatingAway) {
      const pursuitWeight = this.pointer.isPressed ? 0.88 : 0.68 * (1.0 - 0.45 * this.uncertainty);
      const px = Math.max(-0.48, Math.min(0.48, this.pointer.x * 0.46));
      const py = Math.max(-0.42, Math.min(0.42, this.pointer.y * 0.42));
      effectiveTargetX = effectiveTargetX * (1.0 - pursuitWeight) + (px + this.microOffsetX * 0.6) * pursuitWeight;
      effectiveTargetY = effectiveTargetY * (1.0 - pursuitWeight) + (py + this.microOffsetY * 0.6) * pursuitWeight;
    } else if (this.isHesitatingAway) {
      effectiveTargetX += this.shyOffsetX * 0.5;
      effectiveTargetY += this.shyOffsetY * 0.5;
    }

    // Add physiological ocular micro-tremor (amplified under uncertainty & startle!)
    const tremorAmp = 0.0022 + 0.0075 * this.uncertainty + 0.011 * this.startle;
    const tremorX =
      Math.sin(this.time * 47.3) * tremorAmp * 0.6 +
      Math.sin(this.time * 29.1 + 1.4) * tremorAmp * 0.4;
    const tremorY =
      Math.cos(this.time * 43.7 + 0.8) * tremorAmp * 0.6 +
      Math.sin(this.time * 31.9 + 2.7) * tremorAmp * 0.4;

    // 5. Ballistic Spring-Damper Ocular Globe Integration (Crisp human saccade profile)
    const stiffness = 245.0; // crisp saccadic snap
    const damping = 26.5;    // slight biological dynamic overshoot without rubberiness
    const ax = stiffness * (effectiveTargetX - this.gazeX) - damping * this.gazeVelX;
    const ay = stiffness * (effectiveTargetY - this.gazeY) - damping * this.gazeVelY;
    this.gazeVelX += ax * dt;
    this.gazeVelY += ay * dt;
    this.gazeX += this.gazeVelX * dt;
    this.gazeY += this.gazeVelY * dt;

    // 6. Listing's Law + Emotional Cyclotorsion (subtle inquisitive rotational twist of iris!)
    const inquisitiveTilt =
      Math.sin(this.time * 0.85) * 0.045 * this.curiosity +
      Math.sin(this.time * 2.6) * 0.038 * this.uncertainty +
      (this.pointer.isPressed ? Math.sin(this.time * 1.4) * 0.075 : 0.0);
    const listingsTorsion = -this.gazeX * this.gazeY * 0.55 + inquisitiveTilt;
    const torsionAcc = 65.0 * (listingsTorsion - this.irisTorsion) - 13.5 * this.irisTorsionVel;
    this.irisTorsionVel += torsionAcc * dt;
    this.irisTorsion += this.irisTorsionVel * dt;

    // 7. Post-Saccadic Fluid Iris Wobble (Iridodonesis) & Radial Ripple Propagation
    const wobbleAcc = -260.0 * this.wobblePos - 14.5 * this.wobbleVel;
    this.wobbleVel += wobbleAcc * dt;
    this.wobblePos += this.wobbleVel * dt;

    if (this.rippleAmp > 0.002) {
      this.ripplePhase += dt * 4.2;
      this.rippleAmp *= Math.exp(-2.1 * dt);
    } else {
      this.rippleAmp = 0.0;
    }

    // 8. Biologically Authentic Pupil Dilation & Hippus Dynamics!
    // Base pupil target from emotional balance:
    // - Curiosity & Wonder open the pupil wide ("drinking in all knowledge": 0.36 -> 0.50)
    // - Uncertainty narrows baseline & triggers oscillatory Hippus ("trying to resolve ambiguity": 0.20 -> 0.31)
    // - Startle snaps pupil tight via rapid sphincter reflex (~0.16)
    const baseFromEmotion =
      0.265 +
      0.135 * this.curiosity +
      0.105 * this.wonder -
      0.095 * this.uncertainty -
      0.145 * this.startle;

    // Pupillary Hippus: involuntary autonomic oscillation between sympathetic & parasympathetic drives!
    // Always has a delicate living breath (~0.008), surging dramatically under Uncertainty (~0.052)!
    const hippusAmp = 0.008 + 0.048 * Math.pow(this.uncertainty, 1.15) + 0.014 * this.curiosity;
    const hippusWave =
      Math.sin(this.time * 3.85) * 0.52 +
      Math.sin(this.time * 6.70 + 1.3) * 0.31 +
      Math.sin(this.time * 1.65 + 2.9) * 0.38;

    // Near-accommodation subtle constriction if macro camera is zoomed very close,
    // countered by rapturous dilation when pointer is held in wonder
    const pressDilationBoost = this.pointer.isPressed
      ? Math.min(0.11, this.pointer.pressDuration * 0.055)
      : 0.0;

    const accommodativeShift = -0.025 * Math.max(0, this.userZoomOffset);

    this.targetPupilRadius = Math.max(
      0.145,
      Math.min(
        0.525,
        baseFromEmotion + hippusWave * hippusAmp + pressDilationBoost + accommodativeShift
      )
    );

    // Asymmetric autonomic muscle dynamics!
    // Constriction (sphincter pupillae) is ~3.5x faster than dilation (dilator pupillae)!
    const pupilDiff = this.targetPupilRadius - this.pupilRadius;
    const muscleRate = pupilDiff < 0 ? 11.5 : 3.2;
    const desiredPupilVel = pupilDiff * muscleRate;
    this.pupilVelocity += (desiredPupilVel - this.pupilVelocity) * (1.0 - Math.exp(-16.0 * dt));
    this.pupilRadius += this.pupilVelocity * dt;
    this.pupilRadius = Math.max(0.135, Math.min(0.535, this.pupilRadius));

    // Subtle organic non-circular pupil tension (real sphincter muscle slight oval/organic pull)
    const eccScale = 0.008 + 0.024 * this.uncertainty + 0.015 * Math.abs(this.pupilVelocity);
    const pupilEccX = Math.sin(this.time * 2.3 + 0.5) * eccScale;
    const pupilEccY = Math.cos(this.time * 1.9 + 1.7) * eccScale;

    // 9. Macro Presence / Leaning-In Physics
    // When deeply curious or mesmerized, the eye subtly leans closer toward the glass!
    // When uncertain or startled, it subtly pulls back into the protective dark void.
    const emotionalZoom =
      1.0 +
      0.042 * this.curiosity +
      0.035 * this.wonder -
      0.045 * this.uncertainty -
      0.055 * this.startle +
      this.userZoomOffset;
    this.macroZoom += (emotionalZoom - this.macroZoom) * (1.0 - Math.exp(-3.2 * dt));

    // 10. Periodic Wet Corneal Tear-Film Shimmer
    this.tearTimer -= dt;
    if (this.tearTimer <= 0 && this.tearWaveProgress < -1.0) {
      this.tearWaveProgress = -1.1;
      this.tearTimer = 8.0 + Math.random() * 7.5;
    }
    if (this.tearWaveProgress >= -1.15) {
      this.tearWaveProgress += dt * 7.5;
      if (this.tearWaveProgress > 1.6) {
        this.tearWaveProgress = -1.5;
      }
    }

    // Starburst flare breathes with curiosity, wonder, and pupil dynamics
    const starburstIntensity =
      0.88 +
      0.24 * this.wonder +
      0.15 * this.curiosity +
      0.08 * Math.sin(this.time * 2.9) +
      0.18 * this.startle;

    // Stroma fiber tension spikes during rapid pupil constriction/dilation & uncertainty
    const stromaTension = Math.min(
      1.0,
      0.3 + Math.abs(this.pupilVelocity) * 2.4 + 0.4 * this.uncertainty
    );

    const focusGlow = pointerRecentlyActive
      ? Math.min(1.0, (this.pointer.isPressed ? 0.95 : 0.42) * (1.0 - Math.min(1.0, timeSinceMove / 3.6)))
      : 0.0;

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
      focusGlow,
    };
  }

  public getTelemetry(): OcularTelemetry {
    const pupilNorm = Math.max(0, Math.min(1, (this.pupilRadius - 0.145) / (0.51 - 0.145)));

    let emotionLabel = 'Curious Inquiry';
    let subLabel = 'Dilating to drink in light';

    if (this.startle > 0.35) {
      emotionLabel = 'Startled Reflex';
      subLabel = 'Rapid sphincter constriction · Wary check';
    } else if (this.pointer.isPressed && this.pointer.pressDuration > 0.3) {
      emotionLabel = 'Rapt Fascination';
      subLabel = 'Locked on your spark · Deep mydriasis';
    } else if (this.uncertainty > 0.62 && this.uncertainty > this.curiosity) {
      emotionLabel = 'Uncertain Hesitation';
      subLabel = 'Pupillary hippus flutter · Questioning the unseen';
    } else if (this.wonder > 0.68) {
      emotionLabel = 'Luminous Wonder';
      subLabel = 'Wide-open absorption · Quiet awe';
    } else if (this.phase === 'intimate_recognition' && (!this.pointer.active || this.pointer.dwellTime > 1.0)) {
      emotionLabel = 'Studying You';
      subLabel = 'Direct gaze lock · Inquisitive recognition';
    } else if (this.curiosity > 0.65) {
      emotionLabel = 'Insatiable Curiosity';
      subLabel = 'Saccadic exploration · Seeking every detail';
    } else {
      emotionLabel = 'Wavering Thought';
      subLabel = 'Drifting between curiosity & doubt';
    }

    return {
      emotionLabel,
      subLabel,
      curiosity: this.curiosity,
      uncertainty: this.uncertainty,
      wonder: this.wonder,
      pupilNormalized: pupilNorm,
      phase: this.phase,
    };
  }
}
