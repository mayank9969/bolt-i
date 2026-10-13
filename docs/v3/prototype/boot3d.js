import { timer, score, relief, balance } from './instrument.js';
import { atlas } from './atlas.js';
const due=[12,9,0,2,6,0,0,14,3,0,1,5,0,0,8,2,0,0,4,0,0,6,0,1,0,0,3,0,0,2];
const days=[3,5,0,6,4,8,2,0,0,5,6,3,7,4,0,2,6,5,8,3,0,0,4,6,7,2,5,3,6,9];
// Folded Atlas hero — in the real build: regions = GET /api/categories, due/soon = new engine's due questions by category,
// links = regions that appear together in past attempts (history). Here: illustrative.
const regions=[
  {name:'Physics',x:-2.3,z:.9,due:3},{name:'Logic',x:-1.0,z:-.9,due:5},{name:'Mathematics',x:1.7,z:.4,due:4},
  {name:'Chemistry',x:-2.6,z:-1.2,soon:2},{name:'Biology',x:.2,z:1.4,soon:3},{name:'History',x:2.7,z:-1.3,soon:1},{name:'Statistics',x:.9,z:-.4,soon:2},
  {name:'Geography',x:-1.6,z:1.6,due:0},{name:'Economics',x:2.6,z:1.5,due:0},{name:'Computer Science',x:.4,z:-1.6,due:0},{name:'Literature',x:-.2,z:.2,due:0},
  {name:'Astronomy',x:2.1,z:-.5,due:0},{name:'Philosophy',x:-2.9,z:-.1,due:0},{name:'Art',x:1.2,z:1.7,due:0},{name:'Current Affairs',x:-.9,z:-1.8,due:0}];
const links=[['Physics','Mathematics'],['Physics','Logic'],['Logic','Mathematics'],['Logic','Statistics'],['Mathematics','Statistics'],['Physics','Chemistry'],['Biology','Chemistry'],['Mathematics','History']];
atlas(document.getElementById('atlasHost'), regions, links);
timer(document.getElementById('timerHost'), () => (parseInt(document.getElementById('tnum').textContent,10)||0)/30);
score(document.getElementById('scoreHost'), .70, [1,1,1,2,0,1,1,2,0,1]); // 1 right · 2 partial/retry · 0 wrong
relief(document.getElementById('reliefHost'), days);
let step=1; const texts={1:'Three boxes and five loose pencils balance twenty.',2:'Take five from both pans — still level.',3:'Split both sides into three — one box is five.'};
document.getElementById('steps').addEventListener('click',e=>{const b=e.target.closest('[data-step]');if(!b)return;step=+b.dataset.step;document.getElementById('stepText').textContent=texts[step];});
balance(document.getElementById('balanceHost'), () => step);
