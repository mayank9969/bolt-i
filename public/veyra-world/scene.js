
let sceneReady=false;
function showSceneStatus(message,failed=false){
  const status=document.querySelector('#sceneStatus');
  if(!status)return;
  status.textContent=message;
  status.classList.toggle('error',failed);
  status.setAttribute('role',failed?'alert':'status');
}
(async()=>{
const THREE = window.VeyraThree;
const GLTFLoader = window.VeyraGLTFLoader;

const stage = document.querySelector('#stage');
const canvas = document.querySelector('#world');
const selected = document.querySelector('#selected');
let performanceFrames=0,performanceWindowStart=performance.now();
window.addEventListener('error',event=>{if(!sceneReady)showSceneStatus('The 3D scene could not start: '+(event.message||'browser rendering error'),true);});
window.addEventListener('unhandledrejection',event=>{if(!sceneReady)showSceneStatus('The 3D scene could not start: '+(event.reason?.message||String(event.reason||'asset loading error')),true);});
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const subjects = [
  'Mathematics','Science','Technology','Python Programming','Computer Science',
  'Physics','Chemistry','Biology','Astronomy & Space','Geography','History',
  'English & Language','General Knowledge','Logic & Reasoning','Economics & Business'
];
const rand = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const clamp = THREE.MathUtils.clamp;
const smooth = (a,b,x) => { const t=clamp((x-a)/(b-a),0,1); return t*t*(3-2*t); };

const renderer = new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
const maxResolutionScale=Math.min(devicePixelRatio||1,1.2);
let resolutionScale=maxResolutionScale;
const minResolutionScale=Math.min(maxResolutionScale,.62);
renderer.setPixelRatio(resolutionScale);
function adaptResolutionToFps(fps){
  let next=resolutionScale;
  if(fps<60)next-=fps<45?.10:.06;
  else if(fps<72)next-=.025;
  else if(fps>96)next+=.025;
  next=clamp(next,minResolutionScale,maxResolutionScale);
  if(Math.abs(next-resolutionScale)>.014){
    resolutionScale=Number(next.toFixed(2));
    renderer.setPixelRatio(resolutionScale);
  }
}
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.04;
const performanceParams=new URLSearchParams(location.search);
renderer.shadowMap.enabled=performanceParams.get('shadows')!=='off';
renderer.shadowMap.type=THREE.PCFShadowMap;
renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xc9dce2);
scene.fog = new THREE.Fog(0xcbd7c9,430,1160);

const camera = new THREE.PerspectiveCamera(66,1,.1,900);
const startingCameraYaw=3.77,startingCameraPitch=-.31,cameraDistance=64;
const cameraHome = new THREE.Vector3(0,40,0);
const viewTarget = new THREE.Vector3(
  cameraHome.x+Math.sin(startingCameraYaw)*Math.cos(startingCameraPitch)*cameraDistance,
  cameraHome.y+Math.sin(startingCameraPitch)*cameraDistance,
  cameraHome.z-Math.cos(startingCameraYaw)*Math.cos(startingCameraPitch)*cameraDistance
);
camera.position.copy(cameraHome);
camera.lookAt(viewTarget);

const cloudCanvas=document.createElement('canvas');cloudCanvas.width=256;cloudCanvas.height=128;
const cloudCtx=cloudCanvas.getContext('2d'),cloudPixels=cloudCtx.createImageData(256,128);
const cloudPatches=Array.from({length:3},(_,i)=>{
  const centerX=.08+rand((i+1)*1601)*.84,centerY=.30+rand((i+1)*1607)*.20;
  const width=.19+rand((i+1)*1613)*.075,height=.105+rand((i+1)*1619)*.06;
  return[[-.78,.02,.40,.58],[-.53,.12,.58,.78],[-.28,-.12,.72,.92],[0,.02,1,.84],[.30,-.10,.78,.94],[.56,.12,.58,.76],[.80,.02,.40,.58]].map(([dx,dy,sx,sy],p)=>({
    x:centerX+dx*width,y:centerY+dy*height,rx:width*sx*.46,ry:height*sy*.48,seed:i*97+p*17
  }));
}).flat();
for(let py=0;py<128;py++)for(let px=0;px<256;px++){
  const u=px/256,v=py/128;let cloudMass=0;
  for(const puff of cloudPatches){
    let dx=Math.abs(u-puff.x);dx=Math.min(dx,1-dx);
    const nx=dx/puff.rx,ny=(v-puff.y)/puff.ry;
    cloudMass=Math.max(cloudMass,Math.exp(-(nx*nx+ny*ny)*1.55));
  }
  const billow=fractalNoise(px/256*27,py/128*19,1637);
  const edgeNoise=(billow-.5)*.27;
  const coverage=THREE.MathUtils.smoothstep(cloudMass+edgeNoise,.27,.74);
  const core=THREE.MathUtils.smoothstep(cloudMass,.48,.88);
  const shade=Math.round(206+core*43+(billow-.5)*16),alpha=Math.round(coverage*(148+core*82)),at=(py*256+px)*4;
  cloudPixels.data[at]=shade;cloudPixels.data[at+1]=Math.min(255,shade+10);cloudPixels.data[at+2]=Math.min(255,shade+22);cloudPixels.data[at+3]=alpha;
}
cloudCtx.putImageData(cloudPixels,0,0);
const cloudTexture=new THREE.CanvasTexture(cloudCanvas);
cloudTexture.wrapS=THREE.RepeatWrapping;cloudTexture.wrapT=THREE.ClampToEdgeWrapping;
const skyMaterial = new THREE.ShaderMaterial({
  side:THREE.BackSide,depthWrite:false,
  uniforms:{top:{value:new THREE.Color(0x70add0)},horizon:{value:new THREE.Color(0xe9ddc5)},sunDir:{value:new THREE.Vector3(-.45,.48,-.64).normalize()},moonDir:{value:new THREE.Vector3(0,.7,-.7).normalize()},cloudMap:{value:cloudTexture},uTime:{value:0},uNight:{value:0},uTwilight:{value:0}},
  vertexShader:'varying vec3 vDir;varying vec2 vSkyUv;void main(){vDir=normalize(position);vSkyUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:`
    uniform vec3 top;uniform vec3 horizon;uniform vec3 sunDir;uniform vec3 moonDir;uniform float uTime;uniform float uNight;uniform float uTwilight;uniform sampler2D cloudMap;varying vec3 vDir;varying vec2 vSkyUv;
    void main(){
      vec3 d=normalize(vDir);float h=d.y;float t=smoothstep(-.16,.56,h);
      vec3 c=mix(horizon,top,t);
      vec2 cloudUv=vSkyUv;
      vec2 lowUv=cloudUv+vec2(uTime*.0014,-uTime*.00015);
      vec4 cloudSample=texture2D(cloudMap,lowUv);
      float cloudMass=cloudSample.a;
      float cloudShape=smoothstep(.18,.69,cloudMass);
      float cloudBand=smoothstep(-.12,.08,h)*(1.0-smoothstep(.54,.78,h));
      float cloud=cloudShape*cloudBand;
      vec3 sunVector=normalize(sunDir);
      float sunGlow=pow(max(dot(d,sunVector),0.0),8.0);
      float sunCore=pow(max(dot(d,sunVector),0.0),34.0);
      float horizonGlow=exp(-pow((h-.035)/.19,2.0));
float cloudLight=smoothstep(.78,.99,cloudSample.r);
      vec3 cloudColor=mix(vec3(.60,.68,.75),vec3(.96,.98,.96),cloudLight);
      cloudColor=mix(cloudColor,vec3(1.0,.83,.65),sunGlow*.42);
      cloudColor=mix(cloudColor,vec3(.42,.52,.70),uNight*.72);
      c=mix(c,cloudColor,cloud*.68);
      c=mix(c,vec3(.96,.68,.52),horizonGlow*(.06+uTwilight*.28));
      c+=vec3(1.0,.76,.54)*(sunGlow*.12+sunCore*.18)*(1.0-uNight*.9);
      float stars=0.0;
      float sunDot=max(dot(d,sunVector),0.0);
      float sunDisc=smoothstep(cos(radians(1.05)),cos(radians(.42)),sunDot)*(1.0-uNight*.92);
      c+=vec3(1.0,.78,.52)*sunDisc*1.35;
      float moonDot=max(dot(d,normalize(moonDir)),0.0);
      float moonDisc=smoothstep(cos(radians(1.1)),cos(radians(.42)),moonDot)*uNight;
      float moonHalo=pow(max(moonDot,0.0),24.0)*uNight;
      c+=vec3(.75,.84,1.0)*(stars*.92+moonDisc*.96+moonHalo*.2);
      gl_FragColor=vec4(c,1.0);
    }`
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(820,40,24),skyMaterial);
scene.add(sky);
// Clear, separate sun and moon discs track the same orbital path as the lighting.
const sunBody=new THREE.Mesh(new THREE.SphereGeometry(19,18,14),new THREE.MeshBasicMaterial({color:0xffe5a8,toneMapped:false}));
const moonBody=new THREE.Mesh(new THREE.SphereGeometry(17,18,14),new THREE.MeshBasicMaterial({color:0xd7e3f5,toneMapped:false}));
sunBody.frustumCulled=false;moonBody.frustumCulled=false;sunBody.castShadow=false;moonBody.castShadow=false;
scene.add(sunBody,moonBody);
const starCount=180,starPositions=new Float32Array(starCount*3);
for(let i=0;i<starCount;i++){const y=.035+rand(i*1379)*.93,angle=rand(i*1381)*Math.PI*2,radius=Math.sqrt(1-y*y)*795;starPositions.set([Math.cos(angle)*radius,y*795,Math.sin(angle)*radius],i*3);}
const starGeometry=new THREE.BufferGeometry();starGeometry.setAttribute('position',new THREE.BufferAttribute(starPositions,3));
const starMaterial=new THREE.PointsMaterial({color:0xdce9ff,size:1.8,sizeAttenuation:false,transparent:true,opacity:0,depthWrite:false});
const starField=new THREE.Points(starGeometry,starMaterial);starField.frustumCulled=false;scene.add(starField);

const hemi = new THREE.HemisphereLight(0xf4f5ec,0x405b43,1.92);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xf3e7cd,2.22);
sun.position.set(-48,80,42);
sun.castShadow=renderer.shadowMap.enabled;
sun.shadow.mapSize.set(512,512);
sun.shadow.camera.left=-105;sun.shadow.camera.right=105;
sun.shadow.camera.top=105;sun.shadow.camera.bottom=-105;
sun.shadow.bias=-0.00025;
sun.shadow.radius=7;
sun.shadow.intensity=.28;
scene.add(sun);
const bounce = new THREE.DirectionalLight(0xa6c9bd,.42);
bounce.position.set(55,34,-65);
scene.add(bounce);
const moonLight=new THREE.DirectionalLight(0xaec9ef,0);
moonLight.position.set(40,-90,-30);scene.add(moonLight);

let mineLantern=null;
const atmospherePalette={
  dayTop:new THREE.Color(0x68a9d3),dawnTop:new THREE.Color(0x756b8a),nightTop:new THREE.Color(0x1c304b),
  dayHorizon:new THREE.Color(0xead9bb),dawnHorizon:new THREE.Color(0xee9874),nightHorizon:new THREE.Color(0x3c5365),
  dayFog:new THREE.Color(0xc7d8c7),dawnFog:new THREE.Color(0xbd8e7a),nightFog:new THREE.Color(0x2d4254),
  dayGround:new THREE.Color(0x435d43),nightGround:new THREE.Color(0x50644f),
  dayHemisphere:new THREE.Color(0xf5f6eb),nightHemisphere:new THREE.Color(0xc2d2e6),
  daySun:new THREE.Color(0xffedcf),dawnSun:new THREE.Color(0xffa66e)
};
const cycleSunDirection=new THREE.Vector3(),cycleMoonDirection=new THREE.Vector3(),celestialForward=new THREE.Vector3(),celestialRight=new THREE.Vector3(),celestialUp=new THREE.Vector3(),celestialQuaternion=new THREE.Quaternion();
const dayCycleDuration=120;
function updateDayNight(seconds){
  const phase=seconds/dayCycleDuration*Math.PI*2+.82;
  const elevation=Math.sin(phase);
  const daylight=smooth(-.18,.52,elevation);
  const twilight=1-smooth(.04,.62,Math.abs(elevation));
  const night=1-daylight;
  camera.getWorldQuaternion(celestialQuaternion);
  celestialForward.set(0,0,-1).applyQuaternion(celestialQuaternion);
  celestialRight.set(1,0,0).applyQuaternion(celestialQuaternion);
  celestialUp.set(0,1,0).applyQuaternion(celestialQuaternion);
  const arcX=Math.cos(phase)*.42,arcY=Math.sin(phase)*.55;
  cycleSunDirection.copy(celestialForward).multiplyScalar(.86).addScaledVector(celestialRight,arcX).addScaledVector(celestialUp,arcY).normalize();
  cycleMoonDirection.copy(celestialForward).multiplyScalar(.86).addScaledVector(celestialRight,-arcX).addScaledVector(celestialUp,Math.max(.22,Math.abs(arcY))).normalize();
  skyMaterial.uniforms.sunDir.value.copy(cycleSunDirection);
  skyMaterial.uniforms.moonDir.value.copy(cycleMoonDirection);
  sunBody.position.copy(cycleSunDirection).multiplyScalar(760);
  moonBody.position.copy(cycleMoonDirection).multiplyScalar(760);
  sunBody.visible=daylight>.12;
  moonBody.visible=night>.26;
  skyMaterial.uniforms.uNight.value=night;
  starMaterial.opacity=night*.9;starField.visible=night>.05;
  skyMaterial.uniforms.uTwilight.value=twilight;
  skyMaterial.uniforms.top.value.copy(atmospherePalette.nightTop).lerp(atmospherePalette.dayTop,daylight).lerp(atmospherePalette.dawnTop,twilight*.62);
  skyMaterial.uniforms.horizon.value.copy(atmospherePalette.nightHorizon).lerp(atmospherePalette.dayHorizon,daylight).lerp(atmospherePalette.dawnHorizon,twilight*.74);
  scene.background.copy(skyMaterial.uniforms.top.value);
  scene.fog.color.copy(atmospherePalette.nightFog).lerp(atmospherePalette.dayFog,daylight).lerp(atmospherePalette.dawnFog,twilight*.38);
  hemi.color.copy(atmospherePalette.nightHemisphere).lerp(atmospherePalette.dayHemisphere,daylight);
  hemi.groundColor.copy(atmospherePalette.nightGround).lerp(atmospherePalette.dayGround,daylight);
  hemi.intensity=1.24+daylight*1.33;
  sun.color.copy(atmospherePalette.daySun).lerp(atmospherePalette.dawnSun,twilight*.62);
  sun.position.copy(cycleSunDirection).multiplyScalar(220);
  sun.intensity=.045+daylight*2.34+twilight*.26;
  moonLight.position.copy(cycleMoonDirection).multiplyScalar(220);
  moonLight.intensity=night*1.78+twilight*.2;
  bounce.intensity=.3+daylight*.4;
  if(mineLantern)mineLantern.intensity=night*3.6+twilight*.7;
}

function terrainNoise(x,y,seed){
  let sum=0,amp=.58,norm=0;
  for(let octave=0;octave<3;octave++){sum+=valueNoise(x,y,seed+octave*17)*amp;norm+=amp;x*=2.03;y*=2.03;amp*=.5;}
  return sum/norm;
}
function terrainHeight(x,z){
  const broad=terrainNoise(x*.0038,z*.0038,37);
  const ridge=terrainNoise(x*.012,z*.012,43);
  const detail=terrainNoise(x*.045,z*.047,61);
  const fineRidge=terrainNoise(x*.022,z*.024,83);
  const hillA=19*Math.exp(-Math.pow((x+285)/205,2)-Math.pow((z+170)/145,2));
  const hillB=16*Math.exp(-Math.pow((x-260)/225,2)-Math.pow((z+40)/170,2));
  const hillC=21*Math.exp(-Math.pow((x+35)/185,2)-Math.pow((z-310)/205,2));
  const hillD=17*Math.exp(-Math.pow((x+145)/190,2)-Math.pow((z+145)/105,2));
  const hillE=15*Math.exp(-Math.pow((x-155)/165,2)-Math.pow((z+280)/135,2));
  const hillF=25*Math.exp(-Math.pow((x-255)/145,2)-Math.pow((z-155)/210,2));
  const hillG=21*Math.exp(-Math.pow((x+315)/175,2)-Math.pow((z-95)/190,2));
  const hillH=17*Math.exp(-Math.pow(x/220,2)-Math.pow((z-440)/150,2));
  const basin=-9*Math.exp(-Math.pow(x/180,2)-Math.pow((z+20)/220,2));
  const folds=(terrainNoise(x*.009,z*.009,101)-.5)*17;
  return -22
    +5.5*Math.sin(x*.006+z*.004)
    +4.2*Math.cos(z*.007-x*.006)
    +2.5*Math.sin((x+z)*.014)
    +(broad-.5)*46
    +(ridge-.5)*29
    +(detail-.5)*9
    +(fineRidge-.5)*11
    +folds+hillA+hillB+hillC+hillD+hillE+hillF+hillG+hillH+basin;
}
function valueNoise(x,y,seed){
  const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;
  const h=(a,b)=>rand((a+seed*31)*374761393+(b+seed*17)*668265263);
  const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
  const a=h(xi,yi),b=h(xi+1,yi),c=h(xi,yi+1),d=h(xi+1,yi+1);
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(a,b,u),THREE.MathUtils.lerp(c,d,u),v);
}
function fractalNoise(x,y,seed){
  let sum=0,amp=.55,norm=0;
  for(let octave=0;octave<4;octave++){sum+=valueNoise(x,y,seed+octave*17)*amp;norm+=amp;x*=2.03;y*=2.03;amp*=.5;}
  return sum/norm;
}
const gltfLoader=new GLTFLoader();
async function loadEmbeddedModel(encoded){
  const response=await fetch('data:model/gltf-binary;base64,'+encoded);
  if(!response.ok)throw new Error('Embedded model data could not be decoded.');
  const binary=await response.arrayBuffer();
  return new Promise((resolve,reject)=>gltfLoader.parse(binary,'',gltf=>resolve(gltf.scene),reject));
}
if(!THREE||!GLTFLoader)throw new Error('Three.js did not load.');
if(!stage||!canvas)throw new Error('Archipelago canvas is missing.');
function loadUrlModel(url){
  return new Promise((resolve,reject)=>gltfLoader.load(url,gltf=>resolve(gltf.scene),undefined,reject));
}
const [detailTreeSource,forestTreeSource,...islandSources]=await Promise.all([
  loadUrlModel('/models/veyra_canopy_tree_detail.glb'),
  loadUrlModel('/models/veyra_canopy_tree_forest.glb'),
  loadUrlModel('/models/veyra_floating_island_01.glb'),
  loadUrlModel('/models/veyra_floating_island_02.glb'),
  loadUrlModel('/models/veyra_floating_island_03.glb'),
  loadUrlModel('/models/veyra_floating_island_04.glb'),
]);
let terrainField=null;
function terrainElevation(x,z){
  if(!terrainField)return terrainHeight(x,z)+(terrainNoise(x*.025,z*.026,3)-.5)*2.1;
  const{width,depth,nx,nz,heights}=terrainField;
  const gx=clamp((x/width+.5)*nx,0,nx),gz=clamp((z/depth+.5)*nz,0,nz);
  const ix=Math.min(Math.floor(gx),nx-1),iz=Math.min(Math.floor(gz),nz-1),tx=gx-ix,tz=gz-iz,stride=nx+1;
  const a=heights[iz*stride+ix],b=heights[iz*stride+ix+1],c=heights[(iz+1)*stride+ix],d=heights[(iz+1)*stride+ix+1];
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(a,b,tx),THREE.MathUtils.lerp(c,d,tx),tz);
}

const ridgeLayers=[
  {radius:440,width:208,seed:4,base:-17,peak:78,near:0x284a32,far:0x4f7048},
  {radius:650,width:250,seed:27,base:-25,peak:108,near:0x385b49,far:0x687b68},
  {radius:860,width:300,seed:51,base:-35,peak:144,near:0x62796f,far:0x9baaa1}
];
function ridgeSurface(layer,angle,t){
  const broad=fractalNoise(Math.cos(angle)*3.4,Math.sin(angle)*3.4,layer.seed);
  const detail=fractalNoise(Math.cos(angle)*10.5,Math.sin(angle)*10.5,layer.seed+31);
  const peakWave=.5+.5*Math.sin(angle*(3+(layer.seed%3))+layer.seed*.31);
  const shoulders=.5+.5*Math.sin(angle*2.1-layer.seed*.47);
  const angular=clamp(.22+broad*.32+(detail-.5)*.18+Math.pow(peakWave,2.5)*.38+shoulders*.12,.15,1.04);
  const summit=layer.peak*angular+(detail-.5)*8;
  const ridgeShape=Math.pow(Math.max(0,Math.cos((t-.5)*Math.PI)),1.15);
  const rough=(fractalNoise(angle*layer.radius*.012,t*9,layer.seed+71)-.5)*7.8;
  const closeRock=layer.seed===4?(fractalNoise(Math.cos(angle)*layer.radius*.072+t*13,Math.sin(angle)*layer.radius*.072-t*17,layer.seed+97)-.5)*10.5:0;
  return{y:layer.base+summit*ridgeShape+(rough+closeRock)*ridgeShape,detail,ridgeShape};
}

function buildDistantRidges(){
  const rock=new THREE.Color(0x777363);
  for(const layer of ridgeLayers){
    const closeRange=layer.seed===4;
    const around=closeRange?420:(layer.seed===27?280:200),across=closeRange?20:(layer.seed===27?14:10),positions=[],colors=[],indices=[];
    const low=new THREE.Color(layer.near),high=new THREE.Color(layer.far);
    for(let j=0;j<=around;j++){
      const angle=j/around*Math.PI*2;
      const detail=fractalNoise(Math.cos(angle)*10.5,Math.sin(angle)*10.5,layer.seed+31);
      for(let i=0;i<=across;i++){
        const t=i/across,surface=ridgeSurface(layer,angle,t),radius=layer.radius+(t-.5)*layer.width;
        positions.push(Math.cos(angle)*radius,surface.y,Math.sin(angle)*radius);
        const shade=.26+surface.ridgeShape*.44+detail*.18;
        const fine=closeRange?fractalNoise(Math.cos(angle)*51+t*16,Math.sin(angle)*51-t*21,layer.seed+103):detail;
        const flank=smooth(.08,.34,Math.abs(t-.5));
        const strata=.5+.5*Math.sin(t*36+detail*13+fine*9+angle*3);
        const exposure=closeRange?clamp(flank*(.16+strata*.25+(fine-.5)*.18),0,.44):smooth(.68,.98,surface.ridgeShape)*.16;
        const mottling=.91+detail*.13+(closeRange?(fine-.5)*.1:0)+Math.sin(angle*29+t*21+layer.seed)*.025;
        const c=low.clone().lerp(high,clamp(shade,0,1)).lerp(rock,exposure);
        c.multiplyScalar(mottling*(closeRange?1-flank*(.035+strata*.025):1));
        colors.push(c.r,c.g,c.b);
      }
    }
    for(let j=0;j<around;j++)for(let i=0;i<across;i++){
      const a=j*(across+1)+i,b=a+across+1;
      indices.push(a,a+1,b,b,a+1,b+1);
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    geo.setIndex(indices);geo.computeVertexNormals();geo.computeBoundingSphere();
    const mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide}));
    mesh.frustumCulled=true;scene.add(mesh);
  }
}

function buildMineEntrance(layer,angle,radius){
  const t=clamp((radius-(layer.radius-layer.width/2))/layer.width,0,1);
  const ridgeY=ridgeSurface(layer,angle,t).y;
  const group=new THREE.Group(),inset=2.5;
  group.position.set(Math.cos(angle)*(radius+inset),ridgeY-13,Math.sin(angle)*(radius+inset));
  group.rotation.y=Math.atan2(-Math.cos(angle),-Math.sin(angle));

  const facadeShape=new THREE.Shape();
  facadeShape.moveTo(-31,0);facadeShape.lineTo(-37,8);facadeShape.lineTo(-33,19);
  facadeShape.lineTo(-25,28);facadeShape.lineTo(-12,34);facadeShape.lineTo(4,36);
  facadeShape.lineTo(20,32);facadeShape.lineTo(31,24);facadeShape.lineTo(37,11);
  facadeShape.lineTo(32,0);facadeShape.closePath();
  const opening=new THREE.Path();
  opening.moveTo(-12,0);opening.lineTo(-12,13);
  opening.bezierCurveTo(-12,26,12,26,12,13);opening.lineTo(12,0);opening.closePath();
  facadeShape.holes.push(opening);

  const rockGeometry=new THREE.ExtrudeGeometry(facadeShape,{depth:12,steps:1,bevelEnabled:true,bevelSegments:1,bevelSize:1.15,bevelThickness:1.2,curveSegments:10});
  const rockPosition=rockGeometry.getAttribute('position'),rockColors=[];
  for(let i=0;i<rockPosition.count;i++){
    const x=rockPosition.getX(i),y=rockPosition.getY(i),z=rockPosition.getZ(i);
    const mineral=fractalNoise(x*.12+z*.07,y*.14+z*.05,521);
    const strata=.5+.5*Math.sin(y*.78+x*.11);
    const shade=.78+mineral*.24+strata*.055;
    rockColors.push(shade,shade*.96,shade*.86);
  }
  rockGeometry.setAttribute('color',new THREE.Float32BufferAttribute(rockColors,3));
  rockGeometry.computeVertexNormals();
  const caveRockMaterial=new THREE.MeshStandardMaterial({color:0x777360,vertexColors:true,roughness:1,flatShading:true});
  const facade=new THREE.Mesh(rockGeometry,caveRockMaterial);
  facade.position.z=0;facade.castShadow=true;facade.receiveShadow=true;group.add(facade);

  const tunnelShape=new THREE.Shape();
  tunnelShape.moveTo(-12,0);tunnelShape.lineTo(-12,13);
  tunnelShape.bezierCurveTo(-12,26,12,26,12,13);tunnelShape.lineTo(12,0);tunnelShape.closePath();
  const darkness=new THREE.Mesh(new THREE.ShapeGeometry(tunnelShape,16),new THREE.MeshBasicMaterial({color:0x080b0b,side:THREE.DoubleSide}));
  const liningShape=new THREE.Shape();
  liningShape.moveTo(-16,0);liningShape.lineTo(-16,14);
  liningShape.bezierCurveTo(-16,24,-8,31,0,31);
  liningShape.bezierCurveTo(8,31,16,24,16,14);liningShape.lineTo(16,0);liningShape.closePath();
  const liningOpening=new THREE.Path();
  liningOpening.moveTo(-12,0);liningOpening.lineTo(-12,13);
  liningOpening.bezierCurveTo(-12,26,12,26,12,13);liningOpening.lineTo(12,0);liningOpening.closePath();
  liningShape.holes.push(liningOpening);
  const liningGeometry=new THREE.ExtrudeGeometry(liningShape,{depth:30,steps:1,bevelEnabled:false,curveSegments:12});
  const lining=new THREE.Mesh(liningGeometry,new THREE.MeshStandardMaterial({color:0x625d4e,roughness:1,flatShading:true}));
  lining.rotation.y=Math.PI;lining.position.z=12;lining.castShadow=false;lining.receiveShadow=true;group.add(lining);
  darkness.position.set(0,0,-18.05);group.add(darkness);

  const rimGeometry=new THREE.IcosahedronGeometry(1,1),rimVertices=rimGeometry.attributes.position;
  for(let i=0;i<rimVertices.count;i++){
    const v=new THREE.Vector3().fromBufferAttribute(rimVertices,i);
    v.multiplyScalar(.9+rand(i*881)*.22);v.y*=.78+rand(i*883)*.34;
    rimVertices.setXYZ(i,v.x,v.y,v.z);
  }
  rimVertices.needsUpdate=true;rimGeometry.computeVertexNormals();rimGeometry.computeBoundingSphere();
  const rimStones=[[-25,3,3.2],[-25,12,3.6],[-20,21,4.1],[-13,29,3.7],[-3,33,3.4],[9,30,3.9],[19,22,4],[25,13,3.6],[25,4,3.2],[-32,7,2.1],[-30,18,2.2],[-17,31,2.1],[-7,35,1.9],[14,33,2.1],[30,19,2],[32,7,2.2]];
  const rim=new THREE.InstancedMesh(rimGeometry,new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,flatShading:true}),rimStones.length);
  const stoneDummy=new THREE.Object3D();
  rimStones.forEach((stone,i)=>{
    const [x,y,size]=stone;
    stoneDummy.position.set(x,y,12.9);stoneDummy.rotation.set(rand(i*887)*.4,rand(i*889)*6.28,rand(i*891)*.4);
    stoneDummy.scale.set(size*(.85+rand(i*893)*.35),size*(.7+rand(i*895)*.35),size*(.72+rand(i*897)*.38));
    stoneDummy.updateMatrix();rim.setMatrixAt(i,stoneDummy.matrix);
    rim.setColorAt(i,new THREE.Color().setHSL(.11+rand(i*899)*.04,.12+rand(i*901)*.12,.38+rand(i*903)*.12));
  });
  rim.instanceMatrix.needsUpdate=true;if(rim.instanceColor)rim.instanceColor.needsUpdate=true;
  rim.castShadow=false;rim.receiveShadow=true;group.add(rim);

  const timber=new THREE.MeshStandardMaterial({color:0x594632,roughness:1});
  const metal=new THREE.MeshStandardMaterial({color:0x353b36,metalness:.3,roughness:.86});
  function beam(a,b,r){
    const direction=b.clone().sub(a),length=direction.length();
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r*.78,r,length,6),timber);
    mesh.position.copy(a).add(b).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());
    mesh.castShadow=true;group.add(mesh);
  }
  beam(new THREE.Vector3(-13,0,13.2),new THREE.Vector3(-13,21,13.2),.72);
  beam(new THREE.Vector3(13,0,13.2),new THREE.Vector3(13,21,13.2),.72);
  beam(new THREE.Vector3(-14,21,13.2),new THREE.Vector3(14,21,13.2),.78);
  for(const x of [-1.7,1.7]){
    const rail=new THREE.Mesh(new THREE.BoxGeometry(.36,.22,30),metal);
    rail.position.set(x,.22,-3);group.add(rail);
  }
  const sleeperGeometry=new THREE.BoxGeometry(4.6,.26,.62);
  const sleepers=new THREE.InstancedMesh(sleeperGeometry,timber,8),sleeperDummy=new THREE.Object3D();
  for(let i=0;i<8;i++){
    sleeperDummy.position.set(0,.08,10-i*4);sleeperDummy.rotation.y=(rand(i*947)-.5)*.018;
    sleeperDummy.updateMatrix();sleepers.setMatrixAt(i,sleeperDummy.matrix);
  }
  sleepers.instanceMatrix.needsUpdate=true;group.add(sleepers);
  const lamp=new THREE.Mesh(new THREE.SphereGeometry(.72,8,6),new THREE.MeshStandardMaterial({color:0xffc36b,emissive:0xe28a35,emissiveIntensity:.9,roughness:.48}));
  lamp.position.set(-17,17,8);group.add(lamp);
  mineLantern=new THREE.PointLight(0xffb45e,0,84,2);
  mineLantern.position.set(-17,16,8.5);group.add(mineLantern);
  scene.add(group);
}

function buildTerrain(){
  const width=1500,depth=1500,nx=288,nz=288,tileCells=48;
  const positions=[],colors=[],uvs=[],indices=[],heights=new Float32Array((nx+1)*(nz+1));
  const stepX=width/nx,stepZ=depth/nz;
  const deep=new THREE.Color(0x2d5034),forest=new THREE.Color(0x547746),sunlit=new THREE.Color(0x82915a),high=new THREE.Color(0x8c8468),earth=new THREE.Color(0x756950);
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
    const x=(i/nx-.5)*width,z=(j/nz-.5)*depth;
    const y=terrainHeight(x,z)+(terrainNoise(x*.025,z*.026,3)-.5)*2.1;
    heights[j*(nx+1)+i]=y;positions.push(x,y,z);uvs.push(i/nx*18,j/nz*18);
  }
  terrainField={width,depth,nx,nz,heights};
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
    const index=j*(nx+1)+i,x=(i/nx-.5)*width,z=(j/nz-.5)*depth,y=heights[index];
    const patch=terrainNoise(x*.025,z*.027,9),fine=terrainNoise(x*.11,z*.12,21);
    const left=heights[j*(nx+1)+Math.max(0,i-1)],right=heights[j*(nx+1)+Math.min(nx,i+1)];
    const up=heights[Math.max(0,j-1)*(nx+1)+i],down=heights[Math.min(nz,j+1)*(nx+1)+i];
    const slope=Math.hypot((right-left)/(2*stepX),(down-up)/(2*stepZ));
    const elevation=smooth(-38,-2,y),exposed=smooth(.38,.95,slope)*.28;
    const c=deep.clone().lerp(forest,smooth(.18,.78,patch)).lerp(sunlit,smooth(.55,.9,fine)*.27).lerp(high,elevation*.2).lerp(earth,exposed);
    const fleck=.96+Math.abs(patch-fine)*.16;
    colors.push(c.r*fleck,c.g*fleck,c.b*fleck);
  }
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){
    const a=j*(nx+1)+i,b=a+nx+1;
    indices.push(a,b,a+1,b,b+1,a+1);
  }
  const sourceGeo=new THREE.BufferGeometry();
  sourceGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  sourceGeo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  sourceGeo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  sourceGeo.setIndex(indices);sourceGeo.computeVertexNormals();
  const textureSize=512,textureCanvas=document.createElement('canvas');textureCanvas.width=textureSize;textureCanvas.height=textureSize;
  const ctx=textureCanvas.getContext('2d'),image=ctx.createImageData(textureSize,textureSize);
  const hash=(x,y,seed)=>{let n=(Math.imul(x+seed,374761393)^Math.imul(y-seed,668265263));n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295;};
  const pixelNoise=(x,y,scale,seed)=>{
    const fx=x/scale,fy=y/scale,ix=Math.floor(fx),iy=Math.floor(fy),tx=fx-ix,ty=fy-iy;
    const u=tx*tx*(3-2*tx),v=ty*ty*(3-2*ty);
    const a=hash(ix,iy,seed),b=hash(ix+1,iy,seed),c=hash(ix,iy+1,seed),d=hash(ix+1,iy+1,seed);
    return THREE.MathUtils.lerp(THREE.MathUtils.lerp(a,b,u),THREE.MathUtils.lerp(c,d,u),v);
  };
  for(let py=0;py<textureSize;py++)for(let px=0;px<textureSize;px++){
    const broad=pixelNoise(px,py,68,19),grain=pixelNoise(px,py,20,37),speckle=pixelNoise(px,py,6,71),n=(broad-.5)*42+(grain-.5)*30+(speckle-.5)*16,at=(py*textureSize+px)*4;
    image.data[at]=Math.max(0,Math.min(255,218+n*.43));
    image.data[at+1]=Math.max(0,Math.min(255,224+n*.40));
    image.data[at+2]=Math.max(0,Math.min(255,205+n*.36));image.data[at+3]=255;
  }
  ctx.putImageData(image,0,0);
  const groundTexture=new THREE.CanvasTexture(textureCanvas);
  groundTexture.colorSpace=THREE.SRGBColorSpace;groundTexture.wrapS=THREE.RepeatWrapping;groundTexture.wrapT=THREE.RepeatWrapping;
  groundTexture.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),4);
  const material=new THREE.MeshStandardMaterial({map:groundTexture,vertexColors:true,roughness:1});
  const position=sourceGeo.getAttribute('position'),color=sourceGeo.getAttribute('color'),uv=sourceGeo.getAttribute('uv'),normal=sourceGeo.getAttribute('normal');
  const makeCoords=coarse=>coarse?[0,1,...Array.from({length:23},(_,i)=>(i+1)*2),47,48]:Array.from({length:tileCells+1},(_,i)=>i);
  for(let j0=0;j0<nz;j0+=tileCells)for(let i0=0;i0<nx;i0+=tileCells){
    const cx=((i0+tileCells*.5)/nx-.5)*width,cz=((j0+tileCells*.5)/nz-.5)*depth;
    const coarse=Math.hypot(cx,cz)>360,xs=makeCoords(coarse),zs=makeCoords(coarse),tilePositions=[],tileColors=[],tileUvs=[],tileNormals=[],tileIndices=[];
    for(const localJ of zs)for(const localI of xs){
      const sourceIndex=(j0+localJ)*(nx+1)+(i0+localI);
      tilePositions.push(position.getX(sourceIndex),position.getY(sourceIndex),position.getZ(sourceIndex));
      tileColors.push(color.getX(sourceIndex),color.getY(sourceIndex),color.getZ(sourceIndex));
      tileUvs.push(uv.getX(sourceIndex),uv.getY(sourceIndex));
      tileNormals.push(normal.getX(sourceIndex),normal.getY(sourceIndex),normal.getZ(sourceIndex));
    }
    for(let j=0;j<zs.length-1;j++)for(let i=0;i<xs.length-1;i++){
      const a=j*xs.length+i,b=a+xs.length;
      tileIndices.push(a,b,a+1,b,b+1,a+1);
    }
    const tileGeo=new THREE.BufferGeometry();
    tileGeo.setAttribute('position',new THREE.Float32BufferAttribute(tilePositions,3));
    tileGeo.setAttribute('color',new THREE.Float32BufferAttribute(tileColors,3));
    tileGeo.setAttribute('uv',new THREE.Float32BufferAttribute(tileUvs,2));
    tileGeo.setAttribute('normal',new THREE.Float32BufferAttribute(tileNormals,3));
    tileGeo.setIndex(tileIndices);tileGeo.computeBoundingSphere();
    const tile=new THREE.Mesh(tileGeo,material);tile.frustumCulled=true;tile.receiveShadow=true;scene.add(tile);
  }
  sourceGeo.dispose();
}
buildTerrain();
buildForestTrail();
buildDistantRidges();
const mineZ=-402,mineX=trailCenterX(mineZ),mineAngle=Math.atan2(mineZ,mineX),mineRadius=Math.hypot(mineX,mineZ);
buildMineEntrance(ridgeLayers[0],mineAngle,mineRadius);

function trailCenterX(z){
  return Math.sin((z+32)*.009)*39+Math.sin(z*.019)*10-4;
}
function buildForestTrail(){
  const segments=148,bands=[-1.35,-1.08,-.90,-.72,-.54,-.32,0,.32,.54,.72,.90,1.08,1.35];
  const positions=[],colors=[],uvs=[],indices=[];
  const lane=new THREE.Color(0x907c5a),shoulder=new THREE.Color(0x6c6148);
  const rutColor=new THREE.Color(0x514937),verge=new THREE.Color(0x566d43);
  for(let i=0;i<=segments;i++){
    const t=i/segments,z=280-t*700,x=trailCenterX(z);
    const slope=(trailCenterX(z+.7)-trailCenterX(z-.7))/.7;
    const side=new THREE.Vector2(1,-slope).normalize();
    const halfWidth=5.25+.38*Math.sin(i*.19)+.22*Math.sin(i*.53);
    for(let j=0;j<bands.length;j++){
      const s=bands[j],abs=Math.abs(s),px=x+side.x*s*halfWidth,pz=z+side.y*s*halfWidth;
      const edge=smooth(.76,1.14,abs),grassEdge=smooth(1.03,1.35,abs);
      const rut=Math.exp(-Math.pow((abs-.36)/.13,2));
      const grit=terrainNoise(px*.095,pz*.10,147);
      const c=lane.clone().lerp(shoulder,edge*.58).lerp(rutColor,rut*.44).lerp(verge,grassEdge*.64);
      c.multiplyScalar(.87+grit*.24);
      const crown=.11*(1-smooth(0,1.35,abs));
      positions.push(px,terrainElevation(px,pz)+.075+crown,pz);
      colors.push(c.r,c.g,c.b);
      uvs.push((s+1.35)/2.7,t*34);
    }
  }
  for(let i=0;i<segments;i++)for(let j=0;j<bands.length-1;j++){
    const a=i*bands.length+j,b=a+bands.length;
    indices.push(a,b,a+1,b,b+1,a+1);
  }
  const gritCanvas=document.createElement('canvas');gritCanvas.width=256;gritCanvas.height=256;
  const ctx=gritCanvas.getContext('2d'),image=ctx.createImageData(256,256);
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){
    const n=201+Math.floor(rand(x*71+y*137)*46),i=(y*256+x)*4;
    image.data[i]=n;image.data[i+1]=n;image.data[i+2]=n;image.data[i+3]=255;
  }
  ctx.putImageData(image,0,0);
  const roadTexture=new THREE.CanvasTexture(gritCanvas);
  roadTexture.colorSpace=THREE.SRGBColorSpace;
  roadTexture.wrapS=THREE.RepeatWrapping;roadTexture.wrapT=THREE.RepeatWrapping;
  roadTexture.repeat.set(1,1);
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingSphere();
  const material=new THREE.MeshStandardMaterial({map:roadTexture,bumpMap:roadTexture,bumpScale:.08,vertexColors:true,roughness:.98,side:THREE.DoubleSide});
  const path=new THREE.Mesh(geometry,material);
  path.receiveShadow=true;path.castShadow=false;path.frustumCulled=true;scene.add(path);
}


function buildTerrainRocks(){
  const columns=52,rows=52,spacing=29,count=columns*rows,cellSize=160;
  const geometry=new THREE.IcosahedronGeometry(1,1),vertices=geometry.attributes.position;
  for(let i=0;i<vertices.count;i++){
    const v=new THREE.Vector3().fromBufferAttribute(vertices,i),variation=.82+rand(i*191)*.34;
    v.multiplyScalar(variation);v.y*=.72+rand(i*193)*.22;vertices.setXYZ(i,v.x,v.y,v.z);
  }
  vertices.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();
  const material=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.96,flatShading:true}),dummy=new THREE.Object3D(),chunks=new Map();
  for(let i=0;i<count;i++){
    const column=i%columns,row=Math.floor(i/columns);
    const x=-(columns-1)*spacing*.5+column*spacing+(rand(i*199)-.5)*34;
    const z=-(rows-1)*spacing*.5+row*spacing+(rand(i*201)-.5)*34;
    const groundNoise=terrainNoise(x*.017,z*.018,189);
    if(rand(i*197)>.36+groundNoise*.56)continue;
    if(Math.abs(x-trailCenterX(z))<10.5)continue;
    const size=.62+Math.pow(rand(i*207),1.2)*2.35;
    const sx=size*(.82+rand(i*209)*.72),sy=size*(.38+rand(i*211)*.48),sz=size*(.72+rand(i*213)*.72);
    dummy.position.set(x,terrainElevation(x,z)+sy*.78,z);
    dummy.rotation.set((rand(i*215)-.5)*.3,rand(i*217)*Math.PI*2,(rand(i*219)-.5)*.26);
    dummy.scale.set(sx,sy,sz);dummy.updateMatrix();
    const key=Math.floor(x/cellSize)+','+Math.floor(z/cellSize);
    if(!chunks.has(key))chunks.set(key,[]);
    chunks.get(key).push({matrix:dummy.matrix.clone(),tint:new THREE.Color().setHSL(.085+rand(i*221)*.09,.11+rand(i*223)*.17,.29+rand(i*225)*.16)});
  }
  for(const items of chunks.values()){
    const rocks=new THREE.InstancedMesh(geometry,material,items.length);
    items.forEach((item,index)=>{rocks.setMatrixAt(index,item.matrix);rocks.setColorAt(index,item.tint);});
    rocks.instanceMatrix.needsUpdate=true;if(rocks.instanceColor)rocks.instanceColor.needsUpdate=true;
    rocks.castShadow=false;rocks.receiveShadow=true;rocks.computeBoundingSphere();rocks.boundingSphere.radius+=2;rocks.frustumCulled=true;scene.add(rocks);
  }
}
buildTerrainRocks();

function buildTerrainBoulders(){
  const count=62,cellSize=240,geometry=new THREE.IcosahedronGeometry(1,1),vertices=geometry.attributes.position;
  for(let i=0;i<vertices.count;i++){
    const v=new THREE.Vector3().fromBufferAttribute(vertices,i),rough=.86+rand(i*919)*.3;
    v.multiplyScalar(rough);v.y*=.68+rand(i*923)*.28;vertices.setXYZ(i,v.x,v.y,v.z);
  }
  vertices.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();
  const material=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.98,flatShading:true}),dummy=new THREE.Object3D(),chunks=new Map();
  for(let i=0;i<count;i++){
    const angle=rand(i*929)*Math.PI*2,radius=105+Math.sqrt(rand(i*937))*590;
    const x=Math.cos(angle)*radius,z=Math.sin(angle)*radius;
    if(Math.abs(x-trailCenterX(z))<23)continue;
    const size=3.6+rand(i*941)*4.6+(i%9===0?2.1:0);
    const sx=size*(.86+rand(i*947)*.7),sy=size*(.5+rand(i*953)*.38),sz=size*(.82+rand(i*967)*.72);
    dummy.position.set(x,terrainElevation(x,z)+sy*.77,z);
    dummy.rotation.set((rand(i*971)-.5)*.28,rand(i*977)*Math.PI*2,(rand(i*983)-.5)*.24);
    dummy.scale.set(sx,sy,sz);dummy.updateMatrix();
    const key=Math.floor(x/cellSize)+','+Math.floor(z/cellSize);
    if(!chunks.has(key))chunks.set(key,[]);
    chunks.get(key).push({matrix:dummy.matrix.clone(),tint:new THREE.Color().setHSL(.085+rand(i*991)*.06,.14+rand(i*997)*.12,.2+rand(i*1009)*.1)});
  }
  for(const items of chunks.values()){
    const boulders=new THREE.InstancedMesh(geometry,material,items.length);
    items.forEach((item,index)=>{boulders.setMatrixAt(index,item.matrix);boulders.setColorAt(index,item.tint);});
    boulders.instanceMatrix.needsUpdate=true;if(boulders.instanceColor)boulders.instanceColor.needsUpdate=true;
    boulders.castShadow=false;boulders.receiveShadow=true;boulders.computeBoundingSphere();boulders.boundingSphere.radius+=2;boulders.frustumCulled=true;scene.add(boulders);
  }
}
buildTerrainBoulders();

const windMaterials=[],windTimeUniform={value:0};
function addWind(material,windMaterials){
  const uniforms={time:windTimeUniform};
  material.onBeforeCompile=shader=>{
    shader.uniforms.uVeyraWindTime=uniforms.time;
    shader.vertexShader='uniform float uVeyraWindTime;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      float canopyWeight=smoothstep(.25,2.8,position.y);
      float sway=sin(uVeyraWindTime*.72+instanceMatrix[3].x*.019+instanceMatrix[3].z*.023)*.042*canopyWeight;
      transformed.x+=sway;
      transformed.z+=sway*.32;`);
  };
  material.customProgramCacheKey=()=>'veyra-instanced-tree-wind-v2';
  windMaterials.push(uniforms);
  return material;
}
function buildForest(source,{count,seed=0,clusterCount=24,innerRadius=120,outerRadius=440,spread=70,minScale=1.5,maxScale=3.2,roots=false,lodSource=null,lodBand=70}={}){
  const clusters=Array.from({length:clusterCount},(_,i)=>{
    const a=i/clusterCount*Math.PI*2+(rand((i+seed)*91)-.5)*.18;
    const innerPatch=i%3===0,r=innerPatch?innerRadius+rand((i+seed)*93)*Math.min(125,outerRadius-innerRadius):innerRadius+rand((i+seed)*93)*(outerRadius-innerRadius);
    return{x:Math.cos(a)*r,z:Math.sin(a)*r};
  });
  const placements=[],dummy=new THREE.Object3D(),treeWindMaterials=[];
  for(let i=0;i<count;i++){
    const center=clusters[i%clusters.length],jx=(rand((i+seed)*71)+rand((i+seed)*73)+rand((i+seed)*79)-1.5)*spread,jz=(rand((i+seed)*83)+rand((i+seed)*89)+rand((i+seed)*97)-1.5)*spread;
    let x=center.x+jx,z=center.z+jz;
    const radial=Math.hypot(x,z);
    if(radial<34){const angle=Math.atan2(z,x);x=Math.cos(angle)*34;z=Math.sin(angle)*34;}
    if(Math.abs(x-trailCenterX(z))<14)continue;
    const scale=minScale+Math.pow(rand((i+seed)*109),.82)*(maxScale-minScale),y=terrainElevation(x,z),yaw=rand((i+seed)*113)*Math.PI*2;
    dummy.position.set(x,y,z);dummy.rotation.set(0,yaw,0);dummy.scale.setScalar(scale);dummy.updateMatrix();
    placements.push({matrix:dummy.matrix.clone(),x,z,scale,phase:rand((i+seed)*127)*Math.PI*2,tint:.88+rand((i+seed)*131)*.22});
  }
const nearDetailDistance=cameraDistance+lodBand;
  const sourceTiers=lodSource?[
    {model:source,items:placements.filter(item=>Math.hypot(item.x-cameraHome.x,item.y-cameraHome.y,item.z-cameraHome.z)<=nearDetailDistance)},
    {model:lodSource,items:placements.filter(item=>Math.hypot(item.x-cameraHome.x,item.y-cameraHome.y,item.z-cameraHome.z)>nearDetailDistance)}
  ]:[{model:source,items:placements}];
  for(const tier of sourceTiers){
    if(!tier.items.length)continue;
    tier.model.updateMatrixWorld(true);
    tier.model.traverse(object=>{
      if(!object.isMesh)return;
      const geometry=object.geometry.clone().applyMatrix4(object.matrixWorld);
      const original=Array.isArray(object.material)?object.material:[object.material];
      const materials=original.map(item=>addWind(item.clone(),treeWindMaterials));
      const cellSize=100,buckets=new Map();
      for(const item of tier.items){
        const key=`${Math.floor(item.x/cellSize)},${Math.floor(item.z/cellSize)}`;
        if(!buckets.has(key))buckets.set(key,[]);
        buckets.get(key).push(item);
      }
      for(const items of buckets.values()){
        const mesh=new THREE.InstancedMesh(geometry,Array.isArray(object.material)?materials:materials[0],items.length);
        mesh.castShadow=false;mesh.receiveShadow=false;
        for(let i=0;i<items.length;i++){
          mesh.setMatrixAt(i,items[i].matrix);
          const tint=items[i].tint;
          mesh.setColorAt(i,new THREE.Color(tint*.86,tint*.94,tint*.82));
        }
        mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
        mesh.computeBoundingSphere();mesh.boundingSphere.radius+=2;mesh.frustumCulled=true;scene.add(mesh);
      }
    });
  }
  const canopyMaterials=[];
  for(let variant=0;variant<3;variant++){
    const centers=[
      [0,2.25,0,.78,.66],[-.48,2.2,.08,.66,.58],[.49,2.28,.02,.69,.6],
      [.04,2.16,.54,.65,.57],[-.04,2.2,-.53,.67,.58],[-.31,2.68,.26,.57,.52],[.38,2.62,-.28,.55,.5]
    ];
    const leafGeo=new THREE.SphereGeometry(1,12,8),baseVertices=leafGeo.attributes.position;
    const leafPositions=[],leafColors=[],leafIndices=[];let offset=0;
    for(let c=0;c<centers.length;c++){
      const [cx,cy,cz,rx,rz]=centers[c],radiusScale=.88+rand(seed+variant*17+c*23)*.24;
      for(let v=0;v<baseVertices.count;v++){
        const q=new THREE.Vector3().fromBufferAttribute(baseVertices,v);
        const wobble=.87+rand(seed+variant*101+c*211+v*7)*.26;
        const x=q.x*rx*radiusScale*wobble+cx+(variant-1)*.035;
        const y=q.y*.72*radiusScale*wobble+cy+(rand(seed+variant*307+c*31)-.5)*.16;
        const z=q.z*rz*radiusScale*wobble+cz+(variant-1)*.04;
        leafPositions.push(x,y,z);
        const shade=clamp(.82+q.y*.14+rand(seed+variant*401+c*19+v)*.19,.64,1.1);
        leafColors.push(.105*shade,.215*shade,.082*shade);
      }
      if(leafGeo.index){for(let ix=0;ix<leafGeo.index.count;ix++)leafIndices.push(offset+leafGeo.index.getX(ix));}
      else for(let ix=0;ix<baseVertices.count;ix++)leafIndices.push(offset+ix);
      offset+=baseVertices.count;
    }
    const canopyGeo=new THREE.BufferGeometry();
    canopyGeo.setAttribute('position',new THREE.Float32BufferAttribute(leafPositions,3));
    canopyGeo.setAttribute('color',new THREE.Float32BufferAttribute(leafColors,3));
    canopyGeo.setIndex(leafIndices);canopyGeo.computeVertexNormals();
    const variantPlacements=placements.filter((_,i)=>i%3===variant);
    const canopyMaterial=addWind(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.94}),canopyMaterials);
    const canopyChunks=new Map(),cellSize=240;
    for(const item of variantPlacements){
      const key=`${Math.floor(item.x/cellSize)},${Math.floor(item.z/cellSize)}`;
      if(!canopyChunks.has(key))canopyChunks.set(key,[]);
      canopyChunks.get(key).push(item);
    }
    for(const items of canopyChunks.values()){
      const canopy=new THREE.InstancedMesh(canopyGeo,canopyMaterial,items.length),tintColor=new THREE.Color();
      items.forEach((item,i)=>{
        canopy.setMatrixAt(i,item.matrix);
        tintColor.setRGB(.91+item.tint*.05,.91+item.tint*.04,.87+item.tint*.04);
        canopy.setColorAt(i,tintColor);
      });
      canopy.instanceMatrix.needsUpdate=true;if(canopy.instanceColor)canopy.instanceColor.needsUpdate=true;
      canopy.castShadow=false;canopy.receiveShadow=false;canopy.computeBoundingSphere();canopy.boundingSphere.radius+=2;canopy.frustumCulled=true;scene.add(canopy);
    }
  }
  treeWindMaterials.push(...canopyMaterials);
  if(roots)buildExposedRoots(placements);
  treeWindMaterials.placements=placements;
  return treeWindMaterials;
}
function buildDistantForest({count=820,seed=503,clusterCount=42,innerRadius=265,outerRadius=690,spread=112}={}){
  const clusters=Array.from({length:clusterCount},(_,i)=>{
    const angle=i/clusterCount*Math.PI*2+(rand((i+seed)*91)-.5)*.18;
    const radius=innerRadius+rand((i+seed)*93)*(outerRadius-innerRadius);
    return{x:Math.cos(angle)*radius,z:Math.sin(angle)*radius};
  });
  const positions=[],colors=[],indices=[];let vertexOffset=0;
  const append=(geometry,matrix,baseColor)=>{
    const source=geometry.attributes.position,sourceColor=geometry.attributes.color,index=geometry.index;
    for(let i=0;i<source.count;i++){
      const point=new THREE.Vector3().fromBufferAttribute(source,i).applyMatrix4(matrix);
      positions.push(point.x,point.y,point.z);
      const shade=sourceColor?sourceColor.getX(i):1;
      colors.push(baseColor.r*shade,baseColor.g*shade,baseColor.b*shade);
    }
    if(index)for(let i=0;i<index.count;i++)indices.push(vertexOffset+index.getX(i));
    else for(let i=0;i<source.count;i++)indices.push(vertexOffset+i);
    vertexOffset+=source.count;
  };
  const trunk=new THREE.CylinderGeometry(.32,.53,4.6,5,1);
  trunk.translate(0,2.3,0);
  const leaf=new THREE.IcosahedronGeometry(1,0),leafColor=new THREE.Color(1,1,1);
  const leafVariants=[
    [-.72,4.1,.02,1.16,1.35,.94], [.66,4.18,.08,1.15,1.32,.98],
    [.02,4.5,-.68,1.18,1.36,1.08], [-.05,4.83,.12,1.22,1.37,1.1]
  ];
  const temporary=new THREE.Object3D();
  const trunkMatrix=new THREE.Matrix4();
  append(trunk,trunkMatrix,new THREE.Color(.34,.25,.14));
  for(let blob=0;blob<leafVariants.length;blob++){
    const [x,y,z,sx,sy,sz]=leafVariants[blob];
    temporary.position.set(x,y,z);temporary.scale.set(sx,sy,sz);temporary.updateMatrix();
    const tint=[new THREE.Color(.14,.31,.10),new THREE.Color(.17,.35,.115),new THREE.Color(.125,.28,.095),new THREE.Color(.18,.37,.125)][blob];
    append(leaf,temporary.matrix,tint);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingSphere();
  trunk.dispose();leaf.dispose();
  const treeWindMaterials=[];
  const material=addWind(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.96,flatShading:true}),treeWindMaterials);
  const chunks=new Map(),cellSize=180,dummy=new THREE.Object3D();
  for(let i=0;i<count;i++){
    const center=clusters[i%clusters.length],jx=(rand((i+seed)*71)+rand((i+seed)*73)+rand((i+seed)*79)-1.5)*spread;
    const jz=(rand((i+seed)*83)+rand((i+seed)*89)+rand((i+seed)*97)-1.5)*spread;
    let x=center.x+jx,z=center.z+jz;
    if(Math.abs(x-trailCenterX(z))<16){const side=x<trailCenterX(z)?-1:1;x=trailCenterX(z)+side*17;}
    const scale=1.55+Math.pow(rand((i+seed)*109),.86)*1.18,y=terrainElevation(x,z),yaw=rand((i+seed)*113)*Math.PI*2;
    dummy.position.set(x,y,z);dummy.rotation.set(0,yaw,0);dummy.scale.setScalar(scale);dummy.updateMatrix();
    const key=`${Math.floor(x/cellSize)},${Math.floor(z/cellSize)}`;
    if(!chunks.has(key))chunks.set(key,[]);
    chunks.get(key).push({matrix:dummy.matrix.clone(),tint:.84+rand((i+seed)*131)*.3});
  }
  for(const items of chunks.values()){
    const trees=new THREE.InstancedMesh(geometry,material,items.length);
    items.forEach((item,i)=>{trees.setMatrixAt(i,item.matrix);trees.setColorAt(i,new THREE.Color(item.tint*.92,item.tint,item.tint*.9));});
    trees.instanceMatrix.needsUpdate=true;if(trees.instanceColor)trees.instanceColor.needsUpdate=true;
    trees.castShadow=false;trees.receiveShadow=false;trees.computeBoundingSphere();trees.boundingSphere.radius+=2;trees.frustumCulled=true;scene.add(trees);
  }
  return treeWindMaterials;
}
function buildTreeBaseStones(placements){
  const geometry=new THREE.IcosahedronGeometry(1,0),vertices=geometry.attributes.position;
  for(let i=0;i<vertices.count;i++){
    const v=new THREE.Vector3().fromBufferAttribute(vertices,i),rough=.84+rand(i*1027)*.32;
    v.multiplyScalar(rough);v.y*=.62+rand(i*1031)*.38;vertices.setXYZ(i,v.x,v.y,v.z);
  }
  vertices.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();
  const material=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,flatShading:true}),dummy=new THREE.Object3D(),chunks=new Map(),cellSize=240;
  for(let i=0;i<placements.length;i++){
    const tree=placements[i];
    if(Math.hypot(tree.x,tree.z)>410||rand(i*1033)>.78)continue;
    const stones=1+Math.floor(rand(i*1039)*3);
    for(let j=0;j<stones;j++){
      const angle=rand(i*1049+j*7)*Math.PI*2,distance=tree.scale*(.34+rand(i*1051+j*11)*.82);
      const x=tree.x+Math.cos(angle)*distance,z=tree.z+Math.sin(angle)*distance;
      if(Math.abs(x-trailCenterX(z))<8)continue;
      const size=.42+rand(i*1061+j*13)*.82,sx=size*(.82+rand(i*1063+j*17)*.58),sy=size*(.44+rand(i*1067+j*19)*.42),sz=size*(.76+rand(i*1069+j*23)*.62);
      dummy.position.set(x,terrainElevation(x,z)+sy*.52,z);dummy.rotation.set((rand(i*1073+j*29)-.5)*.32,rand(i*1079+j*31)*Math.PI*2,(rand(i*1087+j*37)-.5)*.28);
      dummy.scale.set(sx,sy,sz);dummy.updateMatrix();
      const key=`${Math.floor(x/cellSize)},${Math.floor(z/cellSize)}`;
      if(!chunks.has(key))chunks.set(key,[]);
      chunks.get(key).push({matrix:dummy.matrix.clone(),tint:new THREE.Color().setHSL(.075+rand(i*1091+j*41)*.11,.08+rand(i*1093+j*43)*.16,.28+rand(i*1097+j*47)*.18)});
    }
  }
  for(const items of chunks.values()){
    const stones=new THREE.InstancedMesh(geometry,material,items.length);
    items.forEach((item,index)=>{stones.setMatrixAt(index,item.matrix);stones.setColorAt(index,item.tint);});
    stones.instanceMatrix.needsUpdate=true;if(stones.instanceColor)stones.instanceColor.needsUpdate=true;
    stones.castShadow=false;stones.receiveShadow=true;stones.computeBoundingSphere();stones.boundingSphere.radius+=2;stones.frustumCulled=true;scene.add(stones);
  }
}
function buildExposedRoots(placements){
  const chunks=new Map(),up=new THREE.Vector3(0,1,0),cellSize=240;
  for(let i=0;i<placements.length;i++){
    const tree=placements[i];
    if(Math.hypot(tree.x,tree.z)>470||rand(i*239)>.22)continue;
    const key=`${Math.floor(tree.x/cellSize)},${Math.floor(tree.z/cellSize)}`;
    if(!chunks.has(key))chunks.set(key,{positions:[],indices:[],colors:[],vertex:0});
    const chunk=chunks.get(key);
    const rootCount=3+Math.floor(rand(i*241)*2);
    for(let r=0;r<rootCount;r++){
      const angle=(r/rootCount)*Math.PI*2+rand(i*251+r*7)*.55;
      const length=tree.scale*(.48+rand(i*257+r*11)*.72);
      const sx=tree.x+Math.cos(angle)*tree.scale*.22,sz=tree.z+Math.sin(angle)*tree.scale*.22;
      const ex=sx+Math.cos(angle)*length,ez=sz+Math.sin(angle)*length;
      const startY=terrainElevation(sx,sz)+.06,endY=terrainElevation(ex,ez)+.035;
      const mx=(sx+ex)*.5+Math.cos(angle+1.1)*tree.scale*.16,mz=(sz+ez)*.5+Math.sin(angle+1.1)*tree.scale*.16;
      const curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(sx,startY,sz),new THREE.Vector3(mx,(startY+endY)*.5+tree.scale*.08,mz),new THREE.Vector3(ex,endY,ez));
      const rings=7,sides=5,baseRadius=tree.scale*(.052+rand(i*263+r)*.026),rootStart=chunk.vertex;
      for(let j=0;j<=rings;j++){
        const t=j/rings,point=curve.getPoint(t),tangent=curve.getTangent(t).normalize();
        let axis=new THREE.Vector3().crossVectors(tangent,up).normalize();if(axis.lengthSq()<.01)axis.set(1,0,0);
        const other=new THREE.Vector3().crossVectors(tangent,axis).normalize(),radius=baseRadius*Math.pow(1-t,.9)+.018;
        for(let k=0;k<sides;k++){
          const a=k/sides*Math.PI*2,nx=Math.cos(a),ny=Math.sin(a);
          chunk.positions.push(point.x+(axis.x*nx+other.x*ny)*radius,point.y+(axis.y*nx+other.y*ny)*radius,point.z+(axis.z*nx+other.z*ny)*radius);
          const moss=.08+rand(i*269+r*17+j*5)*.07;chunk.colors.push(.12+moss,.105+moss*.8,.065+moss*.45);
        }
      }
      for(let j=0;j<rings;j++)for(let k=0;k<sides;k++){
        const a=rootStart+j*sides+k,b=rootStart+j*sides+(k+1)%sides,c=a+sides,d=b+sides;
        chunk.indices.push(a,c,b,b,c,d);
      }
      chunk.vertex+=(rings+1)*sides;
    }
  }
  const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1});
  for(const chunk of chunks.values()){
    if(!chunk.positions.length)continue;
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(chunk.positions,3));
    geo.setAttribute('color',new THREE.Float32BufferAttribute(chunk.colors,3));geo.setIndex(chunk.indices);geo.computeVertexNormals();geo.computeBoundingSphere();
    const roots=new THREE.Mesh(geo,material);roots.receiveShadow=true;roots.castShadow=false;roots.frustumCulled=true;scene.add(roots);
  }
}
const nearForestWind=buildForest(detailTreeSource,{count:480,seed:13,clusterCount:26,innerRadius:34,outerRadius:310,spread:88,minScale:3.8,maxScale:5.6,roots:true,lodSource:forestTreeSource,lodBand:-16});
const farForestWind=buildDistantForest({count:280,seed:503,clusterCount:32,innerRadius:300,outerRadius:670,spread:95});
windMaterials.push(...nearForestWind,...farForestWind);
buildTreeBaseStones(nearForestWind.placements);

