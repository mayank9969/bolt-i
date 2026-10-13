// VEYRA v3 prototype — navigation + illustrative renderers (no real data)
(function () {
  const pages = ['today','setup','quiz','result','progress','history','learn','take'];
  function go(id){
    if(!pages.includes(id)) id='today';
    pages.forEach(p=>document.getElementById(p).classList.toggle('hidden',p!==id));
    document.querySelectorAll('.proto [data-go]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.go===id));
    document.querySelectorAll('#mainnav a').forEach(a=>{
      const m = a.dataset.go===id || (id==='quiz'||id==='result') && a.dataset.go==='setup';
      if(m) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
    });
    window.scrollTo(0,0);
  }
  document.addEventListener('click',e=>{
    const t=e.target.closest('[data-go]'); if(!t) return;
    e.preventDefault(); location.hash=t.dataset.go; go(t.dataset.go);
  });
  window.addEventListener('hashchange',()=>go(location.hash.slice(1)));
  go(location.hash.slice(1)||'today');

  // theme toggle (paper default / ink alternative)
  const th=document.getElementById('theme');
  th.onclick=()=>{const r=document.documentElement;const ink=r.dataset.theme!=='ink';r.dataset.theme=ink?'ink':'paper';th.textContent=ink?'Paper ◑':'Ink ◐';};

  // generic pressed-group behaviour
  document.querySelectorAll('#modes,#regions,#conf,#patterns,#opts').forEach(g=>g.addEventListener('click',e=>{
    const b=e.target.closest('button'); if(!b) return;
    g.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));
  }));
  document.querySelectorAll('.chip.dark').forEach(c=>{ if(!c.closest('#patterns')) c.addEventListener('click',()=>{
    const sib=c.parentElement.querySelectorAll('.chip.dark'); sib.forEach(x=>x.setAttribute('aria-pressed',x===c));
  });});

  // ── Almanac dial: 30 ticks, tick length = due count, today in brick
  const due=[12,9,0,2,6,0,0,14,3,0,1,5,0,0,8,2,0,0,4,0,0,6,0,1,0,0,3,0,0,2]; // illustrative
  const svg=document.getElementById('dial'); const cx=210,cy=210,R=185;
  let s='<circle class="ring" cx="210" cy="210" r="185"/><circle class="ring" cx="210" cy="210" r="128"/>';
  due.forEach((n,i)=>{
    const a=(-90+i*12)*Math.PI/180, len=10+Math.min(n,14)*3.2;
    const x1=cx+Math.cos(a)*(R-6), y1=cy+Math.sin(a)*(R-6), x2=cx+Math.cos(a)*(R-6-len), y2=cy+Math.sin(a)*(R-6-len);
    s+=`<line class="tick${i===0?' today':n?' due':''}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    if(i%5===0){const tx=cx+Math.cos(a)*(R+14),ty=cy+Math.sin(a)*(R+14)+3;s+=`<text x="${tx}" y="${ty}" text-anchor="middle">${i===0?'TODAY':'+'+i+'D'}</text>`;}
  });
  s+=`<text x="210" y="200" text-anchor="middle" class="big">12</text><text x="210" y="226" text-anchor="middle" class="mid">due today</text><text x="210" y="250" text-anchor="middle">58 in next 30 days</text>`;
  svg.innerHTML=s;

  // ── Today: retention rows
  const ret=[['Physics',58,41],['Logic',81,120],['Mathematics',77,96],['Chemistry',62,30],['Biology',88,54],['History',71,22]];
  document.getElementById('retention').innerHTML=ret.map(([n,p,c])=>`<div class="panel"><div class="row"><b>${n}</b><span class="mono">${p}% · ${c} answers</span></div><div class="bar${p<65?' low':''}"><i style="width:${p}%"></i></div></div>`).join('');

  // ── Setup: regions (the real 15 categories come from /api/categories)
  const regions=['Physics','Chemistry','Biology','Mathematics','Logic','History','Geography','Economics','Computer Science','Literature','Astronomy','Philosophy','Statistics','Art','Current Affairs'];
  document.getElementById('regions').innerHTML=regions.map((r,i)=>`<button class="region" aria-pressed="${i===0}">${r}<small>100 questions · ${i===0?'58% kept':i%3?'not yet tried':'7x% kept'}</small></button>`).join('');

  // ── Quiz: timer countdown + state switch
  let t=19; const fg=document.getElementById('tfg'), tn=document.getElementById('tnum');
  setInterval(()=>{t=t>0?t-1:30; tn.textContent=t; fg.setAttribute('stroke-dashoffset',157*(1-t/30));},1000);
  const A=document.getElementById('answering'),B=document.getElementById('aftermiss');
  const show=(miss)=>{A.classList.toggle('hidden',miss);B.classList.toggle('hidden',!miss);document.getElementById('stateA').setAttribute('aria-pressed',!miss);document.getElementById('stateB').setAttribute('aria-pressed',miss);};
  document.getElementById('stateA').onclick=()=>show(false);
  document.getElementById('stateB').onclick=()=>show(true);
  document.getElementById('submit').onclick=()=>show(true);

  // ── Progress
  const days=[3,5,0,6,4,8,2,0,0,5,6,3,7,4,0,2,6,5,8,3,0,0,4,6,7,2,5,3,6,9];
  document.getElementById('strip').innerHTML=days.map((d,i)=>`<i class="${d?'' :'z'}${i===29?' t':''}" style="height:${d?8+d*6:6}px"></i>`).join('');
  const bar=(n,p,c,low)=>`<div style="margin-bottom:12px"><div class="row" style="font-size:14px"><b>${n}</b><span class="mono">${p}%${c!==undefined?' · '+c:''}</span></div><div class="bar${low||p<65?' low':''}"><i style="width:${p}%"></i></div></div>`;
  document.getElementById('byregion').innerHTML=[['Biology',88,54],['Logic',81,120],['Mathematics',77,96],['History',71,22],['Chemistry',62,30],['Physics',58,41]].map(a=>bar(...a)).join('');
  document.getElementById('byskill').innerHTML=[['Kinematics',41,17],['Stoichiometry',50,12],['Probability',63,19],['Proof by induction',70,10],['Cell biology',91,23]].map(a=>bar(...a)).join('');
  document.getElementById('byconf').innerHTML=[['Sure',89,'186 answers'],['Somewhat',66,'94 answers'],['Guess',31,'40 answers']].map(a=>bar(...a)).join('');
  document.getElementById('bymistake').innerHTML=[['Concept not clear',38,'',true],['Working slip',27,'',true],['Misread',15,'',true],['Guessed',12,'',true],['Answer format',8,'',true]].map(a=>bar(...a)).join('');

  // ── History
  const hist=[['42','13 Oct','standard','Physics · medium','10','70%'],['41','13 Oct','daily_challenge','Daily five','5','80%'],['40','12 Oct','smart_review','Review · 9 due','9','78%'],['39','12 Oct','daily_challenge','Daily five','5','100%'],['38','11 Oct','missed_review','Missed · mixed','15','60%'],['37','11 Oct','focus_skill','Kinematics','8','50%'],['36','10 Oct','standard','Logic · hard','20','65%']];
  document.getElementById('histlist').innerHTML=hist.map(([n,d,m,t,q,p])=>`<div class="review-item${parseInt(p)<65?' wrong':''}"><span class="mono">${n}</span><div><b>${t}</b><div class="t2" style="font-size:13px;margin-top:3px"><span class="mono" style="text-transform:none">${d} · ${m}</span> · ${q} questions</div></div><div style="text-align:right"><b style="font:700 22px var(--fd)">${p}</b><div><a class="link" style="font-size:12px" data-go="result">review →</a></div></div></div>`).join('');
})();
