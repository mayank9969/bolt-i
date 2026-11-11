// @ts-nocheck
/* ==== VEYRA FLOWER SCRIPT ==== */
function initVeyraFlower(root){
  var NS='http://www.w3.org/2000/svg', CX=300, CY=340, SQ=.92;
  var reduce=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var LY={};
  ['leaves','stem','petals','inner','stamens','heart','motes'].forEach(function(n){LY[n]=root.querySelector('[data-vf="'+n+'"]');});

  /* ---------- helpers ---------- */
  var rad=function(d){return d*Math.PI/180;};
  var f1=function(n){return Math.round(n*100)/100;};
  var clamp=function(x,a,b){return Math.min(b,Math.max(a,x));};
  var sm=function(a,b,x){x=clamp((x-a)/(b-a),0,1);return x*x*(3-2*x);};
  var toPath=function(p){return 'M'+p.map(function(q){return f1(q[0])+' '+f1(q[1]);}).join('L');};
  var toMulti=function(L){return L.map(toPath).join('');};
  function mk(parent,tag,attrs){
    var n=document.createElementNS(NS,tag);
    for(var k in attrs)n.setAttribute(k,attrs[k]);
    parent.appendChild(n);return n;
  }
  function timing(n,d,t){n.style.setProperty('--d',d.toFixed(2)+'s');if(t!=null)n.style.setProperty('--t',t.toFixed(2)+'s');return n;}
  function wire(parent,pts,cls,d,t){return timing(mk(parent,'path',{d:toPath(pts),pathLength:1,'class':'draw '+cls}),d,t);}
  function wireM(parent,lines,cls,d,t){return timing(mk(parent,'path',{d:toMulti(lines),pathLength:1,'class':'draw '+cls}),d,t);}
  var maxEnd=0,lastEl=null;
  function pulse(parent,pts,d,t,rd,glow){
    var n=mk(parent,'path',{d:toPath(pts),pathLength:1,'class':'pulse'+(glow?' glowline':'')});
    timing(n,d,t);n.style.setProperty('--rd',rd.toFixed(2)+'s');
    if(d+t>maxEnd){maxEnd=d+t;lastEl=n;}
    return n;
  }
  function dot(parent,p,r,d,cls,ring){
    var n=mk(parent,'circle',{cx:f1(p[0]),cy:f1(p[1]),r:r,'class':'dot'+(cls?' '+cls:'')});
    timing(n,d);
    if(ring){
      var q=mk(parent,'circle',{cx:f1(p[0]),cy:f1(p[1]),r:ring,'class':'headring fade'});
      timing(q,d+.12,1.2);
    }
    return n;
  }
  function spline(pts,per){ /* Catmull-Rom */
    var out=[],n=pts.length;
    for(var i=0;i<n-1;i++){
      var p0=pts[Math.max(i-1,0)],p1=pts[i],p2=pts[i+1],p3=pts[Math.min(i+2,n-1)];
      for(var k=0;k<per;k++){
        var t=k/per,t2=t*t,t3=t2*t,q=[];
        for(var j=0;j<2;j++)q.push(.5*((2*p1[j])+(-p0[j]+p2[j])*t+(2*p0[j]-5*p1[j]+4*p2[j]-p3[j])*t2+(-p0[j]+3*p1[j]-3*p2[j]+p3[j])*t3));
        out.push(q);
      }
    }
    out.push(pts[n-1]);return out;
  }
  function offsetLine(c,wfn,side){
    return c.map(function(p,i){
      var a=c[Math.max(i-1,0)],b=c[Math.min(i+1,c.length-1)];
      var tx=b[0]-a[0],ty=b[1]-a[1],l=Math.hypot(tx,ty)||1;tx/=l;ty/=l;
      var w=wfn(i/(c.length-1))*side;
      return [p[0]-ty*w,p[1]+tx*w];
    });
  }
  function filament(x,y,phi,len,curl,steps){
    var pts=[[x,y]],st=len/steps;
    for(var i=0;i<steps;i++){x+=st*Math.cos(phi);y+=st*Math.sin(phi);phi+=curl/steps;pts.push([x,y]);}
    return pts;
  }

  /* ---------- timeline (seconds) ---------- */
  var T={stem:.9,stemDur:2.2,stamen:1.3,petal:2.7,step:.5,petalDur:1.5,
         inner:5.0,istep:.25,pulseStem:6.7,pulseVein:7.7,motes:9.2};

  /* ---------- stem: glassy tube with cross-section rungs ---------- */
  var sc=spline([[300,342],[297,430],[304,520],[293,615],[295,705],[302,790]],20);
  var stemW=function(s){return 2.6+4.4*Math.pow(s,1.1);};
  var stemAt=function(s){return sc[Math.round(s*(sc.length-1))];};
  var e1=offsetLine(sc,stemW,1),e2=offsetLine(sc,stemW,-1);
  timing(mk(LY.stem,'path',{d:toPath(e1.concat(e2.slice().reverse()))+'Z','class':'stem-fill fade'}),T.stem+.8,2.2);
  var rungs=[];
  for(var ri=3;ri<sc.length-2;ri+=2){var ra=e1[ri],rb=e2[ri];rungs.push([ra,[(ra[0]+rb[0])/2,(ra[1]+rb[1])/2+2.4],rb]);}
  wireM(LY.stem,rungs,'stem-rung',T.stem+.3,T.stemDur+.4);
  wire(LY.stem,e1,'stem',T.stem,T.stemDur);
  wire(LY.stem,e2,'stem',T.stem,T.stemDur);
  wire(LY.stem,sc,'stem-mid',T.stem+.1,T.stemDur);
  var rs=sc.slice().reverse();
  pulse(LY.stem,rs,T.pulseStem,1.3,0,true);
  pulse(LY.stem,rs,T.pulseStem,1.3,0,false);

  /* ---------- leaves: lance blades with iridescent streaks ---------- */
  function leaf(sPos,ang,len,w,bs,dur){
    var d=T.stem+T.stemDur*sPos*.9+.1;
    var p0=stemAt(sPos),A=rad(ang),N=64;
    var p1=[p0[0]+len*.55*Math.cos(A+bs*.55),p0[1]+len*.55*Math.sin(A+bs*.55)];
    var p2=[p0[0]+len*Math.cos(A),p0[1]+len*Math.sin(A)];
    var B=function(t){var u=1-t;return [u*u*p0[0]+2*u*t*p1[0]+t*t*p2[0],u*u*p0[1]+2*u*t*p1[1]+t*t*p2[1]];};
    var nrm=function(t){
      var tx=2*(1-t)*(p1[0]-p0[0])+2*t*(p2[0]-p1[0]),ty=2*(1-t)*(p1[1]-p0[1])+2*t*(p2[1]-p1[1]);
      var l=Math.hypot(tx,ty)||1;return [-ty/l,tx/l,tx/l,ty/l];
    };
    var hw=function(t){return w*Math.pow(Math.max(0,Math.sin(Math.PI*Math.pow(t,.75))),.9)*(1+.07*Math.sin(t*10+sPos*9));};
    var edge=function(side){
      var o=[];
      for(var k=0;k<=N;k++){var t=k/N,b=B(t),n=nrm(t),h=hw(t)*side;o.push([b[0]+n[0]*h,b[1]+n[1]*h]);}
      return o;
    };
    var loop=edge(1).concat(edge(-1).reverse().slice(1));
    timing(mk(LY.leaves,'path',{d:toPath(loop)+'Z','class':'leaf-fill fade'}),d+.5,1.6);
    var streak=function(off,a,b){
      var o=[];for(var k=0;k<=20;k++){var t=a+(b-a)*k/20,bb=B(t),n=nrm(t),h=hw(t)*off;o.push([bb[0]+n[0]*h,bb[1]+n[1]*h]);}
      return o;
    };
    wire(LY.leaves,streak(.3,.2,.72),'band lf1',d+.45,dur);
    wire(LY.leaves,streak(-.4,.3,.8),'band lf2',d+.55,dur);
    wire(LY.leaves,streak(.05,.4,.66),'band lf3',d+.65,dur);
    wire(LY.leaves,loop,'leaf-out',d,dur);
    var mid=[];for(var k=0;k<=24;k++)mid.push(B(k/24*.96));
    wire(LY.leaves,mid,'leaf-vein',d+.2,dur);
    var ribs=[];
    for(var j=1;j<=8;j++){
      var t=.1+.1*j;
      [1,-1].forEach(function(side){
        var b=B(t),t2=Math.min(t+.12,.98),e=B(t2),n=nrm(t2),h=hw(t2)*.88*side;
        var end=[e[0]+n[0]*h,e[1]+n[1]*h];
        ribs.push(spline([b,[(b[0]+end[0])/2+n[2]*3,(b[1]+end[1])/2+n[3]*3],end],6));
      });
    }
    wireM(LY.leaves,ribs,'leaf-vein',d+.4,dur*.9);
    pulse(LY.leaves,mid,T.pulseStem+(1-sPos)*1.1+.2,1.1,0,false);
  }
  leaf(.50,-165,235,36, 1,1.9);
  leaf(.64,-20, 190,28,-1,1.7);

  /* ---------- tendrils ---------- */
  [[.30,-160,90,1.9],[.72,-25,85,-1.8],[.86,-150,68,1.5]].forEach(function(c){
    var p=stemAt(c[0]),d=T.stem+T.stemDur*c[0]*.9+.3;
    var pts=filament(p[0],p[1],rad(c[1]),c[2],c[3],26);
    wire(LY.leaves,pts,'filament',d,1.4);
    dot(LY.leaves,pts[pts.length-1],2,d+1.2,'warm');
  });

  /* ---------- filaments from the point of light ---------- */
  for(var i=0;i<13;i++){
    var f=(i-6)/6;
    var th=rad(-90+f*66+(i%2?3:-3));
    var len=78+46*Math.abs(Math.sin(i*12.9898+1));
    var pts=filament(CX,CY,th,len,-f*.85+.25*Math.sin(i*3.1),22);
    var d=T.stamen+i*.08;
    wire(LY.stamens,pts,'stamen',d,1.3);
    dot(LY.stamens,pts[pts.length-1],2.3,d+1.15,i%4===0?'warm':(i%4===2?'rose':''),4.6);
    pulse(LY.stamens,pts,T.pulseVein+.1+Math.abs(f)*.2,1.1,0,false);
  }
  [[25,52,.9],[55,44,-.5],[125,46,.5],[155,54,-.9]].forEach(function(c,i){
    var pts=filament(CX,CY,rad(c[0]),c[1],c[2],14),d=T.stamen+.6+i*.12;
    wire(LY.stamens,pts,'stamen',d,1.1);
    dot(LY.stamens,pts[pts.length-1],1.8,d+.95,i%2?'rose':'warm');
  });
  /* pistil: a taller twin-line filament with a three-lobed head */
  var pis=filament(CX,CY,rad(-90),122,.3,24);
  wire(LY.stamens,offsetLine(pis,function(){return 1.5;},1),'stamen',T.stamen+.2,1.6);
  wire(LY.stamens,offsetLine(pis,function(){return 1.5;},-1),'stamen',T.stamen+.2,1.6);
  var ph=pis[pis.length-1];
  dot(LY.stamens,ph,3.4,T.stamen+1.7,'warm',6.5);
  dot(LY.stamens,[ph[0]-4.5,ph[1]+4],1.5,T.stamen+1.85);
  dot(LY.stamens,[ph[0]+4.5,ph[1]+4],1.5,T.stamen+1.9);

  /* ---------- heart: rings and a bead collar ---------- */
  var rings=LY.heart.querySelector('[data-vf-rings]');
  [9,17].forEach(function(r,i){
    var pts=[];for(var k=0;k<=40;k++){var a=k/40*Math.PI*2;pts.push([CX+Math.cos(a)*r,CY+Math.sin(a)*r*.82]);}
    wire(rings,pts,'ring',T.petal+.2+i*.3,1.6);
  });
  for(var b=0;b<12;b++){
    var ba=b/12*Math.PI*2;
    dot(rings,[CX+Math.cos(ba)*27,CY+Math.sin(ba)*27*.82],.9,T.petal+.5+b*.05);
  }

  /* ---------- petals ---------- */
  var prof=function(t){
    return t<.62?Math.pow(Math.sin(Math.PI/2*t/.62),.85)
                :Math.sqrt(Math.max(0,1-Math.pow((t-.62)/.38,2.2)));
  };
  function P(s,t,u,sl,sw,ph){
    var Ln=s.len*sl,ramp=sm(.3,1,t),au=Math.abs(u);
    var hw=s.w*sw*prof(t)*(1+.08*ramp*Math.sin(t*13+ph+s.p)+.05*ramp*au*au*au*Math.sin(t*31+ph+s.p*2));
    var slope=2*s.bend*t/100,nl=Math.hypot(1,slope);
    var x0=(s.b0||14)+Ln*t,y0=s.bend*t*t*Ln/100+s.ruf*ramp*Math.sin(t*10+ph+s.p*1.7);
    var x=x0-u*hw*slope/nl,y=y0+u*hw/nl;
    var a=rad(s.a),c=Math.cos(a),si=Math.sin(a);
    return [CX+x*c-y*si,CY+(x*si+y*c)*SQ];
  }
  var edgePts=function(s,u,sl,sw,ph,N){var o=[];N=N||96;for(var k=0;k<=N;k++)o.push(P(s,k/N,u,sl,sw,ph));return o;};
  var loopPts=function(s,sl,sw,ph){return edgePts(s,1,sl,sw,ph).concat(edgePts(s,-1,sl,sw,ph).reverse().slice(1));};
  var petalEls=[];

  function buildPetal(s,parent,base,inner){
    var g=mk(parent,'g',{'class':'petal'});
    g.style.setProperty('--c1','var(--vf-tint-'+s.c[0]+')');
    g.style.setProperty('--c2','var(--vf-tint-'+s.c[1]+')');
    g.style.setProperty('--c3','var(--vf-tint-'+s.c[2]+')');
    g.style.setProperty('--ur',(Math.cos(rad(s.a))>0?-1:1)*(inner?14:9)+'deg');
    if(inner)g.style.setProperty('--us','.3');
    timing(g,base,inner?T.petalDur-.1:T.petalDur+.1);

    var outline=loopPts(s,1,1,0);
    mk(g,'path',{d:toPath(outline)+'Z','class':'petal-glow'});
    var fill=mk(g,'path',{d:toPath(outline)+'Z','class':'petal-fill fade'});
    fill.style.fill='url(#vf-p'+s.g+')';
    timing(fill,base+.3,1.5);
    wire(g,outline,'rimglow',base+.1,T.petalDur);

    /* iridescent light bands: dispersed in three colours across the petal */
    var cc=function(dt,u0,u1){
      var o=[];
      for(var j=0;j<=28;j++){var u=u0+(u1-u0)*j/28;o.push(P(s,clamp(s.bt+dt+.07*(1-u*u)+s.sk*u,.12,.95),u,1,1,0));}
      return o;
    };
    var bandPath=cc(0,-.8,.66);
    if(!inner){
      wire(g,cc(-.055,-.78,.62),'band bc',base+.5,1.3);
      wire(g,bandPath,'band ba',base+.55,1.3);
      wire(g,cc(.055,-.7,.55),'band bb',base+.6,1.3);
      wire(g,cc(0,-.7,.5),'glint',base+.65,1.2);
      var ls=[];for(var j=0;j<=16;j++){var t=.2+.62*j/16;ls.push(P(s,t,s.lu*(1+.05*Math.sin(t*9+s.p)),1,1,0));}
      wire(g,ls,'band lng',base+.7,1.3);
    }else{
      wire(g,cc(0,-.6,.6),'band ba',base+.4,1.1);
    }

    /* main veins (+ their pulses) */
    var us=inner?[-.6,0,.6]:[-.82,-.55,-.28,0,.28,.55,.82];
    us.forEach(function(u,k){
      var tEnd=.93-.2*Math.pow(Math.abs(u),2),pts=[];
      for(var j=0;j<=16;j++){var t=.03+(tEnd-.03)*j/16;pts.push(P(s,t,u*(1+.04*Math.sin(t*8+k)),1,1,0));}
      wire(g,pts,'vein',base+.35+Math.abs(u)*.15,1.1);
      var dly=(inner?.4:0)+Math.abs(u)*.2;
      if(u===0){
        pulse(g,pts,T.pulseVein+(inner?.5:0)+(s.i||0)*.14,1.5,0,true);
        pulse(g,pts,T.pulseVein+(inner?.5:0)+(s.i||0)*.14,1.5,0,false);
      }else if(!inner){
        pulse(g,pts,T.pulseVein+(s.i||0)*.14+dly,1.5,Math.abs(u)*.22,false);
      }
    });
    if(!inner)pulse(g,bandPath,T.pulseVein+.9+(s.i||0)*.14,1.4,.35,true);

    /* layered outlines: the glassy rim */
    if(!inner){
      var es={a:s.a+8,len:s.len*1.05,w:s.w*.86,bend:s.bend*1.2,ruf:s.ruf*1.9,p:s.p+1.3,b0:s.b0};
      wire(g,loopPts(es,1,1,2.4),'echo',base+.2,T.petalDur+.2);
      wire(g,loopPts(s,.64,.4,1.8),'inner i2',base+.45,1.1);
    }
    wire(g,loopPts(s,inner?.8:.84,inner?.62:.7,.9),'inner',base+.3,1.2);
    wire(g,edgePts(s,1,1,1,0),'outline',base,T.petalDur-.1);
    wire(g,edgePts(s,-1,1,1,0),'outline',base,T.petalDur-.1);
    return g;
  }

  var main=[
    {a:-93, len:208,w:84,bend:9,  ruf:3.4,p:.3, c:['b','a','c'],g:'B',bt:.52,sk:.07, lu:.42},
    {a:-160,len:202,w:80,bend:-15,ruf:3.8,p:1.7,c:['d','a','b'],g:'A',bt:.55,sk:-.08,lu:-.4},
    {a:-26, len:208,w:82,bend:15, ruf:3.6,p:2.9,c:['c','a','b'],g:'C',bt:.5, sk:.08, lu:.45},
    {a:142, len:178,w:76,bend:12, ruf:3.1,p:4.1,c:['a','c','d'],g:'A',bt:.56,sk:.06, lu:-.35},
    {a:40,  len:184,w:78,bend:-13,ruf:3.3,p:5.3,c:['d','a','c'],g:'B',bt:.52,sk:-.07,lu:.4}
  ];
  main.forEach(function(s,i){s.i=i;petalEls.push(buildPetal(s,LY.petals,T.petal+i*T.step,false));});

  var inn=[
    {a:-126,len:122,w:48,bend:-8,ruf:2,p:.9, c:['c','a','d'],g:'In',bt:.55,sk:.05,lu:0,b0:8},
    {a:-60, len:124,w:48,bend:8, ruf:2,p:2.2,c:['d','c','a'],g:'In',bt:.55,sk:-.05,lu:0,b0:8},
    {a:7,   len:118,w:46,bend:7, ruf:2,p:3.4,c:['c','d','a'],g:'In',bt:.55,sk:.05,lu:0,b0:8},
    {a:91,  len:92, w:40,bend:-6,ruf:1.6,p:4.6,c:['a','c','d'],g:'In',bt:.55,sk:-.05,lu:0,b0:8},
    {a:171, len:116,w:46,bend:-7,ruf:2,p:5.7,c:['d','c','a'],g:'In',bt:.55,sk:.05,lu:0,b0:8}
  ];
  inn.forEach(function(s,i){s.i=i;buildPetal(s,LY.inner,T.inner+i*T.istep,true);});

  /* ---------- seeds of possibility drifting up from the bloom ---------- */
  [[262,112,1.6,.6],[338,96,1.2,.5],[300,70,2,.7],[240,58,1,.4],[356,50,1.5,.55],
   [282,30,1,.4],[322,18,1.2,.45],[214,92,.9,.35],[392,88,.9,.35],[300,124,1,.45]].forEach(function(m,i){
    var n=mk(LY.motes,'circle',{cx:m[0],cy:m[1],r:m[2],'class':'mote'+(i%3?' m'+(i%3):'')});
    n.style.setProperty('--o',m[3]);n.style.setProperty('--d',(T.motes+i*.2).toFixed(2)+'s');
    n.style.setProperty('--tw',(9+(i*1.7)%6).toFixed(1)+'s');
  });

  /* ---------- state ---------- */
  var started=false,busy=false,nextRip=0,loopTimer=0;
  function settle(){
    root.classList.add('is-settled');
    if(loopTimer) clearTimeout(loopTimer);
    loopTimer=setTimeout(function(){
      if(root.veyraFlower) root.veyraFlower.replay();
    },5000);
  }
  function start(){if(started)return;started=true;root.classList.add('is-run');}
  function ripple(i){
    if(reduce||busy||!root.classList.contains('is-settled'))return;
    busy=true;petalEls[i].classList.add('is-rippling');
  }
  function nextRipple(){ripple(nextRip);nextRip=(nextRip+1)%petalEls.length;}
  root.addEventListener('animationend',function(e){
    if(e.target===lastEl&&e.animationName==='vf-pulse')settle();
    if(e.animationName==='vf-glow'){
      var p=e.target.closest('.petal');if(p)p.classList.remove('is-rippling');
      setTimeout(function(){busy=false;},500);
    }
  });
  petalEls.forEach(function(g,i){g.addEventListener('pointerenter',function(){ripple(i);});});
  root.addEventListener('focus',nextRipple);
  root.addEventListener('keydown',function(e){if(e.key==='Enter')nextRipple();});

  root.veyraFlower={
    ripple:ripple,
    replay:function(){
      if(reduce)return;
      if(loopTimer) clearTimeout(loopTimer);
      busy=false;
      petalEls.forEach(function(g){g.classList.remove('is-rippling');});
      root.classList.remove('is-run','is-settled');
      requestAnimationFrame(function(){
        requestAnimationFrame(function(){root.classList.add('is-run');});
      });
    }
  };

  if(reduce){root.classList.add('is-settled');return;}  /* finished flower, immediately */
  root.classList.add('is-armed');
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){
      es.forEach(function(e){
        root.classList.toggle('is-offscreen',!e.isIntersecting);
        if(e.isIntersecting)start();
      });
    },{threshold:.25}).observe(root);
  }else start();
}

/* ==== END VEYRA FLOWER SCRIPT ==== */
export function mountVeyraFlower(root){ if(root) initVeyraFlower(root); }