function buildUnderstory(windMaterials){
  const positions=[],colors=[],indices=[];
  for(let leaf=0;leaf<7;leaf++){
    const angle=leaf/7*Math.PI*2+.21,dx=Math.cos(angle),dz=Math.sin(angle),px=-dz,pz=dx;
    const height=.78+rand(leaf*331)*.65,length=.48+rand(leaf*337)*.42,width=.075+rand(leaf*347)*.035,base=positions.length/3;
    const rings=[{t:.05,w:.35},{t:.58,w:1},{t:1,w:0}];
    for(const ring of rings){
      const t=ring.t,centerX=dx*length*t,centerY=height*t,centerZ=dz*length*t,w=width*ring.w;
      positions.push(centerX+px*w,centerY,centerZ+pz*w,centerX,centerY+.035,centerZ,centerX-px*w,centerY,centerZ-pz*w);
      const light=.75+t*.28;colors.push(.075*light,.22*light,.075*light,.12*light,.31*light,.09*light,.075*light,.22*light,.075*light);
    }
    for(let section=0;section<2;section++){
      const a=base+section*3,b=a+3;
      indices.push(a,b,a+1,a+1,b,b+1,a+1,b+1,a+2,a+2,b+1,b+2);
    }
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingSphere();
  const material=addWind(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.94,side:THREE.DoubleSide}),windMaterials);
  const cellSize=220,chunks=new Map(),dummy=new THREE.Object3D();
  for(let i=0;i<1680;i++){
    const near=i<1120,angle=rand(i*359)*Math.PI*2,r=near?28+Math.sqrt(rand(i*367))*165:180+Math.sqrt(rand(i*369))*500,x=Math.cos(angle)*r,z=Math.sin(angle)*r;
    if(Math.abs(x-trailCenterX(z))<10)continue;
    dummy.position.set(x,terrainElevation(x,z)+.02,z);dummy.rotation.y=rand(i*373)*Math.PI*2;dummy.scale.setScalar(near?.88+rand(i*379)*1.2:.7+rand(i*379)*1.25);dummy.updateMatrix();
    const key=`${Math.floor(x/cellSize)},${Math.floor(z/cellSize)}`;if(!chunks.has(key))chunks.set(key,[]);chunks.get(key).push(dummy.matrix.clone());
  }
  for(const matrices of chunks.values()){
    const mesh=new THREE.InstancedMesh(geometry,material,matrices.length);
    matrices.forEach((matrix,i)=>{mesh.setMatrixAt(i,matrix);const tone=.87+rand(i*383)*.22;mesh.setColorAt(i,new THREE.Color(tone*.9,tone,tone*.82));});
    mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
    mesh.castShadow=false;mesh.receiveShadow=true;mesh.computeBoundingSphere();mesh.boundingSphere.radius+=2;mesh.frustumCulled=true;scene.add(mesh);
  }
}

