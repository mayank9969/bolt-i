import { dial, timer, score, relief, balance } from './instrument.js';
const due=[12,9,0,2,6,0,0,14,3,0,1,5,0,0,8,2,0,0,4,0,0,6,0,1,0,0,3,0,0,2];
const days=[3,5,0,6,4,8,2,0,0,5,6,3,7,4,0,2,6,5,8,3,0,0,4,6,7,2,5,3,6,9];
dial(document.getElementById('dialHost'), due);
timer(document.getElementById('timerHost'), () => (parseInt(document.getElementById('tnum').textContent,10)||0)/30);
score(document.getElementById('scoreHost'), .70, [1,1,1,2,0,1,1,2,0,1]); // 1 right · 2 partial/retry · 0 wrong
relief(document.getElementById('reliefHost'), days);
let step=1; const texts={1:'Three boxes and five loose pencils balance twenty.',2:'Take five from both pans — still level.',3:'Split both sides into three — one box is five.'};
document.getElementById('steps').addEventListener('click',e=>{const b=e.target.closest('[data-step]');if(!b)return;step=+b.dataset.step;document.getElementById('stepText').textContent=texts[step];});
balance(document.getElementById('balanceHost'), () => step);
