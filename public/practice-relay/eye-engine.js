/* Photoreal iris — WebGL fragment shader, pointer gaze, blink, wet cornea. */
(function (g) {
  const VERT = `attribute vec2 a; void main(){ gl_Position = vec4(a,0.,1.); }`

  const FRAG = `
#ifdef GL_ES
precision highp float;
#endif
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_look;
uniform float u_blink;
uniform float u_pupil;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f*f*(3.-2.*f);
  float a = hash(i), b = hash(i+vec2(1,0)), c = hash(i+vec2(0,1)), d = hash(i+vec2(1,1));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}
float fbm(vec2 p){
  float v=0., a=0.5;
  for(int i=0;i<6;i++){ v+=a*noise(p); p*=2.03; a*=0.5; }
  return v;
}

void main(){
  vec2 uv = (gl_FragCoord.xy / u_res) * 2. - 1.;
  uv.x *= u_res.x / u_res.y;
  vec3 parchment = vec3(0.988, 0.965, 0.914);

  float open = mix(0.04, 0.62, u_blink);
  vec2 e = uv;
  float lid = abs(e.y) / open + pow(abs(e.x)*0.92, 1.7);
  float eyeMask = 1. - smoothstep(0.92, 1.08, lid);
  if (eyeMask < 0.004) { gl_FragColor = vec4(parchment, 0.); return; }

  vec2 look = u_look * 0.22;
  vec2 p = e - look * vec2(1.15, 0.85);
  float r = length(p);

  vec3 sclera = vec3(0.97, 0.95, 0.91);
  float vein = fbm(p*18. + vec2(2.1, 0.4));
  sclera = mix(sclera, vec3(0.78, 0.42, 0.38), smoothstep(0.72, 1.1, r) * vein * 0.18);
  float shade = 0.55 + 0.45 * (1. - r * 0.55);
  sclera *= shade;

  float irisR = 0.48;
  float irisEdge = smoothstep(irisR+0.03, irisR-0.01, r);
  vec2 ip = p / irisR;
  float ang = atan(ip.y, ip.x);
  float rad = length(ip);

  float fibers = 0.;
  for (int k=0;k<5;k++){
    float fk = float(k);
    fibers += 0.22 * sin(ang * (18.+fk*7.) + fbm(ip*4.+fk)*6. + u_time*0.15);
  }
  fibers += fbm(vec2(ang*3.2, rad*8.))*1.1;
  float crypts = smoothstep(0.15, 0.45, fbm(ip*7. + 3.));
  float ring = smoothstep(0.28, 0.34, rad) * (1.-smoothstep(0.42, 0.52, rad));

  vec3 moss = vec3(0.07, 0.22, 0.14);
  vec3 leaf = vec3(0.18, 0.48, 0.28);
  vec3 gold = vec3(0.78, 0.58, 0.18);
  vec3 iris = mix(moss, leaf, clamp(fibers*0.45+0.35, 0., 1.));
  iris = mix(iris, gold, ring * 0.85 + crypts * 0.12);
  iris *= 0.55 + 0.55 * (1. - rad);
  float limbus = smoothstep(0.82, 1.02, rad);
  iris = mix(iris, vec3(0.04, 0.08, 0.05), limbus);

  float pupilR = mix(0.16, 0.28, u_pupil);
  float pupil = 1. - smoothstep(pupilR-0.02, pupilR+0.01, rad);
  iris = mix(iris, vec3(0.01, 0.015, 0.012), pupil);

  vec3 col = mix(sclera, iris, irisEdge);

  vec2 spec = p - vec2(-0.16, 0.18);
  col += vec3(1., 0.98, 0.92) * smoothstep(0.09, 0.02, length(spec)) * 0.95;
  col += vec3(0.9, 0.95, 1.) * smoothstep(0.18, 0.05, length(p-vec2(0.2,-0.12))) * 0.18;

  float wet = pow(max(0., 1. - lid*0.7), 4.) * 0.25;
  col += wet;

  float crease = smoothstep(0.78, 1.05, lid);
  col = mix(col, vec3(0.12, 0.09, 0.07), crease * 0.55);
  col = mix(parchment, col, eyeMask);
  float alpha = mix(0., 1., eyeMask);
  gl_FragColor = vec4(col, alpha);
}
`

  function compile(gl, type, src) {
    const s = gl.createShader(type)
    gl.shaderSource(s, src)
    gl.compileShader(s)
    return s
  }

  g.startVeyraEye = function startVeyraEye(canvas) {
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: true })
    if (!gl) return () => {}

    const dpr = Math.min(2, window.devicePixelRatio || 1)
    function size() {
      const w = Math.max(280, canvas.clientWidth || 320)
      const h = Math.round(w * 0.72)
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    size()

    const vs = compile(gl, gl.VERTEX_SHADER, VERT)
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
    const prog = gl.createProgram()
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn(gl.getProgramInfoLog(prog), gl.getShaderInfoLog(fs))
      return () => {}
    }
    gl.useProgram(prog)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'a')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(prog, 'u_res')
    const uTime = gl.getUniformLocation(prog, 'u_time')
    const uLook = gl.getUniformLocation(prog, 'u_look')
    const uBlink = gl.getUniformLocation(prog, 'u_blink')
    const uPupil = gl.getUniformLocation(prog, 'u_pupil')

    let lookX = 0, lookY = 0, tX = 0, tY = 0
    let blink = 1, blinkPhase = 0, nextBlink = 2.4
    let pupil = 0.45
    let running = true
    let raf = 0
    const t0 = performance.now()

    const move = (e) => {
      const r = canvas.getBoundingClientRect()
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width * 0.5)
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height * 0.5)
      tX = Math.max(-1, Math.min(1, dx))
      tY = Math.max(-1, Math.min(1, dy))
    }
    window.addEventListener('pointermove', move, { passive: true })

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    function frame(now) {
      if (!running) return
      raf = requestAnimationFrame(frame)
      const t = (now - t0) / 1000
      lookX += (tX - lookX) * 0.08
      lookY += (tY - lookY) * 0.08
      pupil += ((0.4 + Math.hypot(lookX, lookY) * 0.25) - pupil) * 0.04
      blinkPhase += 0.016
      if (blinkPhase > nextBlink) {
        const k = (blinkPhase - nextBlink) / 0.16
        blink = k < 1 ? 1 - k : k < 2 ? k - 1 : 1
        if (k >= 2) {
          blink = 1
          blinkPhase = 0
          nextBlink = 2.2 + Math.random() * 3.5
        }
      }
      gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.uniform1f(uTime, t)
      gl.uniform2f(uLook, lookX, -lookY)
      gl.uniform1f(uBlink, Math.max(0.05, blink))
      gl.uniform1f(uPupil, pupil)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }
    raf = requestAnimationFrame(frame)
    const onResize = () => size()
    window.addEventListener('resize', onResize)
    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('resize', onResize)
    }
  }
})(typeof window !== 'undefined' ? window : globalThis)