buildUnderstory(windMaterials);

function makeFlowerGeometry(petalColor,centerColor){
  const positions=[],colors=[],indices=[];
  const green=new THREE.Color(0x456b36),leaf=new THREE.Color(0x618343),petal=new THREE.Color(petalColor),center=new THREE.Color(centerColor);
  function vertex(x,y,z,color){positions.push(x,y,z);colors.push(color.r,color.g,color.b);return positions.length/3-1;}
  function quad(a,b,c,d,color){const i=vertex(...a,color),j=vertex(...b,color),k=vertex(...c,color),l=vertex(...d,color);indices.push(i,j,k,i,k,l);}
  function triangle(a,b,c,color){const i=vertex(...a,color),j=vertex(...b,color),k=vertex(...c,color);indices.push(i,j,k);}
  for(let flower=0;flower<3;flower++){
    const angle=flower*2.094+.38,cx=Math.cos(angle)*.13,cz=Math.sin(angle)*.13,height=.64+flower*.13;
    quad([cx-.012,0,cz],[cx+.012,0,cz],[cx+.008,height,cz],[cx-.008,height,cz],green);
    const leafAngle=angle+1.2,lx=cx+Math.cos(leafAngle)*.14,lz=cz+Math.sin(leafAngle)*.14;
    triangle([cx,height*.34,cz],[lx,height*.57,lz],[cx+.025,height*.46,cz+.025],leaf);
    for(let p=0;p<5;p++){
      const a=p/5*Math.PI*2+angle*.25,dx=Math.cos(a),dz=Math.sin(a),px=-dz,pz=dx,r=.105;
      const y=height+.018*Math.sin(a*2);
      quad([cx+dx*.018-px*.018,y,cz+dz*.018-pz*.018],
           [cx+dx*r-px*.006,y-.012,cz+dz*r-pz*.006],
           [cx+dx*r+px*.006,y-.012,cz+dz*r+pz*.006],
           [cx+dx*.018+px*.018,y,cz+dz*.018+pz*.018],petal);
    }
    const centerGeo=new THREE.IcosahedronGeometry(.027,0),attr=centerGeo.attributes.position,offset=positions.length/3;
    for(let i=0;i<attr.count;i++){const x=attr.getX(i),y=attr.getY(i),z=attr.getZ(i);vertex(cx+x,height+.012+y,cz+z,center);}
    const idx=centerGeo.index;
    if(idx){for(let i=0;i<idx.count;i+=3)indices.push(offset+idx.getX(i),offset+idx.getX(i+1),offset+idx.getX(i+2));}
    else for(let i=0;i<attr.count;i+=3)indices.push(offset+i,offset+i+1,offset+i+2);
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();geo.computeBoundingSphere();
  return geo;
}
function buildWildflowers(windMaterials){
  const variants=[
    {petal:0xf4eedc,center:0xd9a83d},
    {petal:0xe2c77f,center:0x9e7431},
    {petal:0xe7c6d3,center:0xc49a50}
  ].map(color=>makeFlowerGeometry(color.petal,color.center));
  const materials=variants.map((_,i)=>addWind(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.88,side:THREE.DoubleSide}),windMaterials));
  const cellSize=220,chunks=new Map(),dummy=new THREE.Object3D();
  for(let i=0;i<700;i++){
    const near=i<240,angle=rand(i*401)*Math.PI*2,r=near?44+Math.sqrt(rand(i*409))*160:42+Math.sqrt(rand(i*411))*650,x=Math.cos(angle)*r,z=Math.sin(angle)*r;
    if(Math.abs(x-trailCenterX(z))<10||Math.hypot(x,z)<40)continue;
    const variant=Math.floor(rand(i*419)*variants.length),size=.72+rand(i*421)*.85;
    dummy.position.set(x,terrainElevation(x,z)+.045,z);dummy.rotation.y=rand(i*431)*Math.PI*2;dummy.scale.setScalar(size);dummy.updateMatrix();
    const key=`${Math.floor(x/cellSize)},${Math.floor(z/cellSize)}`;
    if(!chunks.has(key))chunks.set(key,[[],[],[]]);
    chunks.get(key)[variant].push({matrix:dummy.matrix.clone(),tone:.88+rand(i*433)*.2});
  }
  for(const [key,byVariant] of chunks)for(let variant=0;variant<3;variant++){
    const items=byVariant[variant];if(!items.length)continue;
    const flower=new THREE.InstancedMesh(variants[variant],materials[variant],items.length);
    items.forEach((item,i)=>{flower.setMatrixAt(i,item.matrix);flower.setColorAt(i,new THREE.Color(item.tone,item.tone,item.tone));});
    flower.instanceMatrix.needsUpdate=true;if(flower.instanceColor)flower.instanceColor.needsUpdate=true;
    flower.castShadow=false;flower.receiveShadow=false;flower.computeBoundingSphere();flower.boundingSphere.radius+=2;flower.frustumCulled=true;scene.add(flower);
  }
}

buildWildflowers(windMaterials);

const islandTreeBuckets=new Map(),islandTreePlacements=[],islandTreeBatches=[];
const islandTreeMatrixDummy=new THREE.Object3D();
function makeIslandTree(parent,x,z,scale,seed,source=detailTreeSource){
  let bucket=islandTreeBuckets.get(parent);
  if(!bucket){bucket={hero:[],firstLow:[],otherLow:[]};islandTreeBuckets.set(parent,bucket);}
  const makePlacement=()=>({x,z,scale,yaw:rand(seed*7)*Math.PI*2,phase:seed,instances:[]});
  if(source===detailTreeSource){
    const hero=makePlacement(),fallback=makePlacement();
    bucket.hero.push(hero);bucket.firstLow.push(fallback);islandTreePlacements.push(hero,fallback);
  }else{
    const placement=makePlacement();bucket.otherLow.push(placement);islandTreePlacements.push(placement);
  }
}
function getBakedModelParts(source,cache){
  if(cache.has(source))return cache.get(source);
  source.updateMatrixWorld(true);
  const parts=[];
  source.traverse(object=>{
    if(!object.isMesh)return;
    const geometry=object.geometry.clone().applyMatrix4(object.matrixWorld);
    geometry.computeBoundingSphere();parts.push({geometry,material:object.material});
  });
  cache.set(source,parts);return parts;
}
function addTreeInstanceSet(parent,source,placements,cache){
  const group=new THREE.Group();parent.add(group);
  if(!placements.length)return group;
  for(const part of getBakedModelParts(source,cache)){
    const mesh=new THREE.InstancedMesh(part.geometry,part.material,placements.length);
    mesh.castShadow=false;mesh.receiveShadow=true;mesh.frustumCulled=true;
    placements.forEach((placement,index)=>{
      islandTreeMatrixDummy.position.set(placement.x,.10,placement.z);
      islandTreeMatrixDummy.rotation.set(0,placement.yaw,0);
      islandTreeMatrixDummy.scale.setScalar(placement.scale);islandTreeMatrixDummy.updateMatrix();
      mesh.setMatrixAt(index,islandTreeMatrixDummy.matrix);placement.instances.push({mesh,index});
    });
    mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();group.add(mesh);islandTreeBatches.push(mesh);
  }
  return group;
}
function buildIslandTreeInstances(){
  const cache=new Map();
  for(const [parent,bucket] of islandTreeBuckets){
    const firstLow=addTreeInstanceSet(parent,forestTreeSource,bucket.firstLow,cache);
    addTreeInstanceSet(parent,forestTreeSource,bucket.otherLow,cache);
    const hero=addTreeInstanceSet(parent,detailTreeSource,bucket.hero,cache);
    firstLow.visible=true;hero.visible=false;parent.userData.islandTreeLod={firstLow,hero};
  }
}
function updateIslandTreeMatrices(elapsed){
  for(const placement of islandTreePlacements){
    islandTreeMatrixDummy.position.set(placement.x,.10,placement.z);
    islandTreeMatrixDummy.rotation.set(0,placement.yaw,Math.sin(elapsed*.72+placement.phase)*.006);
    islandTreeMatrixDummy.scale.setScalar(placement.scale);islandTreeMatrixDummy.updateMatrix();
    for(const instance of placement.instances)instance.mesh.setMatrixAt(instance.index,islandTreeMatrixDummy.matrix);
  }
  for(const mesh of islandTreeBatches)mesh.instanceMatrix.needsUpdate=true;
}

function makeIslandGeometry(radius,seed){
  const segments=64,rings=11,topP=[],topC=[],topI=[];
  const grassA=new THREE.Color(0x81905f),grassB=new THREE.Color(0x60774b),rim=new THREE.Color(0x596746);
  for(let r=0;r<=rings;r++)for(let j=0;j<segments;j++){
    const t=r/rings,a=j/segments*Math.PI*2;
    const edgeNoise=.055*Math.sin(a*5+seed)+.035*Math.sin(a*11+seed*2)+(.5-rand(seed+j*9))*.055;
    const rr=radius*t*(1+edgeNoise);
    const x=Math.cos(a)*rr,z=Math.sin(a)*rr;
    const y=.25*Math.sin(a*4+seed)*t+.16*Math.cos(a*7+seed)*t+.34*Math.sin(t*8+seed)*t;
    topP.push(x,y,z);
    const color=grassA.clone().lerp(grassB,t*.5).lerp(rim,smooth(.78,.99,t)*.52);
    const fleck=.93+rand(seed+j*17+r*31)*.13;topC.push(color.r*fleck,color.g*fleck,color.b*fleck);
  }
  for(let r=0;r<rings;r++)for(let j=0;j<segments;j++){
    const a=r*segments+j,b=r*segments+(j+1)%segments,d=(r+1)*segments+j,e=(r+1)*segments+(j+1)%segments;
    topI.push(a,b,d,b,e,d);
  }
  const top=new THREE.BufferGeometry();top.setAttribute('position',new THREE.Float32BufferAttribute(topP,3));top.setAttribute('color',new THREE.Float32BufferAttribute(topC,3));top.setIndex(topI);top.computeVertexNormals();
  const sideP=[],sideC=[],sideI=[],rockColors=[0x73685a,0x5d594f,0x857967,0x4e5149].map(c=>new THREE.Color(c)),sideRings=12;
  for(let r=0;r<=sideRings;r++)for(let j=0;j<segments;j++){
    const t=r/sideRings,a=j/segments*Math.PI*2;
    const n=.11*Math.sin(a*7+seed)+.065*Math.sin(a*13+seed*2)+(.5-rand(seed*7+j*11+r*13))*.12;
    const taper=1-t*.92,rr=radius*(1+n)*taper;
    const y=-.3-t*(8+1.8*Math.sin(a*4+seed)+rand(seed+j)*1.4);
    sideP.push(Math.cos(a)*rr,y,Math.sin(a)*rr);
    const c=rockColors[Math.floor(rand(seed+j*19+r*23)*rockColors.length)];
    const band=.92+.11*Math.sin(r*1.8+seed);sideC.push(c.r*band,c.g*band,c.b*band);
  }
  for(let r=0;r<sideRings;r++)for(let j=0;j<segments;j++){
    const a=r*segments+j,b=r*segments+(j+1)%segments,d=(r+1)*segments+j,e=(r+1)*segments+(j+1)%segments;
    sideI.push(a,b,d,b,e,d);
  }
  const side=new THREE.BufferGeometry();side.setAttribute('position',new THREE.Float32BufferAttribute(sideP,3));side.setAttribute('color',new THREE.Float32BufferAttribute(sideC,3));side.setIndex(sideI);side.computeVertexNormals();
  return{top,side};
}

const focusSubjectTitles=['Mathematics','Scientific Method','Technology & Engineering','Algorithms & Code','Computer Science','Physics','Chemistry','Biology','Astronomy & Space','Earth & Climate','History','Language & Communication','Knowledge & Discovery','Logic & Strategy','Economics & Business'];
const subjectInfoData=[
{eyebrow:'A proof you can watch',text:'Smaller squares break apart and reassemble into the largest square.'},
{eyebrow:'Question · test · result',text:'A magnet lifts metal filings into an arch while the stones stay still.'},
{eyebrow:'Power becomes a machine',text:'Gears lock together, a piston starts, and a spark crosses the engine.'},
{eyebrow:'Values find their order',text:'Colored values pass a scanner and settle into matching stacks.'},
{eyebrow:'Store · retrieve · compute',text:'A pulse wakes the processor, lights memory, and returns an answer.'},
{eyebrow:'Light falls inward',text:'A black event horizon hides the core as hot gas spirals in and background light bends around it.'},
{eyebrow:'Bonds break and reform',text:'Two hydrogen molecules and one oxygen molecule rearrange into water.'},
{eyebrow:'DNA copies itself',text:'The helix opens; each strand guides a matching copy inside the cell.'},
{eyebrow:'Our solar neighborhood',text:'The Sun lights Mercury, Venus, Earth, and Mars on distinct paths.'},
{eyebrow:'The water cycle',text:'Water evaporates, clouds cross a mountain, and rain flows back to sea.'},
{eyebrow:'Eras leave traces',text:'Tools, coins, gears, and chips emerge from the layers of time.'},
{eyebrow:'Knowledge travels',text:'A gesture becomes writing, a page, then a signal carried across distance.'},
{eyebrow:'Ideas connect',text:'A telescope, microscope, compass, and gear combine into a living map.'},
{eyebrow:'Evidence leads somewhere',text:'A red thread links clues and books to a final solved conclusion.'},
{eyebrow:'Exchange builds a market',text:'Materials become goods, goods reach a stall, and tokens flow back.'}
];const landmarkAnimations = [];
const landmarkFocusHeights=[2.65,2.48,2.4,2.65,2.55,2.55,2.65,2.55,3.0,2.45,2.8,2.35,2.7,2.5,2.35];

const landmarkMaterials = {
  cyan:new THREE.MeshStandardMaterial({color:0x70cbbf,emissive:0x075b58,emissiveIntensity:.46,metalness:.12,roughness:.4}),
  blue:new THREE.MeshStandardMaterial({color:0x70a9cf,emissive:0x164c7b,emissiveIntensity:.44,metalness:.18,roughness:.4}),
  gold:new THREE.MeshStandardMaterial({color:0xe0bd78,emissive:0x72501a,emissiveIntensity:.41,metalness:.32,roughness:.42}),
  purple:new THREE.MeshStandardMaterial({color:0xb29bd2,emissive:0x4d3478,emissiveIntensity:.37,metalness:.12,roughness:.42}),
  green:new THREE.MeshStandardMaterial({color:0x8abb78,emissive:0x285a2d,emissiveIntensity:.31,roughness:.72}),
  red:new THREE.MeshStandardMaterial({color:0xd27b82,emissive:0x771f32,emissiveIntensity:.43,roughness:.4}),
  white:new THREE.MeshStandardMaterial({color:0xdce3db,emissive:0x667a76,emissiveIntensity:.17,roughness:.48}),
  stone:new THREE.MeshStandardMaterial({color:0x8c8b7b,roughness:.88}),
  dark:new THREE.MeshStandardMaterial({color:0x090d18,emissive:0x050717,emissiveIntensity:.32,metalness:.24,roughness:.28}),
  core:new THREE.MeshBasicMaterial({color:0x020308}),
  ocean:new THREE.MeshStandardMaterial({color:0x49869b,emissive:0x0b3748,emissiveIntensity:.29,metalness:.18,roughness:.46}),
  ink:new THREE.MeshBasicMaterial({color:0x67cabc}),
  star:new THREE.MeshBasicMaterial({color:0xe8d495}),
  page:new THREE.MeshStandardMaterial({color:0xede1c9,roughness:.9})
};
const landmarkGeometry = {
  sphere:new THREE.SphereGeometry(1,12,8),
  heroSphere:new THREE.SphereGeometry(1,64,40),
  heroTorus:new THREE.TorusGeometry(1,.085,16,144),
  storySphere:new THREE.SphereGeometry(1,24,16),
  box:new THREE.BoxGeometry(1,1,1),
  octa:new THREE.OctahedronGeometry(1,0),
  cone:new THREE.ConeGeometry(1,1,8),
  cylinder:new THREE.CylinderGeometry(1,1,1,10),
  torus:new THREE.TorusGeometry(1,.085,8,36)
};
function landmarkMesh(parent,geometry,material,position,scale,rotation){
  const mesh=new THREE.Mesh(geometry,material);
  mesh.position.set(position[0],position[1],position[2]);
  mesh.scale.set(scale[0],scale[1],scale[2]);
  if(rotation)mesh.rotation.set(rotation[0],rotation[1],rotation[2]);
  mesh.castShadow=false;mesh.receiveShadow=false;parent.add(mesh);return mesh;
}
function landmarkTube(parent,points,material,radius=.08,closed=false,segments=64,radialSegments=6){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0],p[1],p[2])),closed,'catmullrom',.5);
  const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,segments,radius,radialSegments,closed),material);
  mesh.castShadow=false;mesh.receiveShadow=false;parent.add(mesh);return mesh;
}
function landmarkText(parent,lines,position,width,height,color='#e9e5d8',fontFamily='Georgia'){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=320;
  const context=canvas.getContext('2d'),rows=Array.isArray(lines)?lines:[lines],rowHeight=canvas.height/rows.length;
  context.textAlign='center';context.textBaseline='middle';context.shadowColor=color;context.shadowBlur=5;context.fillStyle=color;
  rows.forEach((line,i)=>{context.font='700 '+Math.min(112,rowHeight*.62)+'px '+fontFamily;context.fillText(line,canvas.width/2,rowHeight*(i+.5),canvas.width-20);});
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
  const label=new THREE.Mesh(new THREE.PlaneGeometry(width,height),material);
  label.position.set(position[0],position[1],position[2]);label.renderOrder=2;parent.add(label);return label;
}


function buildFocusDetails(root,index,u,mat){
 const g=new THREE.Group();g.name='clicked-story';g.visible=false;root.add(g);const V=THREE.Vector3;
 const P=(c,m=.2,r=.34,e=0,i=0)=>new THREE.MeshPhysicalMaterial({color:c,metalness:m,roughness:r,emissive:e,emissiveIntensity:i,clearcoat:.18}),gold=P(0xd8aa57,.68,.23,0x57330c,.18),silver=P(0xbac8ce,.72,.22),dark=P(0x101820,.5,.3),cyan=P(0x38d8d0,.3,.21,0x087b7b,.85),blue=P(0x287eb8,.32,.24,0x063b6d,.5),white=P(0xece3d0,.05,.42),red=P(0xa43c44,.36,.3,0x491116,.22),green=P(0x438f59,.2,.4),A={};
 const add=(o,p,s,r)=>{o.position.set(p[0]*u,p[1]*u,p[2]*u);o.scale.set(s[0]*u,s[1]*u,s[2]*u);if(r)o.rotation.set(...r);o.castShadow=o.receiveShadow=true;g.add(o);return o;},B=(p,s,m=gold,r)=>add(new THREE.Mesh(new THREE.BoxGeometry(1,1,1),m),p,s,r),S=(p,r,m=gold,n=32)=>add(new THREE.Mesh(new THREE.SphereGeometry(1,n,Math.max(12,n>>1)),m),p,[r,r,r]);
 const T=(pts,m=white,r=.035,closed=false,n=72)=>{const c=new THREE.CatmullRomCurve3(pts.map(p=>new V(p[0]*u,p[1]*u,p[2]*u)),closed,'catmullrom',.5),o=new THREE.Mesh(new THREE.TubeGeometry(c,n,r*u,8,closed),m);o.castShadow=o.receiveShadow=true;g.add(o);return o;},R=(a,b,r,m=white)=>{const x=new V(a[0]*u,a[1]*u,a[2]*u),y=new V(b[0]*u,b[1]*u,b[2]*u),d=y.clone().sub(x),o=new THREE.Mesh(new THREE.CylinderGeometry(r*u,r*u,1,16),m);o.position.copy(x.add(y).multiplyScalar(.5));o.scale.y=d.length();o.quaternion.setFromUnitVectors(new V(0,1,0),d.normalize());g.add(o);return o;},O=(p,r,t,m=gold,z=0)=>add(new THREE.Mesh(new THREE.TorusGeometry(r*u,t*u,10,72),m),p,[1,1,1],[0,0,z]);
 const key=new THREE.DirectionalLight(0xffdfb0,3),rim=new THREE.DirectionalLight(0x66d2ff,2),amb=new THREE.HemisphereLight(0xa5d6e8,0x31251c,1);key.position.set(-4*u,7*u,7*u);rim.position.set(4*u,4*u,-5*u);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.far=32*u;key.shadow.bias=-.0004;g.add(key,rim,amb);const ac=document.createElement('canvas');ac.width=ac.height=128;const ax=ac.getContext('2d'),ag=ax.createRadialGradient(64,64,2,64,64,63);ag.addColorStop(0,'rgba(0,0,0,.5)');ag.addColorStop(.45,'rgba(0,0,0,.22)');ag.addColorStop(1,'rgba(0,0,0,0)');ax.fillStyle=ag;ax.fillRect(0,0,128,128);const ao=new THREE.Mesh(new THREE.PlaneGeometry(6*u,4*u),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(ac),transparent:true,opacity:.48,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));ao.position.set(0,2.2*u,-1.4*u);ao.renderOrder=-2;g.add(ao);
 if(index===0){const frame=(x,y,s,c)=>{let h=s/2;T([[x-h,y-h,.04],[x+h,y-h,.04],[x+h,y+h,.04],[x-h,y+h,.04],[x-h,y-h,.04]],P(c,.2,.2,c,.55),.045,true,52);};frame(-2,3.3,1.2,0x52dcd2);frame(2,3.3,1.6,0xffbd51);frame(0,1.05,2,0x9d8bff);B([0,2.4,.15],[2,1.25,.13],gold,[0,0,-.58]);A.m=new THREE.InstancedMesh(new THREE.BoxGeometry(.36*u,.36*u,.13*u),P(0x70e2da,.3,.22,0x158984,.4),25);g.add(A.m);A.d=new THREE.Object3D();A.f=[];A.t=[];for(let i=0;i<25;i++){let n=i<9?3:4,j=i<9?i:i-9,r=Math.floor(j/n),c=j%n,x=i<9?-2:2;A.f.push([x+(c-(n-1)/2)*.4,3.3+(r-(n-1)/2)*.4,.3]);A.t.push([(c-2)*.4,1.05+(r-2)*.4,.36]);A.d.position.set(A.f[i][0]*u,A.f[i][1]*u,A.f[i][2]*u);A.d.updateMatrix();A.m.setMatrixAt(i,A.d.matrix);A.m.setColorAt(i,new THREE.Color().setHSL(.48+rand(i*17)*.12,.58,.52));}}
 else if(index===1){let pts=[];for(let i=0;i<=52;i++){let a=Math.PI*.18+Math.PI*1.64*i/52;pts.push([1.3*Math.cos(a),2.55+1.25*Math.sin(a),.15]);}A.mag=T(pts,P(0x9b4037,.7,.25,0x491515,.3),.19,false,88);A.sh=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{t:{value:0}},vertexShader:'varying vec3 n;varying vec3 p;void main(){n=normalize(normalMatrix*normal);vec4 q=modelViewMatrix*vec4(position,1.);p=-q.xyz;gl_Position=projectionMatrix*q;}',fragmentShader:'uniform float t;varying vec3 n;varying vec3 p;void main(){float f=pow(1.-abs(dot(normalize(n),normalize(p))),2.);gl_FragColor=vec4(.14,.7,1.,f*(.6+.35*sin(t*2.+p.y*3.)));}'});for(let k=0;k<4;k++){let q=[];for(let j=0;j<=32;j++){let a=Math.PI*j/32;q.push([(k<2?-1:1)*(1.4+(k%2)*.4)*Math.sin(a),2.4+(1.4+(k%2)*.4)*Math.cos(a),-.1]);}T(q,A.sh,.024,false,48);}A.f=new THREE.InstancedMesh(new THREE.OctahedronGeometry(.09*u),silver,56);g.add(A.f);A.d=new THREE.Object3D();A.f0=[];A.f1=[];for(let i=0;i<56;i++){let x=(rand(i*19)-.5)*4.4;A.f0.push([x,.7,0]);A.f1.push([x*.56,2.1+Math.sin(i/55*Math.PI)*.8,-.1]);}}
 else if(index===2){B([0,.75,0],[5.5,.24,1.2],dark);let gear=(x,y,r,n,m)=>{let q=new THREE.Group();q.position.set(x*u,y*u,.25*u);g.add(q);let d=new THREE.Mesh(new THREE.CylinderGeometry(r*.7*u,r*.7*u,.2*u,32),m);d.rotation.x=Math.PI/2;q.add(d);for(let i=0;i<n;i++){let a=i*6.283/n,o=new THREE.Mesh(new THREE.BoxGeometry(r*.34*u,r*.22*u,.22*u),m);o.position.set(Math.cos(a)*r*.84*u,Math.sin(a)*r*.84*u,0);o.rotation.z=a;q.add(o);}return q;};A.gears=[gear(-1.2,2.2,.72,12,gold),gear(.35,2.4,.52,10,silver),gear(1.55,2.12,.36,8,red)];A.p=B([-.15,3.25,.22],[.44,1,.38],silver);B([-.15,3.83,.24],[1.1,.16,.52],gold);let c=new THREE.SplineCurve([new THREE.Vector2(-2.4,3.6),new THREE.Vector2(-1.5,4.2),new THREE.Vector2(-.4,3.7),new THREE.Vector2(.7,4.2),new THREE.Vector2(1.6,3.6)]);A.spark=[];for(let i=0;i<3;i++){let q=new THREE.BufferGeometry().setFromPoints(c.getPoints(48).map(p=>new V(p.x*u,p.y*u,.6*u)));q.setDrawRange(0,0);let l=new THREE.Line(q,new THREE.LineBasicMaterial({color:i?0x79e9ff:0xffdd82}));g.add(l);A.spark.push(l);}A.beam=B([2.6,3.25,.05],[.07,2,.07],cyan);}
 else if(index===3){B([0,.78,0],[5.6,.2,1.25],dark);B([0,.95,.1],[5.3,.1,1],P(0x24363c,.5,.34));for(let x of [-2.5,2.5])O([x,.86,0],.23,.05,silver);for(let x of [-.5,.5])B([x,3,0],[.1,2.4,.1],silver);B([0,4.23,0],[1.25,.13,.12],cyan);A.laser=B([0,2.15,.23],[.035,2,.04],red);A.c=[];for(let i=0;i<12;i++)A.c.push(B([-2.6+i%6*.48,1.25,.34],[.28,.28,.28],P([0x42d1cb,0xff668c,0xf4b950,0x9082ee][i%4],.3,.24)));A.stack=[];for(let c=0;c<4;c++)for(let r=0;r<3;r++){let o=B([1.2+c*.55,1.15+r*.3,-.16],[.32,.26,.28],[cyan,red,gold,blue][c]);o.visible=false;A.stack.push(o);}}
 else if(index===4){B([0,1.1,0],[4.2,.16,1],dark);A.core=S([0,2.5,.2],.74,P(0x195f9e,.45,.2,0x0781e0,1),64);A.mem=[];A.r=[];let c=document.createElement('canvas');c.width=192;c.height=24;let x=c.getContext('2d');x.fillStyle='#091921';x.fillRect(0,0,192,24);for(let i=0;i<18;i++){x.fillStyle=i%3?'#48e4df':'#fff1b0';x.fillRect(i*11,0,5,24);}A.tex=new THREE.CanvasTexture(c);A.tex.wrapS=THREE.RepeatWrapping;A.tex.repeat.set(3,1);let fm=new THREE.MeshStandardMaterial({map:A.tex,emissiveMap:A.tex,emissive:0x087d79,emissiveIntensity:1.2});for(let i=0;i<8;i++){let a=i*Math.PI/4,x=Math.cos(a)*2,y=2.5+Math.sin(a)*1.4;A.mem.push(B([x,y,.3],[.48,.48,.42],P(0x174770,.38,.24)));T([[Math.cos(a)*.7,2.5+Math.sin(a)*.7,.4],[x,y,.4]],fm,.05,false,64);A.r.push(O([0,2.5,.1],.9+i*.14,.02,i%2?cyan:gold,i*.55));}}
 else if(index===5){A.dm=new THREE.ShaderMaterial({transparent:true,side:THREE.DoubleSide,depthWrite:false,uniforms:{t:{value:0}},vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float t;varying vec2 v;void main(){vec2 p=v*2.-1.;float r=length(p),a=atan(p.y,p.x);float band=(1.-smoothstep(.6,1.,r))*smoothstep(.3,.48,r);float n=.5+.5*sin(a*18.-r*15.-t*2.4+sin(a*7.+t));float hot=pow(max(0.,1.-abs(r-.53)*5.),2.);vec3 c=mix(vec3(.2,.016,.03),vec3(1.,.23,.025),n);c=mix(c,vec3(1.,.88,.58),hot*.85);gl_FragColor=vec4(c,band);}'});let d=new THREE.Mesh(new THREE.RingGeometry(.8*u,2.55*u,256,12),A.dm);d.scale.set(1,.5,1);d.position.set(0,2.55*u,-.08*u);g.add(d);A.hole=S([0,2.55,.12],.88,P(0x010204,.02,.98),96);A.hole.scale.set(.88*u,.88*u,.45*u);T([[-2.6,2.8,-.2],[-1.7,3.5,-.2],[-.5,3.82,-.2],[.5,3.55,-.2],[1.6,3.18,-.2],[2.5,2.76,-.2]],P(0xffe2b1,.1,.18,0xff9840,1.4),.022,false,120);T([[-2.2,2.05,-.18],[-1.3,1.65,-.18],[-.3,1.58,-.18],[.7,1.82,-.18],[1.55,2.2,-.18]],P(0xa4ddff,.08,.2,0x409ce0,.7),.014,false,80);let pos=[],src=[];for(let i=0;i<160;i++){let a=rand(i*17)*6.28,r=2.7+rand(i*19)*3.1,p=[Math.cos(a)*r,2.55+Math.sin(a)*r*.7,-.4];src.push(p);pos.push(...p.map(v=>v*u));}let geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.add(new THREE.Points(geo,new THREE.PointsMaterial({color:0xe4efff,size:.04*u})));A.stars={geo,src};}
 else if(index===6){let f=[[-2,2.6,.1],[-1.5,2.6,.1],[-.1,3.8,.1],[.45,3.8,.1],[1.5,3.05,.1],[2,3.05,.1]],to=[[-1.05,2.6,.1],[-1.55,3.05,.1],[-.55,3.05,.1],[1.1,2.6,.1],[.6,3.05,.1],[1.6,3.05,.1]],m=f.map((p,i)=>S(p,i>3?.34:.24,i>3?red:white,36)),pairs=[[0,1],[4,5],[0,2],[0,3],[3,4],[4,1],[2,5]],b=pairs.map(q=>R(f[q[0]],f[q[1]],.06,white));A.chem={f,to,m,pairs,b};}
 else if(index===7){let shell=new THREE.Mesh(new THREE.SphereGeometry(2.45*u,48,32),new THREE.MeshPhysicalMaterial({color:0x50d7c6,transparent:true,opacity:.13,side:THREE.DoubleSide,emissive:0x087c84,emissiveIntensity:.35}));shell.position.set(0,2.55*u,-.2*u);g.add(shell);const h=(x,c1,c2)=>{let q=new THREE.Group();g.add(q);let a=[],b=[];for(let i=0;i<=64;i++){let t=i/64*12.56,y=.6+i/64*3.95,d=Math.sin(t)*.5;a.push([x+d,y,.1+Math.cos(t)*.16]);b.push([x-d,y,.1-Math.cos(t)*.16]);}T(a,c1,.065,false,96);T(b,c2,.065,false,96);for(let i=0;i<=16;i++){let t=i/16*12.56,y=.6+i/16*3.95,d=Math.sin(t)*.5;R([x+d,y,.1+Math.cos(t)*.16],[x-d,y,.1-Math.cos(t)*.16],.022,i%2?green:gold);}return q;};A.d1=h(-.4,cyan,blue);A.d2=h(.4,green,red);A.d2.scale.setScalar(.001);A.enzyme=S([-.5,4.4,.48],.2,P(0xd3b5ff,.08,.16,0x714aff,1));}
 else if(index===8){A.sun=S([0,2.7,0],.54,P(0xffc542,.02,.2,0xff9516,2),64);A.light=new THREE.PointLight(0xffb841,36,15*u,1.5);A.light.position.set(0,2.7*u,1*u);g.add(A.light);A.pl=[];[[1.18,.14,0xa69d95],[1.85,.21,0xd6a06c],[2.63,.26,0x2e8fc8],[3.4,.21,0xc75b41]].forEach((d,i)=>{let pts=new THREE.EllipseCurve(0,0,d[0]*u,d[0]*.6*u).getPoints(90).map(p=>new V(p.x,2.7*u+p.y,0)),geo=new THREE.BufferGeometry().setFromPoints(pts);g.add(new THREE.Line(geo,new THREE.LineBasicMaterial({color:[0xb5a58b,0xe1c28a,0x89dbe3,0xd77c68][i]})));let pivot=new THREE.Group();g.add(pivot);let s=new THREE.Mesh(new THREE.SphereGeometry(d[1]*u,48,32),P(d[2],.06,.58,0x191919,.06));s.position.set(d[0]*u,2.7*u,0);pivot.add(s);let n=new THREE.Mesh(new THREE.SphereGeometry(d[1]*1.01*u,32,24),new THREE.MeshBasicMaterial({color:0x050913,side:THREE.BackSide,transparent:true,opacity:.3}));n.position.copy(s.position);pivot.add(n);A.pl.push({pivot,s,speed:[.84,.6,.42,.3][i],phase:i*1.3});});}
 else if(index===9){B([0,.8,0],[6,.32,.7],P(0x6b4b38,.02,.94));B([-1.8,1.08,.1],[2.3,.2,.55],blue);let sh=new THREE.Shape();sh.moveTo(-2.8,1);sh.lineTo(-1.5,1);sh.lineTo(-.7,2.1);sh.lineTo(-.1,1.6);sh.lineTo(.8,3.5);sh.lineTo(1.5,2.3);sh.lineTo(2.8,1);sh.closePath();let hill=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:.6*u,bevelEnabled:false}),P(0x748359,.02,.92));hill.scale.set(u,u,1);hill.position.z=-.4*u;g.add(hill);A.cloud=[];for(let i=0;i<5;i++)A.cloud.push(S([-1.5+i*.3,3.7,.4],.22,i%2?white:cyan));A.rain=[];for(let i=0;i<15;i++)A.rain.push(B([.5+i%5*.25,3-Math.floor(i/5)*.5,.4],[.02,.2,.02],blue));}
 else if(index===10){[0x51463a,0x826448,0x62625d,0x383b3a].forEach((c,i)=>B([0,.75+i*.6,-.04],[5.5,.54,.48],P(c,.02,.94)));A.art=[];let axe=new THREE.Group();g.add(axe);R([0,0,0],[0,.72,0],.07,P(0x70563a,.02,.9));S([.13,.58,0],.18,silver);A.art.push(axe);let coin=new THREE.Group();g.add(coin);let cm=new THREE.Mesh(new THREE.CylinderGeometry(.28*u,.28*u,.08*u,36),gold);cm.rotation.x=Math.PI/2;coin.add(cm);A.art.push(coin);let gear=new THREE.Group();g.add(gear);O([0,0,0],.32,.07,gold);A.art.push(gear);let chip=new THREE.Group();g.add(chip);B([0,0,0],[.6,.44,.14],blue);A.art.push(chip);}
 else if(index===11){A.forms=[];let hand=new THREE.Group();g.add(hand);B([0,2.4,.2],[.58,.68,.24],P(0xc68c65,.02,.7));for(let i=0;i<4;i++)B([-.24+i*.16,2.95,.2],[.1,.56,.12],P(0xc68c65,.02,.7));A.forms.push(hand);let tablet=new THREE.Group();g.add(tablet);B([0,2.5,0],[1.4,1.9,.22],P(0x786c58,.03,.9));A.forms.push(tablet);let book=new THREE.Group();g.add(book);B([0,2.5,0],[1.55,1.9,.24],red);B([-.38,2.5,.15],[.64,1.75,.02],white);B([.38,2.5,.15],[.64,1.75,.02],white);A.forms.push(book);let phone=new THREE.Group();g.add(phone);B([0,2.5,0],[.72,1.42,.18],dark);B([0,2.5,.1],[.6,1.24,.03],blue);A.forms.push(phone);A.sig=[];for(let i=0;i<3;i++)A.sig.push(O([.6+i*.18,3.2,.24],.2+i*.15,.02,cyan));}
 else if(index===12){B([0,.75,-.1],[5.4,.16,1.1],P(0x372e26,.08,.8));A.tools=[];for(let i=0;i<4;i++){let o=new THREE.Group();g.add(o);if(i===0){B([-2,1.5,0],[.16,.8,.16],gold);O([-2.2,2,.05],.22,.05,gold);}if(i===1){B([-.65,1.2,0],[.65,.18,.35],silver);O([-.65,1.8,.05],.18,.05,white);}if(i===2){O([.75,1.15,0],.36,.05,gold);B([.75,1.4,.05],[.04,.45,.04],red);}if(i===3){O([2,1.2,0],.3,.06,gold);for(let j=0;j<8;j++){let a=j*.785;B([2+Math.cos(a)*.36,1.2+Math.sin(a)*.36,0],[.14,.1,.1],gold,[0,0,a]);}}A.tools.push(o);}A.hm=new THREE.ShaderMaterial({transparent:true,uniforms:{t:{value:0}},vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float t;varying vec2 v;void main(){gl_FragColor=vec4(.2,.84,1.,(.6+.25*sin(v.y*140.-t*3.))*.66);}'});A.map=new THREE.Mesh(new THREE.SphereGeometry(.82*u,48,32),A.hm);A.map.scale.y=.58;A.map.position.set(0,3*u,-.2*u);g.add(A.map);}
 else if(index===13){let board=new THREE.Mesh(new THREE.BoxGeometry(5.6*u,4.2*u,.2*u),P(0x61472f,.02,.94));board.position.set(0,2.8*u,-.3*u);g.add(board);A.books=[];for(let i=0;i<2;i++){let x=i?1.3:-1.4,death=!i,gr=new THREE.Group();g.add(gr);B([x,2.4,.34],[1.4,2.2,.4],dark);B([x,2.4,.58],[1.28,2.08,.07],P(death?0x17191b:0x862739,.4,.27));let cv=document.createElement('canvas');cv.width=512;cv.height=768;let c=cv.getContext('2d');c.fillStyle=death?'#111416':'#862739';c.fillRect(0,0,512,768);c.strokeStyle=death?'#aaa99e':'#e1bd73';c.lineWidth=13;c.strokeRect(22,22,468,724);c.textAlign='center';c.textBaseline='middle';c.fillStyle=death?'#e8e3da':'#ffedb2';c.font='bold 50px Georgia';c.fillText(death?'DEATH NOTE':'THE 48 LAWS',256,265);if(!death)c.fillText('OF POWER',256,345);if(death){c.strokeStyle='#c43a4d';c.lineWidth=10;c.beginPath();c.moveTo(125,555);c.quadraticCurveTo(250,465,390,555);c.stroke();}let tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;let cover=new THREE.Mesh(new THREE.PlaneGeometry(1.18*u,1.98*u),new THREE.MeshBasicMaterial({map:tx,side:THREE.DoubleSide,toneMapped:false}));cover.position.set(x*u,2.4*u,.65*u);gr.add(cover);A.books.push(gr);}let pts=[[-2.4,3.8,.34],[-1.7,3.2,.35],[-.5,2.75,.35],[.15,3.45,.35],[1.2,2.7,.35],[2.2,3.65,.35],[2.2,1.5,.35],[.5,1.4,.35],[-1.2,1.6,.35]],c=new THREE.CatmullRomCurve3(pts.map(p=>new V(p[0]*u,p[1]*u,p[2]*u))),geo=new THREE.BufferGeometry().setFromPoints(c.getPoints(112));geo.setDrawRange(0,0);A.thread=new THREE.Line(geo,new THREE.LineBasicMaterial({color:0xe13a49}));g.add(A.thread);A.solved=B([0,1,.4],[1.4,.45,.1],green);A.solved.scale.setScalar(.001);}
 else{B([-1.8,.8,0],[2,.32,1.1],P(0x606b75,.16,.58));B([-1.8,1.58,0],[1.25,1.08,.9],red);B([-1.8,2.25,0],[1.65,.22,1.1],gold);B([1.5,.76,0],[2.1,.2,1.25],P(0x55412f,.06,.8));for(let i=0;i<4;i++){B([.6+i*.6,1.12,0],[.08,.65,.08],gold);B([.6+i*.6,1.5,0],[.58,.17,.7],i%2?green:gold);}let raw=[[-.7,1,.4],[0,.9,.4],[.7,.85,.4],[1.05,.84,.4]],marketCurve=new THREE.CatmullRomCurve3(raw.map(p=>new V(p[0]*u,p[1]*u,p[2]*u)),false,'catmullrom',.35);A.trade={points:marketCurve.getSpacedPoints(96),d:new THREE.Object3D(),b:new THREE.InstancedMesh(new THREE.BoxGeometry(.25*u,.22*u,.22*u),blue,18),coin:new THREE.InstancedMesh(new THREE.CylinderGeometry(.12*u,.12*u,.035*u,16),gold,20),bars:[]};g.add(new THREE.Mesh(new THREE.TubeGeometry(marketCurve,96,.055*u,10,false),cyan),A.trade.b,A.trade.coin);for(let i=0;i<5;i++)A.trade.bars.push(B([2.4+i*.23,1,-.2],[.15,.25,.15],P([0x50d3cd,0x61b5e5,0xffc261,0x9d83eb,0x79ce74][i],.2,.3)));}
 const d={group:g,actors:A};d.update=t=>{
 if(index===0){let f=smooth(2.2,7,t);for(let i=0;i<25;i++){let p=A.f[i].map((v,j)=>THREE.MathUtils.lerp(v,A.t[i][j],f));A.d.position.set(p[0]*u,p[1]*u,p[2]*u);A.d.rotation.z=(1-f)*Math.sin(t*4+i)*.2;A.d.updateMatrix();A.m.setMatrixAt(i,A.d.matrix);}A.m.instanceMatrix.needsUpdate=true;}
 if(index===1){A.mag.position.y=(2.55+1.05*(1-smooth(.7,2.6,t)))*u;let f=smooth(2.3,6,t);for(let i=0;i<56;i++){let p=A.f0[i].map((v,j)=>THREE.MathUtils.lerp(v,A.f1[i][j],f));A.d.position.set(p[0]*u,p[1]*u,p[2]*u);A.d.rotation.set(t+i,t*.3,t*.2);A.d.scale.setScalar((.5+rand(i*19))*u);A.d.updateMatrix();A.f.setMatrixAt(i,A.d.matrix);}A.f.instanceMatrix.needsUpdate=true;A.sh.uniforms.t.value=t;}
 if(index===2){A.gears.forEach((o,i)=>o.rotation.z=t*(i===1?-.6:.6));A.p.position.y=(3.25+Math.sin(Math.max(0,t-2)*2.7)*.28)*u;A.spark.forEach(o=>{let n=t>2&&t<7?Math.floor((t-2)*12):0;o.geometry.setDrawRange(0,Math.min(48,n));o.material.opacity=n?1:0;});A.beam.material.emissiveIntensity=t>5?1:.1;}
 if(index===3){A.c.forEach((o,i)=>{let q=(Math.max(0,t-1.5)*.16+i/12)%1;o.position.set((-2.6+q*5.2)*u,1.24*u,.35*u);});A.stack.forEach((o,i)=>o.visible=t>4.5&&(t>10||i<Math.floor(smooth(4.5,9,t)*12)));A.laser.material.emissiveIntensity=.4+.6*Math.sin(t*5)**2;}
 if(index===4){A.tex.offset.x=-t*.35;A.core.material.emissiveIntensity=.3+.8*(.5+.5*Math.sin(t*2));A.mem.forEach((o,i)=>o.material.emissiveIntensity=Math.sin(t*3-i*.6)>0?.85:.1);A.r.forEach((o,i)=>o.rotation.z=t*(i%2?.15:-.15));}
 if(index===5){A.dm.uniforms.t.value=t;let a=A.stars.geo.attributes.position;for(let i=0;i<A.stars.src.length;i++){let p=A.stars.src[i],f=smooth(2.5,8,(t*.16+i/160)%1),r=Math.hypot(p[0],p[1]-2.55),q=Math.atan2(p[1]-2.55,p[0])+2*f;a.setXYZ(i,Math.cos(q)*r*(1-.78*f)*u,(2.55+Math.sin(q)*r*(1-.78*f)*.7)*u,p[2]*u);}a.needsUpdate=true;}
 if(index===6){let f=smooth(3,7,t);for(let i=0;i<6;i++)A.chem.m[i].position.set(...A.chem.f[i].map((v,j)=>THREE.MathUtils.lerp(v,A.chem.to[i][j],f)*u));A.chem.b.forEach((o,i)=>{let [x,y]=A.chem.pairs[i],p=A.chem.m[x].position,q=A.chem.m[y].position,z=q.clone().sub(p);o.position.copy(p).add(q).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new V(0,1,0),z.clone().normalize());o.scale.y=Math.max(.03,z.length());});}
 if(index===7){let f=smooth(3,7,t);A.d1.position.x=-.6*f*u;A.d2.scale.setScalar(Math.max(.001,f));A.d2.position.x=.6*f*u;A.enzyme.position.y=(4.4-(t<3?0:(t-3)*.48%4))*u;A.d1.rotation.z=Math.sin(t*.4)*.03;A.d2.rotation.z=-A.d1.rotation.z;}
 if(index===8){A.pl.forEach(o=>{o.pivot.rotation.z=t*o.speed+o.phase;o.s.rotation.y=t*.46;});A.sun.material.emissiveIntensity=1.2+.8*(.5+.5*Math.sin(t));}
 if(index===9){A.cloud.forEach((o,i)=>{o.position.x=(-1.5+i*.3+Math.min(3,t*.3))*u;o.position.y=(3.7+Math.sin(t+i)*.035)*u;});A.rain.forEach((o,i)=>o.position.y=(3-(t*.7+i/15)%1*1.7)*u);}
 if(index===10)A.art.forEach((o,i)=>{let q=t-1.5-i*1.3;o.visible=q>0;o.position.set((-1.8+i*1.2)*u,(1.1+i*.65+Math.max(0,Math.min(.8,q*.5)))*u,.6*u);o.rotation.y=t*.16*(i%2?1:-1);});
 if(index===11){A.forms.forEach((o,i)=>{let f=i===0?(t<1.8?1:1-smooth(1.8,3,t)):i===1?smooth(1.8,3,t)*(1-smooth(3.8,4.5,t)):i===2?smooth(3.8,4.6,t)*(1-smooth(5.8,6.5,t)):smooth(5.8,6.6,t);o.scale.setScalar(Math.max(.001,f));});A.sig.forEach((o,i)=>{let q=(t*.3+i*.34)%1;o.scale.setScalar(.7+q);o.material.opacity=.8-q*.6;});}
 if(index===12){A.tools.forEach((o,i)=>{o.rotation.y=Math.sin(t*.35+i)*.1;o.position.y=(1.04+Math.sin(t+i)*.05)*u;});A.map.rotation.y=t*.3;A.hm.uniforms.t.value=t;}
 if(index===13){A.thread.geometry.setDrawRange(0,Math.floor(smooth(1,8,t)*112));A.solved.scale.setScalar(Math.max(.001,smooth(8,9,t)));A.books.forEach((o,i)=>o.rotation.y=Math.sin(t*.4+i)*.02);}
 if(index===14){let q=A.trade,s=q.points;for(let i=0;i<18;i++){let f=((t*.12+i/18)%1)*(s.length-1),j=Math.min(s.length-2,Math.floor(f));q.d.position.lerpVectors(s[j],s[j+1],f-j);q.d.rotation.y=t+i;q.d.updateMatrix();q.b.setMatrixAt(i,q.d.matrix);}q.b.instanceMatrix.needsUpdate=true;for(let i=0;i<20;i++){let f=(t*.15+i/20)%1;q.d.position.set((-1.8+3.5*f)*u,(1.4+Math.sin(t+f*20)*.08)*u,.5*u);q.d.rotation.set(Math.PI/2,t*2+i,0);q.d.updateMatrix();q.coin.setMatrixAt(i,q.d.matrix);}q.coin.instanceMatrix.needsUpdate=true;q.bars.forEach((o,i)=>o.scale.y=(.12+.4*smooth(2,7,t)+.1*Math.sin(Math.max(0,t-10)*.5+i*.5))*u);}
 };return d;
}
function updateFocusDetails(item,time){
 const detail=item.focusDetail;if(!detail||detail.updateFailed)return;
 try{detail.update(time);}
 catch(error){detail.updateFailed=true;console.error('Veyra focus animation paused for '+subjects[item.index],error);}
}

function buildSubjectLandmark(parent,index,size){
  const baseScale=index===3?1.66:1.5;
  const root=new THREE.Group();root.position.y=.58;root.scale.setScalar(baseScale);parent.add(root);
  const u=size/12,spinPivot=new THREE.Group();spinPivot.position.y=2.55*u;root.add(spinPivot);
  const spin=new THREE.Group();spin.position.y=-2.55*u;spinPivot.add(spin);
let pulse=null,sway=null,rotatingDisc=null,movingLight=null,motionType='',movingLightRadius=0,movingLightY=0,movingLightZ=0,cameraFacing=null,motionCurve=null,solarOrbits=[],solarCenterY=0,focusDetail=null;
  const focusActors=[],focusOnlyHide=[];
  const sphere=landmarkGeometry.sphere,box=landmarkGeometry.box,torus=landmarkGeometry.torus,cylinder=landmarkGeometry.cylinder;
  const mat=landmarkMaterials;
  if(index===0){
    // Integrate the Lorenz system into a smooth, luminous chaotic attractor.
    let x=.1,y=0,z=0;
    const dt=.004,points=[];
    const derivative=(a,b,c)=>[10*(b-a),a*(28-c)-b,a*b-(8/3)*c];
    for(let i=0;i<7600;i++){
      const k1=derivative(x,y,z);
      const k2=derivative(x+k1[0]*dt*.5,y+k1[1]*dt*.5,z+k1[2]*dt*.5);
      const k3=derivative(x+k2[0]*dt*.5,y+k2[1]*dt*.5,z+k2[2]*dt*.5);
      const k4=derivative(x+k3[0]*dt,y+k3[1]*dt,z+k3[2]*dt);
      x+=dt/6*(k1[0]+2*k2[0]+2*k3[0]+k4[0]);
      y+=dt/6*(k1[1]+2*k2[1]+2*k3[1]+k4[1]);
      z+=dt/6*(k1[2]+2*k2[2]+2*k3[2]+k4[2]);
      if(i>900&&i%4===0)points.push(new THREE.Vector3(x*.1*u,(2.55+(z-25)*.065)*u,(y-25)*.075*u));
    }
    motionCurve=new THREE.CatmullRomCurve3(points,false,'catmullrom',.5);
    const pathSegments=1320,pathSides=10;
    const pathGeometry=new THREE.TubeGeometry(motionCurve,pathSegments,.13*u,pathSides,false);
    const pathColors=[],pathColor=new THREE.Color();
    for(let ring=0;ring<=pathSegments;ring++){
      const t=ring/pathSegments;
      pathColor.setHSL(.52-.39*t,.82,.58);
      for(let side=0;side<=pathSides;side++)pathColors.push(pathColor.r,pathColor.g,pathColor.b);
    }
    pathGeometry.setAttribute('color',new THREE.Float32BufferAttribute(pathColors,3));
    const attractorMaterial=new THREE.MeshStandardMaterial({vertexColors:true,emissive:0x123d43,emissiveIntensity:.48,metalness:.16,roughness:.28});
    const attractor=new THREE.Mesh(pathGeometry,attractorMaterial);attractor.castShadow=false;attractor.receiveShadow=false;spin.add(attractor);
    movingLight=landmarkMesh(spin,landmarkGeometry.heroSphere,mat.star,[0,2.55*u,0],[.21*u,.21*u,.21*u]);
    motionType='lorenz';pulse=movingLight;cameraFacing=spinPivot;
  }else if(index===1){
    landmarkMesh(root,box,mat.stone,[0,.72*u,0],[2.35*u,.28*u,1.5*u]);
    landmarkMesh(root,cylinder,mat.stone,[0,1.12*u,0],[.2*u,.62*u,.2*u]);
    const prismShape=new THREE.Shape();
    prismShape.moveTo(-1.28*u,1.25*u);prismShape.lineTo(1.28*u,1.25*u);prismShape.lineTo(0,3.7*u);prismShape.closePath();
    const prismGeometry=new THREE.ExtrudeGeometry(prismShape,{depth:.72*u,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.08*u,bevelThickness:.08*u});
    const prismMaterial=new THREE.MeshPhysicalMaterial({color:0x8adfff,emissive:0x17699f,emissiveIntensity:.46,metalness:.08,roughness:.17,transparent:true,opacity:.66,side:THREE.DoubleSide});
    landmarkMesh(root,prismGeometry,prismMaterial,[0,0,-.36*u],[1,1,1]);
    landmarkTube(root,[[-3.65*u,2.3*u,.58*u],[-.62*u,2.3*u,.58*u]],mat.white,.075*u,false,36);
    const spectrum=[
      [mat.red,1.18],[mat.gold,1.52],[mat.star,1.86],[mat.green,2.2],[mat.cyan,2.54],[mat.blue,2.88],[mat.purple,3.22]
    ];
    spectrum.forEach(([material,y])=>landmarkTube(root,[[.62*u,2.3*u,.58*u],[2.85*u,y*u,.58*u]],material,.055*u,false,32));
    landmarkMesh(root,sphere,mat.star,[-3.45*u,2.3*u,.66*u],[.16*u,.16*u,.16*u]);
    movingLight=landmarkMesh(root,sphere,mat.white,[-3.45*u,2.3*u,.7*u],[.19*u,.19*u,.19*u]);motionType='spectrum';pulse=movingLight;
  }else if(index===2){
    landmarkMesh(root,box,mat.dark,[0,2.3*u,0],[2.75*u,2.35*u,.6*u]);
    landmarkMesh(root,box,mat.blue,[0,2.38*u,.34*u],[2.36*u,1.95*u,.1*u]);
    landmarkMesh(root,box,mat.cyan,[0,2.38*u,.42*u],[1.72*u,1.34*u,.06*u]);
    landmarkMesh(root,box,mat.dark,[0,2.38*u,.47*u],[1.35*u,1.02*u,.05*u]);
    landmarkMesh(root,landmarkGeometry.octa,mat.gold,[0,2.38*u,.54*u],[.46*u,.46*u,.46*u]);
    for(let side=0;side<4;side++)for(let i=0;i<5;i++){
      const p=(i-2)*.42*u;
      if(side<2)landmarkMesh(root,box,mat.gold,[p,side===0?1.05*u:3.55*u,.06*u],[.13*u,.58*u,.12*u]);
      else landmarkMesh(root,box,mat.cyan,[side===2?-1.72*u:1.72*u,2.38*u+p,.06*u],[.58*u,.13*u,.12*u]);
    }
    for(let i=0;i<4;i++)landmarkTube(root,[[.6*u,1.7*u,.1*u],[1.22*u,(1.4+i*.28)*u,.1*u],[2.15*u,(1.4+i*.28)*u,.1*u]],i%2?mat.blue:mat.cyan,.045*u,false,24);
    movingLight=landmarkMesh(root,sphere,mat.star,[-1.15*u,1.7*u,.58*u],[.17*u,.17*u,.17*u]);motionType='circuit';pulse=movingLight;
  }else if(index===3){
    const bluePoints=[[-1.45,2.25,.12],[-1.55,3.02,.14],[-1.18,3.67,.2],[-.48,3.88,.24],[.35,3.86,.28],[.95,3.5,.3],[1.02,2.9,.34],[.58,2.5,.42],[-.28,2.48,.52],[-.82,2.08,.48],[-.76,1.48,.4],[-.2,1.12,.34],[.62,1.16,.28],[1.42,1.55,.22]].map(([x,y,z])=>[x*u,y*u,z*u]);
    const goldPoints=[[1.45,2.92,.52],[1.55,2.16,.5],[1.18,1.52,.48],[.48,1.3,.44],[-.35,1.32,.4],[-.95,1.7,.34],[-1.02,2.32,.28],[-.58,2.72,.22],[.28,2.74,.18],[.82,3.12,.16],[.76,3.72,.14],[.18,4.02,.12],[-.62,3.92,.1],[-1.42,3.52,.08]].map(([x,y,z])=>[x*u,y*u,z*u]);
    landmarkTube(spin,bluePoints,mat.blue,.34*u,false,76);landmarkTube(spin,goldPoints,mat.gold,.34*u,false,76);
    landmarkMesh(spin,box,mat.blue,[1.38*u,1.55*u,.22*u],[.78*u,.58*u,.48*u],[0,0,-.08]);
    landmarkMesh(spin,box,mat.gold,[-1.38*u,3.52*u,.08*u],[.78*u,.58*u,.48*u],[0,0,.08]);
    for(const eye of [[1.2,1.62,.49],[1.48,1.62,.49],[-1.54,3.59,.35],[-1.26,3.59,.35]])landmarkMesh(spin,sphere,mat.white,eye.map(value=>value*u),[.105*u,.105*u,.07*u]);
    for(const pupil of [[1.22,1.62,.55],[1.5,1.62,.55],[-1.52,3.59,.41],[-1.24,3.59,.41]])landmarkMesh(spin,sphere,mat.dark,pupil.map(value=>value*u),[.045*u,.045*u,.035*u]);
    landmarkText(spin,'PYTHON',[0,4.48*u,.12*u],1.9*u,.38*u,'#73d0ff','Arial');
    movingLight=landmarkMesh(root,sphere,mat.star,[0,2.5*u,.8*u],[.14*u,.14*u,.14*u]);motionType='python';pulse=movingLight;
  }else if(index===4){
    const display=new THREE.Group();root.add(display);cameraFacing=display;
    landmarkMesh(display,box,mat.dark,[0,.72*u,0],[5.5*u,.28*u,3.45*u]);
    landmarkMesh(display,box,mat.blue,[0,.88*u,0],[5.08*u,.07*u,3.12*u]);
    // Central processor with visible pins and bright memory channels.
    landmarkMesh(display,box,mat.dark,[0,2.7*u,.12*u],[1.72*u,1.58*u,.48*u]);
    landmarkMesh(display,box,mat.cyan,[0,2.7*u,.38*u],[1.48*u,1.34*u,.12*u]);
    landmarkMesh(display,box,mat.dark,[0,2.7*u,.46*u],[1.18*u,1.04*u,.1*u]);
    landmarkMesh(display,box,mat.blue,[0,2.7*u,.53*u],[.76*u,.66*u,.12*u]);
    landmarkMesh(display,landmarkGeometry.octa,mat.star,[0,2.7*u,.66*u],[.28*u,.28*u,.28*u]);
    for(let i=0;i<6;i++){
      const p=(-.52+i*.208)*u;
      landmarkMesh(display,box,mat.gold,[p,1.84*u,.4*u],[.1*u,.27*u,.11*u]);
      landmarkMesh(display,box,mat.gold,[p,3.56*u,.4*u],[.1*u,.27*u,.11*u]);
      landmarkMesh(display,box,mat.cyan,[-.93*u,2.18*u+p,.4*u],[.22*u,.1*u,.11*u]);
      landmarkMesh(display,box,mat.cyan,[.93*u,2.18*u+p,.4*u],[.22*u,.1*u,.11*u]);
    }
    landmarkText(display,'CPU',[0,2.72*u,.61*u],.72*u,.27*u,'#dbfff7','Arial');
    for(const side of [-1,1]){
      const x=side*2.12*u;
      landmarkMesh(display,box,mat.dark,[x,2.7*u,.08*u],[.86*u,1.86*u,.42*u]);
      landmarkMesh(display,box,mat.cyan,[x,2.7*u,.31*u],[.72*u,1.68*u,.08*u]);
      landmarkMesh(display,box,mat.dark,[x,2.7*u,.37*u],[.57*u,1.48*u,.07*u]);
      for(let row=0;row<4;row++){
        const y=(2.12+row*.39)*u;
        landmarkMesh(display,box,row%2?mat.blue:mat.green,[x,y,.44*u],[.39*u,.23*u,.12*u]);
        landmarkMesh(display,box,mat.white,[x,y,.51*u],[.055*u,.065*u,.035*u]);
      }
      landmarkTube(display,[[side*1.42*u,2.7*u,.49*u],[side*1.63*u,2.7*u,.49*u],[side*1.82*u,2.7*u,.49*u]],mat.cyan,.055*u,false,36,8);
    }
    landmarkText(display,'MEMORY',[0,4.02*u,.4*u],2.1*u,.34*u,'#83fff0','Arial');
    const flowPoints=[[-2.67,2.7,.57],[-2.0,2.7,.57],[-1.35,2.7,.57],[-.72,2.7,.62],[0,2.7,.69],[.72,2.7,.62],[1.35,2.7,.57],[2.0,2.7,.57],[2.67,2.7,.57]].map(([x,y,z])=>new THREE.Vector3(x*u,y*u,z*u));
    motionCurve=new THREE.CatmullRomCurve3(flowPoints,false,'catmullrom',.5);
    landmarkTube(display,flowPoints.map(point=>[point.x,point.y,point.z]),mat.white,.035*u,false,96,6);
    movingLight=landmarkMesh(display,landmarkGeometry.heroSphere,mat.star,[-2.67*u,2.7*u,.61*u],[.17*u,.17*u,.17*u]);motionType='memoryflow';pulse=movingLight;
  }else if(index===5){
    const centerY=2.55*u;
    const diskGeometry=new THREE.RingGeometry(1.08*u,3.65*u,288,12);
    const diskPositions=diskGeometry.attributes.position,diskColors=[];
    const innerHeat=new THREE.Color(0xfff1cf),midHeat=new THREE.Color(0xff923f),outerHeat=new THREE.Color(0x76283f),sampleColor=new THREE.Color();
    for(let i=0;i<diskPositions.count;i++){
      const radius=Math.hypot(diskPositions.getX(i),diskPositions.getY(i))/u;
      const t=THREE.MathUtils.clamp((radius-1.08)/(3.65-1.08),0,1);
      if(t<.48)sampleColor.copy(innerHeat).lerp(midHeat,t/.48);
      else sampleColor.copy(midHeat).lerp(outerHeat,(t-.48)/.52);
      const turbulence=.93+.07*Math.sin(radius*15+Math.atan2(diskPositions.getY(i),diskPositions.getX(i))*7);
      diskColors.push(sampleColor.r*turbulence,sampleColor.g*turbulence,sampleColor.b*turbulence);
    }
    diskGeometry.setAttribute('color',new THREE.Float32BufferAttribute(diskColors,3));
    const diskMaterial=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.96,side:THREE.DoubleSide,depthWrite:false,toneMapped:false});
    const diskAssembly=new THREE.Group();diskAssembly.position.set(0,centerY,0);diskAssembly.rotation.set(Math.PI/2-.14,0,0);root.add(diskAssembly);
    const accretionDisk=new THREE.Mesh(diskGeometry,diskMaterial);accretionDisk.position.z=-.12*u;diskAssembly.add(accretionDisk);rotatingDisc=diskAssembly;
    const upperArc=[],lowerArc=[];
    for(let i=0;i<=72;i++){
      const x=-1.48+2.96*i/72,arcY=1.22*Math.sqrt(Math.max(0,1-(x/1.48)*(x/1.48)));
      upperArc.push([x*u,centerY+(arcY+.035)*u,-.18*u]);
      lowerArc.push([x*u,centerY-(arcY+.035)*u,-.18*u]);
    }
    focusOnlyHide.push(landmarkTube(root,upperArc,mat.white,.075*u,false,96,12));
    focusOnlyHide.push(landmarkTube(root,lowerArc,mat.cyan,.055*u,false,96,12));
    landmarkMesh(root,landmarkGeometry.heroSphere,mat.core,[0,centerY,.02*u],[1.02*u,1.02*u,1.02*u]);
    for(const [x,y,z] of [[-3.8,3.75,-.6],[-2.75,4.05,-.55],[2.9,3.8,-.62],[3.9,2.8,-.7],[-3.9,1.8,-.55],[3.15,1.2,-.7]]){
      landmarkMesh(root,sphere,mat.star,[x*u,y*u,z*u],[.055*u,.055*u,.055*u]);
    }
    movingLight=landmarkMesh(root,sphere,mat.white,[-1.48*u,centerY+.16*u,.18*u],[.14*u,.14*u,.14*u]);motionType='lens';pulse=movingLight;
  }else if(index===6){
    const center=[0,2.6*u,0],atoms=[[-1.48,3.35,.15],[1.48,3.35,.15],[-1.35,1.65,.2],[1.35,1.65,.2],[0,4.05,-.15],[0,1.08,-.15]];
    const bonds=atoms.map(([x,y,z])=>[x*u,y*u,z*u]);
    bonds.forEach(p=>landmarkTube(spin,[[center[0],center[1],center[2]],p],mat.white,.085*u,false,18));
    landmarkMesh(spin,sphere,mat.purple,center,[.72*u,.72*u,.72*u]);
    atoms.forEach(([x,y,z],i)=>landmarkMesh(spin,sphere,[mat.red,mat.cyan,mat.blue,mat.gold,mat.red,mat.cyan][i],[x*u,y*u,z*u],[.43*u,.43*u,.43*u]));
    for(let i=0;i<3;i++)landmarkMesh(spin,sphere,mat.star,[Math.cos(i*2.1)*2.1*u,2.6*u+Math.sin(i*2.1)*.8*u,.25*u],[.12*u,.12*u,.12*u]);
    pulse=spin.children[6];
  }else if(index===7){
    const strandA=[],strandB=[];
    for(let i=0;i<=100;i++){
      const t=i/100*Math.PI*4,y=(.55+4.05*i/100)*u;
      strandA.push([Math.sin(t)*.92*u,y,Math.cos(t)*.52*u]);
      strandB.push([-Math.sin(t)*.92*u,y,-Math.cos(t)*.52*u]);
    }
    landmarkTube(spin,strandA,mat.cyan,.12*u,false,120);landmarkTube(spin,strandB,mat.green,.12*u,false,120);
    for(let i=0;i<=12;i++){
      const t=i/12*Math.PI*4,y=(.55+4.05*i/12)*u;
      landmarkTube(spin,[[Math.sin(t)*.92*u,y,Math.cos(t)*.52*u],[-Math.sin(t)*.92*u,y,-Math.cos(t)*.52*u]],i%2?mat.gold:mat.white,.045*u,false,12);
    }
    landmarkTube(root,[[0,.55*u,0],[0,.12*u,0],[-.4*u,-.24*u,0]],mat.stone,.08*u,false,18);
    for(const side of [-1,1]){
      const leaf=landmarkMesh(root,sphere,mat.green,[side*.62*u,.78*u,0],[.42*u,.2*u,.16*u],[0,0,side*.5]);
      if(side===1)pulse=leaf;
    }
    movingLight=landmarkMesh(root,sphere,mat.star,[0,.9*u,.55*u],[.14*u,.14*u,.14*u]);motionType='biology';
  }else if(index===8){
    const solarDisplay=new THREE.Group();root.add(solarDisplay);cameraFacing=solarDisplay;
    solarCenterY=2.72*u;
    const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=128;
    const glowContext=glowCanvas.getContext('2d'),glowGradient=glowContext.createRadialGradient(64,64,2,64,64,62);
    glowGradient.addColorStop(0,'rgba(255,244,190,0.92)');glowGradient.addColorStop(.28,'rgba(255,196,92,0.42)');glowGradient.addColorStop(1,'rgba(255,150,40,0)');
    glowContext.fillStyle=glowGradient;glowContext.fillRect(0,0,128,128);
    const glowTexture=new THREE.CanvasTexture(glowCanvas);glowTexture.colorSpace=THREE.SRGBColorSpace;
    const sunGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color:0xffd77b,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
    sunGlow.position.set(0,solarCenterY,.04*u);sunGlow.scale.set(2.25*u,2.25*u,1);solarDisplay.add(sunGlow);
    const sunMaterial=new THREE.MeshBasicMaterial({color:0xffd35b,toneMapped:false});
    const sun=landmarkMesh(solarDisplay,landmarkGeometry.heroSphere,sunMaterial,[0,solarCenterY,.12*u],[.58*u,.58*u,.58*u]);pulse=sun;
    const orbitRadii=[1.12,1.83,2.62,3.48].map(value=>value*u);
    const planetSizes=[.16,.23,.27,.21].map(value=>value*u);
    const planetMaterials=[
      new THREE.MeshStandardMaterial({color:0xaaa8a4,roughness:.84}),
      new THREE.MeshStandardMaterial({color:0xe8bb78,roughness:.78}),
      new THREE.MeshStandardMaterial({color:0x4d9be0,emissive:0x0b2948,emissiveIntensity:.3,roughness:.58}),
      new THREE.MeshStandardMaterial({color:0xd36c4d,roughness:.82})
    ];
    const orbitColors=[0xe2d4a1,0xf1c883,0x73d7e4,0xe18f6e];
    const planetSpeeds=[.82,.61,.43,.31],planetPhases=[.5,2.1,3.6,5.2];
    for(let i=0;i<4;i++){
      const radius=orbitRadii[i],ellipse=.68;
      const orbitGeometry=new THREE.TorusGeometry(radius,.022*u,6,128);
      const orbitMaterial=new THREE.MeshBasicMaterial({color:orbitColors[i],transparent:true,opacity:.58,depthWrite:false,toneMapped:false});
      const orbitMesh=new THREE.Mesh(orbitGeometry,orbitMaterial);orbitMesh.position.y=solarCenterY;orbitMesh.scale.y=ellipse;orbitMesh.castShadow=false;orbitMesh.receiveShadow=false;solarDisplay.add(orbitMesh);
      const planet=new THREE.Group();planet.position.set(Math.cos(planetPhases[i])*radius,solarCenterY+Math.sin(planetPhases[i])*radius*ellipse,.2*u);solarDisplay.add(planet);
      landmarkMesh(planet,landmarkGeometry.heroSphere,planetMaterials[i],[0,0,0],[planetSizes[i],planetSizes[i],planetSizes[i]]);
      if(i===2){
        for(const [px,py,sx,sy] of [[-.38,.2,.3,.18],[.27,.34,.24,.14],[-.05,-.36,.22,.13]]){
          landmarkMesh(planet,landmarkGeometry.heroSphere,mat.green,[px*planetSizes[i],py*planetSizes[i],planetSizes[i]*.82],[sx*planetSizes[i],sy*planetSizes[i],.055*planetSizes[i]]);
        }
        const atmosphere=new THREE.Mesh(new THREE.SphereGeometry(1,32,20),new THREE.MeshBasicMaterial({color:0x83dfff,transparent:true,opacity:.16,side:THREE.BackSide,depthWrite:false}));
        atmosphere.scale.setScalar(planetSizes[i]*1.17);planet.add(atmosphere);
      }
      solarOrbits.push({mesh:planet,radius,speed:planetSpeeds[i],phase:planetPhases[i],ellipse,z:.2*u});
    }
  }else if(index===9){
    const globe=landmarkMesh(spin,landmarkGeometry.heroSphere,mat.ocean,[0,2.35*u,0],[1.65*u,1.65*u,1.65*u]);
    landmarkMesh(root,landmarkGeometry.heroTorus,mat.cyan,[0,2.35*u,0],[1.98*u,1.98*u,.09*u],[Math.PI/2,.3,0]);
    for(const p of [[-.82,2.85,.88],[.62,2.95,.72],[.15,1.85,1.28],[-.48,2.3,1.4]])landmarkMesh(spin,sphere,mat.green,p.map(value=>value*u),[.46*u,.23*u,.12*u]);
    landmarkTube(spin,[[-1.25*u,2.45*u,1.02*u],[-.65*u,2.6*u,1.42*u],[.05*u,2.35*u,1.62*u],[.78*u,2.58*u,1.22*u]],mat.blue,.075*u,false,48);
    landmarkMesh(spin,landmarkGeometry.cone,mat.white,[.45*u,3.7*u,.65*u],[.42*u,.75*u,.42*u]);
    movingLight=landmarkMesh(root,sphere,mat.star,[-1.25*u,2.45*u,1.1*u],[.15*u,.15*u,.15*u]);motionType='geography';pulse=globe;
  }else if(index===10){
    landmarkTube(root,[[-1.58*u,.75*u,.15*u],[-1.58*u,2.6*u,.15*u],[-1.38*u,3.55*u,.15*u],[-.82*u,4.12*u,.15*u],[0,4.3*u,.15*u],[.82*u,4.12*u,.15*u],[1.38*u,3.55*u,.15*u],[1.58*u,2.6*u,.15*u],[1.58*u,.75*u,.15*u]],mat.stone,.2*u,false,72);
    landmarkMesh(root,box,mat.stone,[-1.58*u,1.35*u,0],[.48*u,2.15*u,.62*u]);
    landmarkMesh(root,box,mat.stone,[1.58*u,1.35*u,0],[.48*u,2.15*u,.62*u]);
    landmarkMesh(root,torus,mat.gold,[0,2.7*u,.42*u],[1.5*u,1.5*u,.12*u],[Math.PI/2,0,0]);
    landmarkMesh(root,cylinder,mat.gold,[0,2.65*u,.48*u],[.16*u,1.05*u,.16*u]);
    landmarkMesh(root,landmarkGeometry.cone,mat.gold,[0,3.18*u,.5*u],[.52*u,.62*u,.52*u]);
    landmarkMesh(root,landmarkGeometry.cone,mat.gold,[0,2.12*u,.5*u],[.52*u,.62*u,.52*u],[0,0,Math.PI]);
    landmarkTube(root,[[-.34*u,2.78*u,.6*u],[0,2.92*u,.6*u],[.34*u,2.78*u,.6*u]],mat.white,.055*u,false,20);
    landmarkText(root,'HISTORY',[0,4.02*u,.38*u],1.45*u,.34*u,'#f2dba0');
    pulse=spinPivot;
  }else if(index===11){
    const languageDisplay=new THREE.Group();root.add(languageDisplay);cameraFacing=languageDisplay;
    landmarkMesh(languageDisplay,box,mat.dark,[0,1.38*u,0],[2.95*u,.26*u,1.9*u]);
    landmarkMesh(languageDisplay,box,mat.page,[-.7*u,2.17*u,.07*u],[1.28*u,1.42*u,.16*u],[0,0,-.12]);
    landmarkMesh(languageDisplay,box,mat.page,[.7*u,2.17*u,.07*u],[1.28*u,1.42*u,.16*u],[0,0,.12]);
    landmarkMesh(languageDisplay,box,mat.gold,[0,2.12*u,.17*u],[.13*u,1.36*u,.2*u]);
    for(let i=0;i<4;i++){
      const y=(1.7+i*.23)*u;
      landmarkTube(languageDisplay,[[-1.17*u,y,.18*u],[-.45*u,y,.2*u]],i===0?mat.gold:mat.blue,.035*u,false,16,6);
      landmarkTube(languageDisplay,[[.45*u,y,.18*u],[1.17*u,y,.2*u]],i===1?mat.cyan:mat.purple,.035*u,false,16,6);
    }
    landmarkText(languageDisplay,'A  ·  文  ·  Ω',[0,3.62*u,.31*u],3.35*u,.58*u,'#f5df9b','Arial');
    for(const [x,y,color] of [[-1.42,3.23,'#8ce4d7'],[1.42,3.34,'#ffd274'],[-1.72,2.82,'#bda6ff'],[1.7,2.72,'#8ebeff']]){
      landmarkText(languageDisplay,x<0?'A':'文',[x*u,y*u,.2*u],.42*u,.42*u,color,'Arial');
    }
    sway=languageDisplay;
  }else if(index===12){
    landmarkMesh(root,sphere,mat.blue,[0,2.55*u,0],[.88*u,.88*u,.88*u]);
    const symbols=[[-1.85,3.35,.1],[1.85,3.35,.1],[-1.85,1.75,.1],[1.85,1.75,.1],[0,4.2,0]];
    symbols.forEach((p,i)=>{
      landmarkTube(root,[[0,2.55*u,0],[p[0]*u,p[1]*u,p[2]*u]],[mat.cyan,mat.gold,mat.red,mat.purple,mat.white][i],.055*u,false,24);
      landmarkMesh(spin,i===2?torus:landmarkGeometry.octa,[mat.cyan,mat.gold,mat.red,mat.purple,mat.white][i],[p[0]*u,p[1]*u,p[2]*u],[.42*u,.42*u,.42*u]);
    });
    const halo=landmarkMesh(spin,torus,mat.cyan,[0,2.55*u,0],[2.32*u,2.32*u,.12*u],[Math.PI/2,.18,0]);pulse=halo;
  }else if(index===13){
    const deathX=-1.24*u,deathY=2.44*u;
    landmarkMesh(root,box,mat.page,[deathX,deathY,0],[1.72*u,2.82*u,.36*u]);
    landmarkMesh(root,box,mat.dark,[deathX,deathY,.21*u],[1.88*u,3.02*u,.15*u],[0,0,-.045]);
    landmarkMesh(root,box,mat.dark,[deathX-.86*u,deathY,.12*u],[.2*u,3.02*u,.38*u],[0,0,-.045]);
    for(const x of [deathX-.78*u,deathX+.78*u])landmarkMesh(root,box,mat.white,[x,deathY,.3*u],[.035*u,2.74*u,.035*u]);
    for(const y of [deathY-1.37*u,deathY+1.37*u])landmarkMesh(root,box,mat.white,[deathX,y,.3*u],[1.56*u,.035*u,.035*u]);
    landmarkText(root,'DEATH NOTE',[deathX,deathY+.46*u,.32*u],1.55*u,.38*u,'#f4f0e6','Georgia');
    landmarkTube(root,[[deathX-.52*u,deathY-.45*u,.32*u],[deathX-.2*u,deathY-.32*u,.32*u],[deathX+.2*u,deathY-.38*u,.32*u],[deathX+.52*u,deathY-.53*u,.32*u]],mat.white,.035*u,false,28);
    const powerX=1.2*u,powerY=2.28*u;
    landmarkMesh(root,box,mat.page,[powerX,powerY,0],[1.62*u,2.56*u,.36*u]);
    landmarkMesh(root,box,mat.dark,[powerX,powerY,.21*u],[1.78*u,2.74*u,.15*u],[0,0,.035]);
    landmarkMesh(root,box,mat.red,[powerX,powerY,.3*u],[1.65*u,2.6*u,.075*u],[0,0,.035]);
    landmarkMesh(root,box,mat.dark,[powerX-.79*u,powerY,.12*u],[.2*u,2.74*u,.38*u],[0,0,.035]);
    const foil=new THREE.MeshStandardMaterial({color:0xffd981,emissive:0x7a4b10,emissiveIntensity:.35,metalness:.72,roughness:.27});
    for(const x of [powerX-.69*u,powerX+.69*u])landmarkMesh(root,box,foil,[x,powerY,.35*u],[.035*u,2.4*u,.03*u]);
    for(const y of [powerY-1.2*u,powerY+1.2*u])landmarkMesh(root,box,foil,[powerX,y,.35*u],[1.38*u,.035*u,.03*u]);
    landmarkText(root,['48 LAWS','OF POWER'],[powerX,powerY,.36*u],1.28*u,.82*u,'#ffe8a6','Georgia');
    landmarkMesh(root,sphere,mat.red,[-2.3*u,.9*u,.62*u],[.34*u,.34*u,.31*u]);
    landmarkMesh(root,landmarkGeometry.cone,mat.green,[-2.18*u,1.22*u,.64*u],[.13*u,.2*u,.13*u],[0,0,-.42]);
    landmarkTube(spin,[[-2.65*u,.7*u,.08*u],[-2.9*u,1.55*u,.08*u],[-2.6*u,2.4*u,.08*u],[-2.15*u,3.2*u,.08*u]],mat.white,.055*u,false,40);
    pulse=landmarkMesh(spin,sphere,mat.star,[-2.15*u,3.2*u,.08*u],[.13*u,.13*u,.13*u]);sway=spinPivot;
  }else{
    landmarkMesh(root,box,mat.stone,[-1.05*u,.55*u,0],[1.75*u,.24*u,1.1*u]);
    landmarkMesh(root,cylinder,mat.gold,[-1.05*u,1.83*u,0],[.2*u,2.35*u,.2*u]);
    landmarkMesh(root,sphere,mat.gold,[-1.05*u,3.1*u,0],[.3*u,.3*u,.3*u]);
    landmarkMesh(root,box,mat.gold,[-1.05*u,3.05*u,0],[3.05*u,.16*u,.2*u]);
    for(const x of [-2.25,-.05]){
      landmarkTube(root,[[x*u,2.98*u,.05*u],[x*u,2.18*u,.05*u],[x*u-.34*u,1.82*u,.05*u]],mat.white,.045*u,false,20);
      landmarkTube(root,[[x*u,2.98*u,.05*u],[x*u,2.18*u,.05*u],[x*u+.34*u,1.82*u,.05*u]],mat.white,.045*u,false,20);
      landmarkMesh(root,torus,mat.gold,[x*u,1.72*u,.06*u],[.62*u,.62*u,.12*u],[Math.PI/2,0,0]);
      landmarkMesh(root,cylinder,mat.gold,[x*u-.12*u,1.77*u,.06*u],[.16*u,.08*u,.16*u]);
      landmarkMesh(root,cylinder,mat.gold,[x*u+.12*u,1.77*u,.06*u],[.16*u,.08*u,.16*u]);
    }
    for(let i=0;i<5;i++){
      const h=(.65+i*.37)*u,x=(.62+i*.43)*u;
      landmarkMesh(root,box,[mat.cyan,mat.blue,mat.gold,mat.purple,mat.red][i],[x,.58*u+h/2,.08*u],[.28*u,h,.34*u]);
    }
    const marketCurve=[];
    for(let i=0;i<=48;i++){const t=i/48,x=.48+2.05*t;marketCurve.push([x*u,(1.05+.28*t+1.05*t*t)*u,.48*u]);}
    landmarkTube(spin,marketCurve,mat.cyan,.085*u,false,64);
    movingLight=landmarkMesh(root,sphere,mat.star,[.48*u,1.05*u,.56*u],[.19*u,.19*u,.19*u]);motionType='market';pulse=movingLight;
    landmarkTube(root,[[.4*u,.58*u,.08*u],[2.75*u,.58*u,.08*u]],mat.white,.035*u,false,24);
  }
  focusDetail=null;
  const storyPalettes=[
    [mat.cyan,mat.blue,mat.gold],[mat.white,mat.red,mat.blue],[mat.cyan,mat.gold,mat.blue],
    [mat.blue,mat.gold,mat.cyan],[mat.cyan,mat.green,mat.star],[mat.star,mat.white,mat.gold],
    [mat.red,mat.cyan,mat.gold],[mat.green,mat.cyan,mat.white],[mat.star,mat.blue,mat.red],
    [mat.cyan,mat.green,mat.blue],[mat.gold,mat.white,mat.red],[mat.gold,mat.cyan,mat.purple],
    [mat.cyan,mat.gold,mat.purple],[mat.red,mat.white,mat.cyan],[mat.green,mat.gold,mat.cyan]
  ];
  for(let i=0;i<3;i++){
    const actor=landmarkMesh(root,landmarkGeometry.storySphere,storyPalettes[index][i],[0,2.5*u,.9*u],[.15*u,.15*u,.15*u]);
    actor.visible=false;focusActors.push(actor);
  }
  landmarkAnimations.push({root,baseScale,spin:spinPivot,pulse,pulseBase:pulse?pulse.scale.clone():null,sway,rotatingDisc,cameraFacing,motionCurve,solarOrbits,solarCenterY,phase:index*.73,index,unit:u,motionType,movingLight,movingLightRadius,movingLightY,movingLightZ,focusActors,focusDetail,focusOnlyHide,spinSpeed:index===0?0:index===3?.28:index===4?0:index===5?0:index===7?.12:index===8?0:index===9?.08:.14,pulseAmplitude:index===3?.1:index===5?.1:.055});
  return root;
}
function animateFocusStory(item,time){
  const actors=item.focusActors;if(!actors?.length)return;
  const u=item.unit,count=actors.length;
  for(let i=0;i<count;i++){
    const actor=actors[i],t=((time*(item.index===5?.13:.19)+i/count+item.phase*.025)%1+1)%1;
    const angle=time*.72+i*Math.PI*2/count+item.phase;
    if(item.index===0&&item.motionCurve)actor.position.copy(item.motionCurve.getPointAt(t));
    else if(item.index===1){const x=-3.25+6.5*t;actor.position.set(x*u,(2.3+(i-1)*.55*t)*u,.78*u);}
    else if(item.index===2){const x=-1.15+2.3*t;actor.position.set(x*u,(1.7+.55*Math.sin(t*Math.PI*2+i*.7))*u,.66*u);}
    else if(item.index===3){const d=1+Math.sin(angle*1.3)**2;actor.position.set(2.45*Math.cos(angle)/d*u,(2.5+1.9*Math.sin(angle)*Math.cos(angle)/d)*u,.82*u);}
    else if(item.index===4){const row=(i+Math.floor(time*.45))%6;actor.position.set((-2.45+4.9*t)*u,(1.78+row*.39)*u,.74*u);}
    else if(item.index===5){const inward=1-t,radius=.16+3.42*inward;actor.position.set(Math.cos(angle*2.2+i)*radius*u,(2.55+.48*Math.sin(angle*1.7))*u,.36*u+.28*inward);actor.scale.setScalar(u*(.045+.115*inward));}
    else if(item.index===6)actor.position.set(1.6*Math.cos(angle)*u,(2.6+.82*Math.sin(angle+i*.3))*u,.72*u+.28*Math.sin(angle));
    else if(item.index===7){const strand=angle*1.1;actor.position.set(.92*Math.sin(strand)*u,(.55+4.05*t)*u,.64*u+.14*Math.cos(strand));}
    else if(item.index===8){const orbit=item.solarOrbits[i%item.solarOrbits.length],a=angle*(.42+i*.08);actor.position.set(Math.cos(a)*orbit.radius,item.solarCenterY+Math.sin(a)*orbit.radius*orbit.ellipse,.65*u);}
    else if(item.index===9){const longitude=angle*.48;actor.position.set(1.68*Math.cos(longitude)*u,(2.35+.82*Math.sin(angle*.7+i*.2))*u,1.68*Math.sin(longitude)*u);}
    else if(item.index===10)actor.position.set((i-1)*.11*u,(3.18-1.22*t)*u,.76*u);
    else if(item.index===11)actor.position.set((-1.25+2.5*t)*u,(2.0+(i-1)*.65+.08*Math.sin(angle))*u,.72*u);
    else if(item.index===12)actor.position.set(2.05*Math.cos(angle)*u,(2.55+1.25*Math.sin(angle)*.65)*u,.42*u);
    else if(item.index===13){const r=2.45*(1-.68*t);actor.position.set(Math.cos(angle*1.5)*r*u,(1.25+2.25*t)*u,.72*u);}
    else {const x=.48+2.05*t,y=1.05+.28*t+1.05*t*t;actor.position.set(x*u,y*u,.72*u);}
    if(item.index!==5)actor.scale.setScalar(u*(.105+.045*(.5+.5*Math.sin(time*2.6+i*2.1))));
  }
}
const islands=[],pickTargets=[];
const archipelago=new THREE.Group();
scene.add(archipelago);
const islandModelPlacements=[],islandModelBatches=[];
const islandModelMatrixDummy=new THREE.Object3D();
function buildIslandModelInstances(){
  const cache=new Map(),bySource=new Map();
  for(const placement of islandModelPlacements){
    if(!bySource.has(placement.source))bySource.set(placement.source,[]);
    bySource.get(placement.source).push(placement);
  }
  for(const [source,placements] of bySource){
    for(const part of getBakedModelParts(source,cache)){
      const mesh=new THREE.InstancedMesh(part.geometry,part.material,placements.length);
      mesh.castShadow=false;mesh.receiveShadow=true;mesh.frustumCulled=true;
      placements.forEach((placement,index)=>{
        islandModelMatrixDummy.position.copy(placement.group.position);
        islandModelMatrixDummy.rotation.copy(placement.group.rotation);
        islandModelMatrixDummy.scale.setScalar(placement.size);islandModelMatrixDummy.updateMatrix();
        mesh.setMatrixAt(index,islandModelMatrixDummy.matrix);placement.instances.push({mesh,index});
      });
      mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();archipelago.add(mesh);islandModelBatches.push(mesh);
    }
  }
}
function updateIslandModelMatrices(){
  for(const placement of islandModelPlacements){
    islandModelMatrixDummy.position.copy(placement.group.position);
    islandModelMatrixDummy.rotation.copy(placement.group.rotation);
    islandModelMatrixDummy.scale.setScalar(placement.size);islandModelMatrixDummy.updateMatrix();
    for(const instance of placement.instances)instance.mesh.setMatrixAt(instance.index,islandModelMatrixDummy.matrix);
  }
  for(const mesh of islandModelBatches)mesh.instanceMatrix.needsUpdate=true;
}
const orbit=[];
for(let i=0;i<subjects.length;i++){
  const angle=(i/subjects.length)*Math.PI*2;
  const radius=54+rand(i*29)*4;
  orbit.push({
    x:Math.sin(angle)*radius,
    z:-Math.cos(angle)*radius,
    y:23+rand(i*43)*3,
    size:9.5+rand(i*31)*3.8
  });
}
for(let i=0;i<subjects.length;i++){
  const {x,z,y,size}=orbit[i],group=new THREE.Group();group.position.set(x,y,z);archipelago.add(group);
  const modelPlacement={source:islandSources[i%islandSources.length],group,size,instances:[]};
  islandModelPlacements.push(modelPlacement);
    const landmark=buildSubjectLandmark(group,i,size);
  for(let j=0;j<2+i%3;j++){
    const a=rand(i*19+j*7)*Math.PI*2,r=size*(.16+rand(i*31+j*13)*.43);
    makeIslandTree(group,Math.cos(a)*r,Math.sin(a)*r,.72+rand(i*23+j*17)*.38,i*11+j,j===0?detailTreeSource:forestTreeSource);
  }
  const hit=new THREE.Mesh(new THREE.SphereGeometry(size*1.18,16,12),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false}));
  hit.position.y=1.4;hit.userData.index=i;group.add(hit);pickTargets.push(hit);
  const halo=new THREE.Mesh(new THREE.TorusGeometry(size*.78,.15,8,64),new THREE.MeshBasicMaterial({color:0x42b7a9,transparent:true,opacity:.78}));
  halo.rotation.x=-Math.PI/2;halo.position.y=.45;halo.visible=false;group.add(halo);
  const tag=document.createElement('div');tag.className='island-tag';tag.textContent=subjects[i];stage.querySelector('.hud').appendChild(tag);
  islands.push({group,halo,hit,tag,x,y,z,size,name:subjects[i],phase:i*1.63,landmark,modelPlacement});
}

buildIslandModelInstances();
buildIslandTreeInstances();
const referenceLandmark=islands[9].landmark;
referenceLandmark.updateMatrixWorld(true);
const referenceBounds=new THREE.Box3().setFromObject(referenceLandmark);
const referenceExtent=Math.max(...referenceBounds.getSize(new THREE.Vector3()).toArray());
for(const island of islands){
  island.landmark.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(island.landmark);
  const extent=Math.max(...bounds.getSize(new THREE.Vector3()).toArray());
  const factor=referenceExtent*1.32/Math.max(extent,.001);
  island.landmark.scale.multiplyScalar(factor);
  const animation=landmarkAnimations.find(item=>item.root===island.landmark);
  if(animation)animation.baseScale*=factor;

}
for(let i=0;i<islands.length;i++){
  const a=islands[i],b=islands[(i+1)%islands.length];
  const start=new THREE.Vector3(a.x,a.y+1.6,a.z),end=new THREE.Vector3(b.x,b.y+1.6,b.z);
  const mid=start.clone().add(end).multiplyScalar(.5);mid.y+=3.2;
  mid.addScaledVector(new THREE.Vector3(mid.x,0,mid.z).normalize(),2.4);
  const curve=new THREE.QuadraticBezierCurve3(start,mid,end);
  const path=new THREE.Mesh(new THREE.TubeGeometry(curve,24,.075,6,false),
    new THREE.MeshStandardMaterial({color:0x268a82,emissive:0x0a615b,emissiveIntensity:.12,roughness:.52}));
  archipelago.add(path);
}

for(const index of[2,6,10,13]){
  const island=islands[index],a=index*2.31,p=island.group.position;
  const start=new THREE.Vector3(p.x+Math.cos(a)*island.size*.54,p.y-1,p.z+Math.sin(a)*island.size*.54);
  const end=start.clone().add(new THREE.Vector3(0,-12,0));
  const curve=new THREE.QuadraticBezierCurve3(start,start.clone().add(new THREE.Vector3(1,-5,0)),end);
  archipelago.add(new THREE.Mesh(new THREE.TubeGeometry(curve,24,.105,7,false),
    new THREE.MeshBasicMaterial({color:0xa5ddd4,transparent:true,opacity:.46})));
}

const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
let lastPointerX=null,lastPointerY=null,lastTouchX=null,hovered=null,selectedIsland=null,pointerInsideStage=false,elapsed=0,last=performance.now(),lastTagUpdate=0,visible=true,active=true,frameRequest=0;
let cycleEpoch=performance.now()-(performanceParams.get('time')==='night'?60000:0);const maxFrameInterval=1000/144;
const cameraShift=new THREE.Vector2(startingCameraYaw,startingCameraPitch),autoCameraSpeed=.036;
const focusShade=document.querySelector('#focusShade'),focusFlash=document.querySelector('#focusFlash');
const focusStoryCue=document.querySelector('#focusStoryCue'),focusGraph=document.querySelector('#focusGraph'),focusGraphCanvas=document.querySelector('#focusGraphCanvas'),focusGraphLabel=document.querySelector('#focusGraphLabel');
const focusPuzzle=document.querySelector('#focusPuzzle'),focusPuzzleFeedback=document.querySelector('#focusPuzzleFeedback');
const subjectInfo=document.querySelector('#subjectInfo'),subjectInfoTitle=document.querySelector('#subjectInfoTitle');
const subjectInfoEyebrow=document.querySelector('#subjectInfoEyebrow'),subjectInfoText=document.querySelector('#subjectInfoText');
const subjectInfoClose=document.querySelector('#subjectInfoClose');
let focusTransition=null,focusedSceneActive=false,focusedSceneSnapshot=null,focusPauseStarted=0,desmosLoadPromise=null,desmosCalculator=null,focusGraphGeneration=0,lastStoryBeat=-1,focusPuzzleStep=0;
const focusBeatData=[
['Three squares appear around a right triangle.','Their grid pieces move into one larger square.','The rearranged pieces settle into a clear proof.'],
['A rusty magnet drops above the samples.','Field lines appear; filings gather while stones stay put.','The experiment leaves a visible result to compare.'],
['Brass gears and a piston take their places.','A spark travels through the assembled engine.','The machine turns and sends out a beam.'],
['Mixed values enter the conveyor.','A scanner routes each cube toward its matching stack.','The sorted stacks hold while new values arrive.'],
['The processor wakes from darkness.','A pulse travels through the core and lights memory.','The stored pattern returns as an output.'],
['The event horizon appears as a black shadow.','A hot disk swirls inward and background light bends around it.','The curved rays disappear behind the horizon.'],
['Two hydrogen pairs meet an oxygen pair.','Bonds break as the atoms rearrange.','Two water molecules drift apart.'],
['The DNA ladder begins to unzip.','An enzyme passes down the strands as matching bases form.','Two completed helices remain inside the cell.'],
['The Sun ignites at the center.','Mercury, Venus, Earth, and Mars speed along their paths.','The full inner system settles into view.'],
['Sunlight warms the ocean.','Vapor rises into a cloud that crosses the mountain.','Rain feeds a river back to the sea.'],
['The oldest layer comes into view.','A stone tool, coin, gear, and chip surface in sequence.','The artifacts form a timeline through the strata.'],
['A gesture carries the first message.','Tablet, book, and phone appear in succession.','A signal travels beyond the frame.'],
['Four instruments lift from the desk.','Their clues link around a holographic map.','The scan settles into one connected picture.'],
['The clue board begins in disarray.','A red thread draws a route between evidence and books.','The conclusion receives its solved mark.'],
['Raw materials leave the factory.','Boxes travel to the market as coins return along the road.','The exchange continues as the chart rises.']
];
const desmosProfiles={
 0:{label:'AREA REASSEMBLY · MATHEMATICS',slider:{min:'0',max:'6.283'},bounds:{left:-3.2,right:3.2,bottom:-3.2,top:3.2},expressions:[{id:'rose',latex:'(2cos(t)(1+cos(3t)),2sin(t)(1+cos(3t)))',parametricDomain:{min:'0',max:'6.283'},color:'#54d8d0',lineWidth:4,secret:true},{id:'point',latex:'(2cos(t)(1+cos(3t)),2sin(t)(1+cos(3t)))',color:'#ffd274',pointStyle:'POINT',secret:true}]},
 3:{label:'SORTED VALUES · ALGORITHMS',slider:{min:'0',max:'1'},bounds:{left:-.08,right:1.08,bottom:-.08,top:1.08},expressions:[{id:'logistic',latex:'y=3.72x(1-x)',color:'#58d8d2',lineWidth:4,secret:true},{id:'identity',latex:'y=x',color:'#8a9eaa',lineStyle:'DASHED',secret:true},{id:'point',latex:'(mod(t,1),3.72mod(t,1)(1-mod(t,1)))',color:'#ffd274',pointStyle:'POINT',secret:true}]},
 4:{label:'MEMORY ACTIVITY · COMPUTER SCIENCE',slider:{min:'0',max:'1'},bounds:{left:0,right:1,bottom:-.2,top:1.3},expressions:[{id:'bits',latex:'y=mod(floor(2x),2)',color:'#58d8d2',lineWidth:4,secret:true},{id:'sample',latex:'(mod(t,1),mod(floor(2mod(t,1)),2))',color:'#ffd274',pointStyle:'POINT',secret:true}]},
 5:{label:'BENT LIGHT · PHYSICS',slider:{min:'-1.25',max:'1.25'},bounds:{left:-5,right:5,bottom:-3.3,top:3.3},expressions:[{id:'shadow',latex:'x^2+y^2<.22^2',color:'#03070c',secret:true},{id:'upper-ray',latex:'(4t,.22+1.12(1-e^(-4t^2)))',parametricDomain:{min:'-1.25',max:'1.25'},color:'#ffd274',lineWidth:4,secret:true},{id:'lower-ray',latex:'(4t,-.22-1.12(1-e^(-4t^2)))',parametricDomain:{min:'-1.25',max:'1.25'},color:'#7ee7e0',lineWidth:3,secret:true},{id:'photon',latex:'(4t,.22+1.12(1-e^(-4t^2)))',color:'#fff3ce',pointStyle:'POINT',secret:true}]}
};
function loadDesmosApi(){
 if(window.Desmos)return Promise.resolve(window.Desmos);
 if(!desmosLoadPromise)desmosLoadPromise=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://www.desmos.com/api/v1.12/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6';script.async=true;script.onload=()=>window.Desmos?resolve(window.Desmos):reject(new Error('Desmos API unavailable'));script.onerror=()=>reject(new Error('Desmos could not be reached'));document.head.appendChild(script);});
 return desmosLoadPromise;
}
function clearFocusGraph(){focusGraphGeneration++;if(desmosCalculator){desmosCalculator.destroy();desmosCalculator=null;}focusGraph.classList.remove('on','offline');focusGraph.setAttribute('aria-hidden','true');focusGraphCanvas.innerHTML='';}
function showFocusGraph(index){
 clearFocusGraph();const profile=desmosProfiles[index];if(!profile)return;const generation=focusGraphGeneration;focusGraphLabel.textContent=profile.label;focusGraph.classList.add('on');focusGraph.setAttribute('aria-hidden','false');
 loadDesmosApi().then(Desmos=>{if(generation!==focusGraphGeneration||!focusedSceneActive)return;desmosCalculator=Desmos.GraphingCalculator(focusGraphCanvas,{expressions:false,keypad:false,settingsMenu:false,zoomButtons:false,pointsOfInterest:false,trace:false,expressionsTopbar:false,folders:false,notes:false,images:false,sliders:false,lockViewport:true,border:false,backgroundColor:'#132530',xAxisColor:'#78909a',yAxisColor:'#78909a',gridColor:'#29424a'});desmosCalculator.setMathBounds(profile.bounds);desmosCalculator.setExpressions([{id:'t',latex:'t=0',sliderBounds:profile.slider,playing:true,secret:true},...profile.expressions]);desmosCalculator.resize();})
 .catch(()=>{if(generation!==focusGraphGeneration||!focusedSceneActive)return;focusGraph.classList.add('offline');focusGraphCanvas.innerHTML='<svg viewBox="0 0 240 120" width="100%" height="120" aria-hidden="true"><path d="M12 60H228M120 8V112" stroke="#536c76"/><path d="M15 82 C47 8 83 107 120 42 S190 15 225 68" fill="none" stroke="#58d8d2" stroke-width="4"/><circle cx="120" cy="42" r="5" fill="#ffd274"/></svg>';});
}
function resetFocusPuzzle(){focusPuzzleStep=0;focusPuzzleFeedback.textContent='Choose the steps in order to reveal the final clue.';focusPuzzle.querySelectorAll('button').forEach(b=>{b.classList.remove('done');b.disabled=false;b.setAttribute('aria-pressed','false');});}
focusPuzzle.addEventListener('click',event=>{
 const b=event.target.closest('button[data-step]');if(!b||!focusedSceneActive||selectedIsland!==12)return;event.stopPropagation();
 if(Number(b.dataset.step)===focusPuzzleStep){b.classList.add('done');b.disabled=true;b.setAttribute('aria-pressed','true');focusPuzzleStep++;if(focusPuzzleStep===3)focusPuzzleFeedback.textContent='Discovery: connect evidence to explain what you first observed.';else focusPuzzleFeedback.textContent=focusPuzzleStep===1?'Now compare the second clue.':'One last step: connect what the clues share.';}
 else{focusPuzzleFeedback.textContent='That clue comes later. Start with Observe, then follow the evidence.';resetFocusPuzzle();}
});

let focusWorldPauseStarted=0,focusOriginalRootRotation=null,focusBloomTarget=null,focusBloomScene=null,focusBloomCamera=null,focusBloomMaterial=null,focusBloomMesh=null;
function disposeFocusBloom(){if(focusBloomTarget)focusBloomTarget.dispose();if(focusBloomMaterial)focusBloomMaterial.dispose();if(focusBloomMesh)focusBloomMesh.geometry.dispose();focusBloomTarget=focusBloomScene=focusBloomCamera=focusBloomMaterial=focusBloomMesh=null;}
function resizeFocusBloom(){if(!focusedSceneActive||!focusBloomTarget)return;const s=new THREE.Vector2();renderer.getDrawingBufferSize(s);focusBloomTarget.setSize(Math.max(1,s.x),Math.max(1,s.y));focusBloomMaterial.uniforms.texel.value.set(1/s.x,1/s.y);}
function createFocusBloom(){disposeFocusBloom();focusBloomTarget=new THREE.WebGLRenderTarget(1,1,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat,depthBuffer:true});focusBloomScene=new THREE.Scene();focusBloomCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);focusBloomMaterial=new THREE.ShaderMaterial({uniforms:{image:{value:focusBloomTarget.texture},texel:{value:new THREE.Vector2(1,1)}},vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:'uniform sampler2D image;uniform vec2 texel;varying vec2 v;\n#include <colorspace_pars_fragment>\nvoid main(){vec4 b=texture2D(image,v);vec3 g=vec3(0.);for(float x=-1.;x<=1.;x+=1.){for(float y=-1.;y<=1.;y+=1.){vec3 s=texture2D(image,v+vec2(x,y)*texel*3.).rgb;g+=max(s-vec3(.68),vec3(0.));}}gl_FragColor=vec4(b.rgb+g*.09,b.a);\n#include <colorspace_fragment>\n}',depthTest:false,depthWrite:false,toneMapped:false});focusBloomMesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2),focusBloomMaterial);focusBloomScene.add(focusBloomMesh);resizeFocusBloom();}
function renderFocusedScene(){renderer.render(scene,camera);}
function enterFocusedScene(index){
 if(focusedSceneActive||!islands[index])return;
 const a=landmarkAnimations[index],focusGroup=a.focusDetail.group;
 focusedSceneSnapshot={visibility:[],background:scene.background,fog:scene.fog,resolutionScale,shadowEnabled:renderer.shadowMap.enabled,shadowType:renderer.shadowMap.type};
 const keep=new Set([scene]);
 for(let o=focusGroup;o;o=o.parent)keep.add(o);
 focusGroup.traverse(o=>keep.add(o));
 scene.traverse(o=>{focusedSceneSnapshot.visibility.push([o,o.visible]);o.visible=keep.has(o);});
 scene.background=null;scene.fog=null;focusGroup.visible=true;
 focusedSceneActive=true;focusPauseStarted=performance.now();lastStoryBeat=-1;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;resolutionScale=maxResolutionScale;renderer.setPixelRatio(resolutionScale);renderer.setSize(stage.clientWidth,stage.clientHeight,false);stage.classList.add('landmark-focus');focusStoryCue.textContent='01 · '+focusBeatData[index][0];focusStoryCue.classList.add('on');focusStoryCue.setAttribute('aria-hidden','false');showFocusGraph(index);focusPuzzle.classList.remove('on');focusPuzzle.setAttribute('aria-hidden','true');performanceFrames=0;performanceWindowStart=performance.now();
}
function disposeFocusDetails(item){
 const group=item?.focusDetail?.group;if(!group)return;
 const geometries=new Set(),materials=new Set(),textures=new Set();
 group.traverse(o=>{
  if(o.geometry)geometries.add(o.geometry);
  for(const material of (Array.isArray(o.material)?o.material:o.material?[o.material]:[])){
   materials.add(material);
   for(const value of Object.values(material))if(value?.isTexture)textures.add(value);
   if(material.uniforms)for(const uniform of Object.values(material.uniforms))if(uniform?.value?.isTexture)textures.add(uniform.value);
  }
 });
 geometries.forEach(value=>value.dispose());materials.forEach(value=>value.dispose());textures.forEach(value=>value.dispose());
 group.removeFromParent();item.focusDetail=null;
}
function leaveFocusedScene(){
 if(!focusedSceneActive||!focusedSceneSnapshot)return;const s=focusedSceneSnapshot;s.visibility.forEach(q=>q[0].visible=q[1]);if(selectedIsland!==null)disposeFocusDetails(landmarkAnimations[selectedIsland]);clearFocusGraph();disposeFocusBloom();focusStoryCue.classList.remove('on');focusStoryCue.setAttribute('aria-hidden','true');focusPuzzle.classList.remove('on');focusPuzzle.setAttribute('aria-hidden','true');scene.background=s.background;scene.fog=s.fog;
 if(focusWorldPauseStarted)cycleEpoch+=performance.now()-focusWorldPauseStarted;focusWorldPauseStarted=0;if(focusOriginalRootRotation&&selectedIsland!==null)landmarkAnimations[selectedIsland].root.rotation.copy(focusOriginalRootRotation);focusOriginalRootRotation=null;focusedSceneActive=false;focusedSceneSnapshot=null;stage.classList.remove('landmark-focus');resolutionScale=s.resolutionScale;renderer.setPixelRatio(resolutionScale);renderer.setSize(stage.clientWidth,stage.clientHeight,false);renderer.shadowMap.enabled=s.shadowEnabled;renderer.shadowMap.type=s.shadowType;performanceFrames=0;performanceWindowStart=performance.now();
}

function getOrbitTarget(yaw=cameraShift.x,pitch=cameraShift.y){
  return new THREE.Vector3(
    cameraHome.x+Math.sin(yaw)*Math.cos(pitch)*cameraDistance,
    cameraHome.y+Math.sin(pitch)*cameraDistance,
    cameraHome.z-Math.cos(yaw)*Math.cos(pitch)*cameraDistance
  );
}
function beginSubjectFocus(index){
 if(focusTransition||!islands[index])return;selectedIsland=index;focusWorldPauseStarted=performance.now();
const a=landmarkAnimations[index],island=islands[index],root=a.root;if(!a.focusDetail)a.focusDetail=buildFocusDetails(root,index,a.unit,landmarkMaterials);
 focusOriginalRootRotation=root.rotation.clone();const d=camera.position.clone().sub(root.getWorldPosition(new THREE.Vector3()));root.rotation.y=Math.atan2(d.x,d.z);root.updateMatrixWorld(true);const focusGroup=a.focusDetail.group;focusGroup.visible=true;focusGroup.updateWorldMatrix(true,true);const b=new THREE.Box3().setFromObject(focusGroup);focusGroup.visible=false;if(b.isEmpty())b.setFromObject(root);const extent=b.getSize(new THREE.Vector3()),radius=Math.max(1,extent.length()*(index===5?.34:.5)),target=b.getCenter(new THREE.Vector3());target.x+=radius*.12;const dir=target.clone().sub(camera.position).normalize(),fov=42,dist=Math.max(7.5,radius/(Math.sin(THREE.MathUtils.degToRad(fov*.5))*.9)),end=target.clone().addScaledVector(dir,-dist),note=subjectInfoData[index];
 subjectInfoTitle.textContent=focusSubjectTitles[index];subjectInfoEyebrow.textContent=note.eyebrow;subjectInfoText.textContent=note.text;subjectInfo.classList.remove('on');subjectInfo.setAttribute('aria-hidden','true');selected.textContent=island.name+' · selected';selected.classList.add('on');islands.forEach((x,i)=>{x.halo.visible=i===index;x.tag.classList.toggle('active',i===index);});stage.classList.add('focus-active');focusShade.style.opacity='0';focusFlash.style.opacity='0';focusFlash.style.transform='scale(.35)';focusTransition={phase:'in',time:0,index,fromPosition:camera.position.clone(),fromTarget:viewTarget.clone(),toPosition:end,toTarget:target,fromFov:camera.fov,toFov:fov};
}

function closeSubjectFocus(){
  if(!focusTransition||focusTransition.phase!=='held')return;
  leaveFocusedScene();
  subjectInfo.classList.remove('on');
  subjectInfo.setAttribute('aria-hidden','true');
  selectedIsland=null;
  islands.forEach(item=>{item.halo.visible=false;item.tag.classList.remove('active');});
  selected.textContent='';selected.classList.remove('on');
  focusTransition={
    phase:'out',time:0,
    fromPosition:camera.position.clone(),fromTarget:viewTarget.clone(),
    toPosition:cameraHome.clone(),toTarget:getOrbitTarget(),
    fromFov:camera.fov,toFov:stage.clientWidth<700?72:66
  };
}
subjectInfoClose.addEventListener('click',closeSubjectFocus);
subjectInfo.addEventListener('click',event=>event.stopPropagation());
window.addEventListener('keydown',event=>{if(event.key==='Escape')closeSubjectFocus();});
function onPointerMove(event){
  const rect=canvas.getBoundingClientRect();
  const nx=((event.clientX-rect.left)/rect.width)*2-1;
  const ny=-(((event.clientY-rect.top)/rect.height)*2-1);
  if(event.pointerType==='mouse'||event.pointerType==='pen'){
    if(lastPointerX!==null&&selectedIsland===null){
      cameraShift.x+=(nx-lastPointerX)*.78;
      cameraShift.y=clamp(cameraShift.y+(ny-lastPointerY)*.36,-.82,.20);
    }
    lastPointerX=nx;lastPointerY=ny;
  }else if(event.pointerType==='touch'&&event.buttons&&lastTouchX!==null){
    if(selectedIsland===null)cameraShift.x-=(event.clientX-lastTouchX)*.0075;
    lastTouchX=event.clientX;
  }
  pointer.set(nx,ny);pointerInsideStage=true;
  refreshLandmarkHover();
  canvas.style.cursor=hovered===null?'grab':'pointer';
}
function refreshLandmarkHover(){
  if(selectedIsland!==null||!pointerInsideStage)hovered=null;
  else{
    raycaster.setFromCamera(pointer,camera);
    const hits=raycaster.intersectObjects(pickTargets,false);
    hovered=hits.length?hits[0].object.userData.index:null;
  }
  islands.forEach((item,index)=>{
    const selectedHere=index===selectedIsland;

    item.tag.classList.toggle('hovered',index===hovered);

    item.halo.visible=selectedHere;
  });
  updateIslandTags();
}
const labelWorld=new THREE.Vector3(),labelBounds=new THREE.Box3();
function updateIslandTags(){
  const width=stage.clientWidth,height=stage.clientHeight;
  for(const item of islands){
    const labelActive=item.tag.classList.contains('hovered');
    if(!labelActive){item.tag.style.display='none';item.tag.style.opacity='0';continue;}
    item.landmark.updateMatrixWorld(true);labelBounds.setFromObject(item.landmark);
    labelBounds.getCenter(labelWorld);labelWorld.y=labelBounds.max.y+.55;
    const p=labelWorld.project(camera),x=(p.x*.5+.5)*width,y=(-p.y*.5+.5)*height;
    item.tag.style.display='block';
    item.tag.style.visibility='visible';
    item.tag.style.opacity='1';
    item.tag.style.left=Math.max(8,Math.min(width-8,x))+'px';
    item.tag.style.top=Math.max(8,Math.min(height-8,y))+'px';
  }
}
canvas.addEventListener('pointermove',onPointerMove);
canvas.addEventListener('pointerdown',event=>{if(event.pointerType==='touch')lastTouchX=event.clientX;});
canvas.addEventListener('pointerup',()=>{lastTouchX=null;});
canvas.addEventListener('pointercancel',()=>{lastTouchX=null;});
canvas.addEventListener('wheel',event=>{if(selectedIsland===null)cameraShift.x+=event.deltaY*.0024;event.preventDefault();},{passive:false});
stage.addEventListener('pointerleave',()=>{lastPointerX=null;lastPointerY=null;pointerInsideStage=false;refreshLandmarkHover();canvas.style.cursor='grab';});
canvas.addEventListener('click',(event)=>{
  if(focusTransition&&focusTransition.phase!=='held')return;
  const rect=canvas.getBoundingClientRect();pointer.set(((event.clientX-rect.left)/rect.width)*2-1,-(((event.clientY-rect.top)/rect.height)*2-1));raycaster.setFromCamera(pointer,camera);
  const hits=raycaster.intersectObjects(pickTargets,false),clicked=hits.length?hits[0].object.userData.index:null;
  if(focusTransition?.phase==='held'){
    if(clicked===null||clicked===selectedIsland)closeSubjectFocus();
    return;
  }
  if(clicked!==null)beginSubjectFocus(clicked);
});

new ResizeObserver(()=>{
  const w=stage.clientWidth,h=stage.clientHeight;
  renderer.setSize(w,h,false);if(focusedSceneActive)resizeFocusBloom();camera.aspect=w/h;if(!focusTransition)camera.fov=w<700?72:66;camera.updateProjectionMatrix();
}).observe(stage);
let lastEnvironmentUpdate=0,lastShadowUpdate=0,lastTreeLodUpdate=0;
const treeLodForward=new THREE.Vector3(),treeLodDirection=new THREE.Vector3();
function updateIslandTreeLod(){
  camera.getWorldDirection(treeLodForward);
  for(let i=0;i<islands.length;i++){
    const lod=islands[i].group.userData.islandTreeLod;if(!lod)continue;
    islands[i].group.getWorldPosition(treeLodDirection);treeLodDirection.sub(camera.position).normalize();
    const detail=selectedIsland===i||treeLodDirection.dot(treeLodForward)>.52;
    lod.hero.visible=detail;lod.firstLow.visible=!detail;
  }
}
function scheduleFrame(){
  if(!frameRequest&&visible&&active)frameRequest=requestAnimationFrame(animate);
}
new IntersectionObserver(entries=>{
  visible=entries[0].isIntersecting;
  if(visible)scheduleFrame();
  else if(frameRequest){cancelAnimationFrame(frameRequest);frameRequest=0;}
}).observe(stage);
document.addEventListener('visibilitychange',()=>{
  active=!document.hidden;
  if(active)scheduleFrame();
  else if(frameRequest){cancelAnimationFrame(frameRequest);frameRequest=0;}
});

const landmarkFacingPosition=new THREE.Vector3();
function animate(now){
  frameRequest=0;
  if(!visible||!active)return;
  if(now-last<maxFrameInterval-1){scheduleFrame();return;}
  const dt=Math.min((now-last)/1000,.1);last=now;elapsed=(now-cycleEpoch)/1000;
  if(!visible||!active)return;
  if(focusTransition){
    focusTransition.time+=dt;
    if(focusTransition.phase==='in'){
      const move=clamp(focusTransition.time/1.55,0,1),ease=move*move*(3-2*move);
      camera.position.lerpVectors(focusTransition.fromPosition,focusTransition.toPosition,ease);
      viewTarget.lerpVectors(focusTransition.fromTarget,focusTransition.toTarget,ease);
      camera.fov=THREE.MathUtils.lerp(focusTransition.fromFov,focusTransition.toFov,ease);camera.updateProjectionMatrix();
      focusShade.style.opacity=(.34*clamp(focusTransition.time/1.15,0,1)).toFixed(3);
      const flash=clamp((focusTransition.time-1.12)/.64,0,1);
      const flashOpacity=flash<.5?flash*1.7:(1-flash)*.9;
      focusFlash.style.opacity=flashOpacity.toFixed(3);
      focusFlash.style.transform='scale('+(0.35+1.55*flash).toFixed(2)+')';
      if(focusTransition.time>=2){
        focusTransition.phase='held';focusTransition.time=0;
        enterFocusedScene(focusTransition.index);
        focusShade.style.opacity='.34';focusFlash.style.opacity='.16';
        subjectInfo.setAttribute('aria-hidden','false');subjectInfo.classList.add('on');
      }
    }else if(focusTransition.phase==='held'){
      camera.position.copy(focusTransition.toPosition);viewTarget.copy(focusTransition.toTarget);
    }else{
      const move=clamp(focusTransition.time/1.05,0,1),ease=move*move*(3-2*move);
      camera.position.lerpVectors(focusTransition.fromPosition,focusTransition.toPosition,ease);
      viewTarget.lerpVectors(focusTransition.fromTarget,focusTransition.toTarget,ease);
      camera.fov=THREE.MathUtils.lerp(focusTransition.fromFov,focusTransition.toFov,ease);camera.updateProjectionMatrix();
      focusShade.style.opacity=(.34*(1-ease)).toFixed(3);
      focusFlash.style.opacity=(.16*(1-ease)).toFixed(3);
      if(move>=1){
        camera.position.copy(cameraHome);viewTarget.copy(focusTransition.toTarget);
        camera.fov=focusTransition.toFov;camera.updateProjectionMatrix();
        focusShade.style.opacity='0';focusFlash.style.opacity='0';
        stage.classList.remove('focus-active');focusTransition=null;
      }
    }
  }else{
    if(selectedIsland===null&&!reducedMotion)cameraShift.x+=autoCameraSpeed*dt;
    camera.position.copy(cameraHome);viewTarget.copy(getOrbitTarget());
  }
  camera.lookAt(viewTarget);
  for(const item of landmarkAnimations){
    if(item.cameraFacing){
      item.root.getWorldPosition(landmarkFacingPosition);
      item.cameraFacing.rotation.y=Math.atan2(camera.position.x-landmarkFacingPosition.x,camera.position.z-landmarkFacingPosition.z);
    }
  }
  refreshLandmarkHover();
  if(selectedIsland===null&&!focusedSceneActive&&now-lastEnvironmentUpdate>=1000/15){
    skyMaterial.uniforms.uTime.value=reducedMotion?0:elapsed;
    updateDayNight(elapsed);
    windTimeUniform.value=reducedMotion?0:elapsed;
    if(!reducedMotion){
      for(const island of islands){
        island.group.position.y=island.y+Math.sin(elapsed*.42+island.phase)*.14;
      }
      updateIslandModelMatrices();
      updateIslandTreeMatrices(elapsed);

    }
    lastEnvironmentUpdate=now;
  }
  if(!reducedMotion){
    const animationSet=focusedSceneActive?[landmarkAnimations[selectedIsland]]:(selectedIsland===null?landmarkAnimations:[]);
    for(const item of animationSet){
      const focused=selectedIsland===item.index&&focusTransition;
      item.root.scale.setScalar(THREE.MathUtils.lerp(item.root.scale.x,item.baseScale*(focused?1.32:1),1-Math.exp(-7*dt)));
      item.root.position.y=.58+Math.sin(elapsed*.85+item.phase)*.025;
      if(item.spin&&item.spin!==item.cameraFacing)item.spin.rotation.y=elapsed*item.spinSpeed+item.phase;
      if(item.rotatingDisc)item.rotatingDisc.rotateZ(dt*.22);
      if(item.pulse&&item.pulseBase)item.pulse.scale.copy(item.pulseBase).multiplyScalar(1+item.pulseAmplitude*Math.sin(elapsed*2.3+item.phase));
      if(item.sway)item.sway.rotation.z=Math.sin(elapsed*.72+item.phase)*.035;
      if(item.solarOrbits)for(const orbit of item.solarOrbits){
        const angle=elapsed*orbit.speed+orbit.phase;
        orbit.mesh.position.set(Math.cos(angle)*orbit.radius,item.solarCenterY+Math.sin(angle)*orbit.radius*orbit.ellipse,orbit.z);
        orbit.mesh.rotation.z=elapsed*.24+orbit.phase;
      }
      if(focusedSceneActive){
        animateFocusStory(item,elapsed);updateFocusDetails(item,(now-focusPauseStarted)/1000);
        const beat=Math.min(2,Math.floor(Math.min(14.99,(now-focusPauseStarted)/1000)/5));
        if(beat!==lastStoryBeat){lastStoryBeat=beat;focusStoryCue.textContent='0'+(beat+1)+' · '+focusBeatData[selectedIsland][beat];}
      }
      if(item.movingLight){
        const angle=elapsed*.75+item.phase,t=(elapsed*.38+item.phase/(Math.PI*2))%1;
        if(item.motionType==='lorenz'&&item.motionCurve){
          item.movingLight.position.copy(item.motionCurve.getPointAt((elapsed*.045+item.phase/(Math.PI*2))%1));
        }else if(item.motionType==='memoryflow'&&item.motionCurve){
          item.movingLight.position.copy(item.motionCurve.getPointAt((elapsed*.17+item.phase/(Math.PI*2))%1));
        }else if(item.motionType==='trefoil'){
          const t=angle,r=2.15+.72*Math.cos(3*t);
          item.movingLight.position.set(r*Math.cos(2*t)*item.unit,(2.65+1.15*Math.sin(3*t))*item.unit,r*Math.sin(2*t)*item.unit);
        }else if(item.motionType==='lens'){
          const x=-1.48+2.96*t,arcY=1.22*Math.sqrt(Math.max(0,1-(x/1.48)*(x/1.48)));
          item.movingLight.position.set(x*item.unit,(2.55+arcY+.035)*item.unit,-.08*item.unit);
        }else if(item.motionType==='spectrum'){
          if(t<.45)item.movingLight.position.set((-3.45+2.83*(t/.45))*item.unit,2.3*item.unit,.7*item.unit);
          else{const s=(t-.45)/.55;item.movingLight.position.set((.62+2.23*s)*item.unit,(2.3+.92*Math.sin(s*Math.PI*.5))*item.unit,.7*item.unit);}
        }else if(item.motionType==='orbit'){
          item.movingLight.position.set(Math.cos(angle)*item.movingLightRadius,item.movingLightY+Math.sin(angle)*item.movingLightRadius*.58,item.movingLightZ);
        }else if(item.motionType==='python'){
          const d=1+Math.sin(angle*1.3)*Math.sin(angle*1.3);
          item.movingLight.position.set(2.45*Math.cos(angle)/d*item.unit,(2.5+1.9*Math.sin(angle)*Math.cos(angle)/d)*item.unit,.78*item.unit);
        }else if(item.motionType==='terminal'){
          const row=Math.floor(t*6),x=-1.35+2.7*((t*6)%1);
          item.movingLight.position.set(x*item.unit,(1.78+row*.39)*item.unit,.305*item.unit);
        }else if(item.motionType==='data'){
          item.movingLight.position.set((-2.25+4.5*t)*item.unit,(1.65+.68*Math.sin(t*Math.PI*2+item.phase))*item.unit,.5*item.unit);
        }else if(item.motionType==='circuit'){
          item.movingLight.position.set((-1.15+2.3*t)*item.unit,(1.7+.55*Math.sin(t*Math.PI*2))*item.unit,.58*item.unit);
        }else if(item.motionType==='market'){
          const x=.48+2.05*t,y=1.05+.28*t+1.05*t*t;
          item.movingLight.position.set(x*item.unit,y*item.unit,.56*item.unit);
        }else if(item.motionType==='geography'){
          item.movingLight.position.set((-1.25+2.5*t)*item.unit,(2.45+.22*Math.sin(t*Math.PI*2))*item.unit,(1.08+.15*Math.sin(t*Math.PI*2))*item.unit);
        }else if(item.motionType==='biology'){
          const strandT=(angle%(Math.PI*4))/(Math.PI*4);
          item.movingLight.position.set(.92*Math.sin(angle*1.2)*item.unit,(.55+4.05*strandT)*item.unit,.58*item.unit);
        }
      }
    }
  }
  if(!focusedSceneActive&&now-lastTreeLodUpdate>=200){updateIslandTreeLod();lastTreeLodUpdate=now;}
  if(!focusedSceneActive&&now-lastTagUpdate>=1000/15){updateIslandTags();lastTagUpdate=now;}
  if(!focusedSceneActive&&now-lastShadowUpdate>=900){renderer.shadowMap.needsUpdate=true;lastShadowUpdate=now;}
  renderFocusedScene();
  performanceFrames++;
  const performanceSpan=now-performanceWindowStart;
  if(performanceSpan>=500){
    const fps=Math.round(performanceFrames*1000/performanceSpan);
    adaptResolutionToFps(fps);
    if(focusedSceneActive)resizeFocusBloom();
    performanceFrames=0;performanceWindowStart=now;
  }  if(!sceneReady){sceneReady=true;document.querySelector("#sceneStatus")?.remove();}
  scheduleFrame();
}
scheduleFrame();
})().catch(error=>{
  console.error("Veyra 3D scene startup failed:",error);
  showSceneStatus("The 3D scene could not start: "+(error?.message||String(error)),true);
});
