const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statsEl = document.getElementById('stats');
const inventoryEl = document.getElementById('inventory');
const dialogueEl = document.getElementById('dialogue');
const combatEl = document.getElementById('combat');
const nameEntry = document.getElementById('nameEntry');
const residentName = document.getElementById('residentName');

const TILE = 48;
const MOVE_MS = 135;
const SAVE_KEY = 'elproyectodefinitivo-save-v1';

const map = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,2,2,2,1],
  [1,0,1,1,0,0,0,0,1,1,1,0,2,2,2,1],
  [1,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1],
  [1,0,1,0,0,0,1,1,0,0,1,0,0,0,0,1],
  [1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
  [1,0,0,1,1,0,1,0,0,1,1,1,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

const defaultState = () => ({
  identity: null,
  player: { x:2, y:5, hp:30, maxHp:30, level:1, xp:0, gold:0 },
  inventory: { potion:2, herb:0 },
  enemies: [
    { id:'slime-1', name:'Slime', x:10, y:7, hp:18, maxHp:18, attack:4, alive:true },
    { id:'slime-2', name:'Slime', x:13, y:4, hp:18, maxHp:18, attack:4, alive:true }
  ],
  flags: { talkedToElder:false }
});

let state = defaultState();
let combatEnemyId = null;
let messageTimer = null;
let lastTime = performance.now();

const fx = {
  playerX:2, playerY:5, moving:false,
  fromX:0, fromY:0, toX:0, toY:0, moveStart:0,
  facingX:0, facingY:1,
  attackUntil:0, playerHitUntil:0, enemyHitUntil:0, shakeUntil:0,
  particles:[], texts:[]
};

const selection = {
  active:false,
  stage:'boot',
  startedAt:0,
  choice:0,
  confirmChoice:0,
  chosen:null,
  glitchStart:0,
  finalStart:0,
  idleStart:0
};

const npcs = [{
  id:'elder', name:'Aldo', x:5, y:5, color:'#f0c674',
  lines:['Forastero, este valle está lleno de slimes.','Derrotá uno y vas a conseguir oro y experiencia.']
}];

function ease(t){ return 1-Math.pow(1-t,3); }
function clamp01(v){ return Math.max(0,Math.min(1,v)); }

function startCharacterSelection(){
  selection.active=true;
  selection.stage='boot';
  selection.startedAt=performance.now();
  selection.choice=0;
  selection.confirmChoice=0;
  selection.chosen=null;
  selection.idleStart=performance.now();
  document.body.classList.add('selecting');
  nameEntry.classList.add('hidden');
  dialogueEl.classList.add('hidden');
  combatEl.classList.add('hidden');
}

function showNameEntry(){
  const defaultName = selection.chosen===0 ? 'Nico' : 'Vera';
  residentName.value=defaultName;
  nameEntry.classList.remove('hidden');
  requestAnimationFrame(()=>{residentName.focus();residentName.select();});
}

function finishCharacterSelection(name){
  const gender=selection.chosen===0?'male':'female';
  const fallback=gender==='male'?'Nico':'Vera';
  state.identity={gender,name:(name||'').trim()||fallback};
  nameEntry.classList.add('hidden');
  selection.stage='registered';
  selection.finalStart=performance.now();
  localStorage.setItem(SAVE_KEY,JSON.stringify(state));
}

function updateSelection(now){
  if(!selection.active) return;
  if(selection.stage==='boot' && now-selection.startedAt>2500){
    selection.stage='choose';
    selection.idleStart=now;
  }
  if(selection.stage==='glitch' && now-selection.glitchStart>1100){
    selection.stage='name';
    showNameEntry();
  }
  if(selection.stage==='registered' && now-selection.finalStart>1850){
    selection.active=false;
    document.body.classList.remove('selecting');
    fx.playerX=state.player.x;
    fx.playerY=state.player.y;
  }
}

function drawText(text,x,y,size=18,color='#dce6dc',align='left'){
  ctx.save();
  ctx.fillStyle=color;
  ctx.font=`700 ${size}px ui-monospace, SFMono-Regular, Consolas, monospace`;
  ctx.textAlign=align;
  ctx.textBaseline='top';
  ctx.fillText(text,x,y);
  ctx.restore();
}

function drawBoot(now){
  ctx.fillStyle='#050607';ctx.fillRect(0,0,canvas.width,canvas.height);
  const t=now-selection.startedAt;
  if(t>420) drawText('REGISTRO DE RESIDENTE',canvas.width/2,205,20,'#d9e4d9','center');
  if(t>1350) drawText('PARCELA 14-B',canvas.width/2,242,16,'#819086','center');
  if(t>2150 && Math.floor(now/300)%2===0) drawText('_',canvas.width/2,275,18,'#b8c8b8','center');
}

function drawBed(x,y,used,visible=true,shift=0){
  if(!visible) return;
  x+=shift;
  ctx.fillStyle='#24282b';ctx.fillRect(x,y,116,154);
  ctx.fillStyle='#68706e';ctx.fillRect(x+7,y+7,102,140);
  ctx.fillStyle=used?'#9a9380':'#828986';ctx.fillRect(x+12,y+12,92,130);
  ctx.fillStyle='#c8c2ad';ctx.fillRect(x+18,y+18,80,34);
  if(used){
    ctx.strokeStyle='#655f54';ctx.lineWidth=4;
    ctx.beginPath();ctx.moveTo(x+20,y+71);ctx.lineTo(x+89,y+86);ctx.lineTo(x+27,y+113);ctx.stroke();
  }
}

function drawSelectionResident(cx,cy,gender,now,selected,step=0,glitch=0){
  const male=gender==='male';
  const idle=(now-selection.idleStart)/1000;
  const idlePulse=selected && idle>3.8 && Math.floor(idle)%7===4;
  const x=cx-28;
  const y=cy-38-step;

  ctx.save();
  if(glitch>0){
    const jitter=(Math.random()-.5)*12*glitch;
    ctx.translate(jitter,(Math.random()-.5)*5*glitch);
    ctx.globalAlpha=Math.max(.15,1-glitch*.72);
  }

  ctx.fillStyle='#111';ctx.fillRect(x+10,y+55,38,7);
  ctx.fillStyle=male?'#d9d4c8':'#696f78';ctx.fillRect(x+12,y+23,32,31);
  ctx.fillStyle='#24272d';ctx.fillRect(x+15,y+50,10,24);ctx.fillRect(x+32,y+50,10,24);
  ctx.fillStyle='#d8b79d';ctx.fillRect(x+16,y+8,25,19);

  ctx.fillStyle='#1a1b1d';
  if(male){
    ctx.fillRect(x+14,y+4,29,9);ctx.fillRect(x+12,y+8,8,9);ctx.fillRect(x+35,y+6,10,8);
  }else{
    ctx.fillRect(x+14,y+3,29,8);ctx.fillRect(x+11,y+8,9,17);ctx.fillRect(x+37,y+8,8,20);
  }

  ctx.fillStyle='#4c5552';
  ctx.fillRect(x+3,y+19,12,37);
  ctx.fillRect(x-3,y+24,8,28);
  ctx.strokeStyle='#727d78';ctx.lineWidth=3;
  ctx.beginPath();ctx.arc(x+7,y+56,12,1.3,3.4);ctx.stroke();

  const kbY = y+44-(idlePulse&&male?7:0);
  const kbX = x+(male?7:16);
  ctx.fillStyle='#b5aaa0';ctx.fillRect(kbX,kbY,42,13);
  ctx.fillStyle='#4b4744';
  for(let ky=0;ky<2;ky++)for(let kx=0;kx<7;kx++)ctx.fillRect(kbX+3+kx*5.2,kbY+3+ky*5,3,2);

  ctx.strokeStyle='#8e8a84';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(x+8,y+43);ctx.bezierCurveTo(x-8,y+51,x+5,y+67,kbX+3,kbY+8);ctx.stroke();

  if(selected && Math.floor(now/320)%2===0){
    ctx.strokeStyle='#f0f1d1';ctx.lineWidth=2;ctx.strokeRect(x-8,y-8,72,91);
    drawText('▼',cx,y-28,14,'#f0f1d1','center');
  }

  if(!male && selected && idle>3.8 && Math.floor(idle)%7===4){
    ctx.fillStyle='#0c0e0d';ctx.fillRect(x+45,y+15,94,28);
    ctx.strokeStyle='#909a92';ctx.strokeRect(x+45,y+15,94,28);
    drawText('SIN EVENTOS.',x+92,y+23,10,'#b9c5b9','center');
  }
  ctx.restore();
}

function drawGlitchSlices(now,intensity){
  if(intensity<=0) return;
  ctx.save();
  for(let i=0;i<10;i++){
    const y=Math.random()*canvas.height;
    const h=2+Math.random()*8;
    ctx.globalAlpha=.12+.25*Math.random();
    ctx.fillStyle=i%2?'#d8e5d8':'#303a34';
    ctx.fillRect((Math.random()-.5)*40,y,canvas.width,h);
  }
  ctx.restore();
}

function drawSelectionRoom(now){
  let shift=0;
  let otherVisible=true;
  let sign='SE AUTORIZA UN RESIDENTE.';
  let step=0;
  let glitch=0;

  if(selection.stage==='confirm') step=9;
  if(selection.stage==='glitch'){
    const t=clamp01((now-selection.glitchStart)/1100);
    step=10;
    glitch=t;
    if(t>.58){ otherVisible=false; shift=(t-.58)/.42*22; sign='RESIDENTE AUTORIZADO.'; }
  }
  if(selection.stage==='name'||selection.stage==='registered'){
    otherVisible=false;shift=22;step=10;sign='RESIDENTE AUTORIZADO.';
  }

  ctx.fillStyle='#171b1d';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='#3b4140';ctx.fillRect(64,46,640,372);
  ctx.fillStyle='#555b57';ctx.fillRect(76,58,616,348);

  for(let y=68;y<400;y+=32)for(let x=88;x<684;x+=32){
    ctx.fillStyle=((x+y)/32)%2?'#4d514e':'#505551';ctx.fillRect(x,y,30,30);
  }

  drawBed(116,97,true,true,0);
  drawBed(536,97,false,otherVisible,-shift);

  ctx.fillStyle='#e2dfc9';ctx.fillRect(253+shift*.2,67,262,44);
  ctx.strokeStyle='#252a27';ctx.lineWidth=3;ctx.strokeRect(253+shift*.2,67,262,44);
  drawText(sign,384+shift*.2,82,13,'#202522','center');

  ctx.fillStyle='#2b302e';ctx.fillRect(329+shift*.25,344,110,45);
  ctx.fillStyle='#1a1d1c';ctx.fillRect(346+shift*.25,352,75,20);

  const maleX=328+shift*.55;
  const femaleX=440-shift*.15;
  const choiceMale=selection.choice===0;
  const chosenMale=selection.chosen===0;
  const chosenFemale=selection.chosen===1;

  if(selection.stage==='glitch'){
    if(chosenMale){
      drawSelectionResident(maleX,278,'male',now,true,step,0);
      if(otherVisible) drawSelectionResident(femaleX,278,'female',now,false,0,glitch);
    }else{
      if(otherVisible) drawSelectionResident(maleX,278,'male',now,false,0,glitch);
      drawSelectionResident(femaleX,278,'female',now,true,step,0);
    }
  }else if(selection.stage==='name'||selection.stage==='registered'){
    if(chosenMale) drawSelectionResident(maleX,278,'male',now,false,step,0);
    else drawSelectionResident(femaleX,278,'female',now,false,step,0);
  }else{
    drawSelectionResident(maleX,278,'male',now,choiceMale,selection.stage==='confirm'&&choiceMale?step:0,0);
    drawSelectionResident(femaleX,278,'female',now,!choiceMale,selection.stage==='confirm'&&!choiceMale?step:0,0);
  }

  ctx.fillStyle='#0a0c0d';ctx.fillRect(116,372,536,84);
  ctx.strokeStyle='#aab5aa';ctx.lineWidth=2;ctx.strokeRect(116,372,536,84);

  if(selection.stage==='choose'){
    drawText('¿QUIÉN VIVE ACÁ?',384,388,20,'#e8eee8','center');
    drawText('← / →   E / ENTER',384,425,11,'#89958c','center');
  }else if(selection.stage==='confirm'){
    drawText('¿ESTE SOS VOS?',384,385,20,'#e8eee8','center');
    const yes=selection.confirmChoice===0;
    drawText(`${yes?'▶':' '} SÍ`,330,423,15,yes?'#fffbd2':'#8a928c','center');
    drawText(`${!yes?'▶':' '} NO`,438,423,15,!yes?'#fffbd2':'#8a928c','center');
  }else if(selection.stage==='glitch'){
    drawText('ACTUALIZANDO RESIDENCIA...',384,402,15,'#c5d0c5','center');
    drawGlitchSlices(now,glitch);
  }else if(selection.stage==='name'){
    drawText('RESIDENTE AUTORIZADO.',384,400,16,'#b8c5b8','center');
  }else if(selection.stage==='registered'){
    const t=now-selection.finalStart;
    if(t<850) drawText('REGISTRO ACTUALIZADO.',384,399,17,'#dce6dc','center');
    else if(t<1500) drawText('ESTE REGISTRO SIEMPRE FUE ASÍ.',384,399,15,'#dce6dc','center');
  }
}

function drawCharacterSelection(now){
  if(selection.stage==='boot') drawBoot(now);
  else drawSelectionRoom(now);
}

nameEntry.addEventListener('submit',e=>{
  e.preventDefault();
  if(selection.active&&selection.stage==='name') finishCharacterSelection(residentName.value);
});

function handleSelectionKey(key){
  if(selection.stage==='boot') return true;
  if(selection.stage==='name'||selection.stage==='registered'||selection.stage==='glitch') return true;
  if(selection.stage==='choose'){
    if(['a','arrowleft','d','arrowright'].includes(key)){
      selection.choice=selection.choice===0?1:0;
      selection.idleStart=performance.now();
    }else if(key==='e'||key==='enter'){
      selection.chosen=selection.choice;
      selection.confirmChoice=0;
      selection.stage='confirm';
    }
    return true;
  }
  if(selection.stage==='confirm'){
    if(['a','arrowleft','d','arrowright','w','arrowup','s','arrowdown'].includes(key)) selection.confirmChoice=selection.confirmChoice===0?1:0;
    else if(key==='e'||key==='enter'){
      if(selection.confirmChoice===1){
        selection.stage='choose';
        selection.chosen=null;
        selection.idleStart=performance.now();
      }else{
        selection.stage='glitch';
        selection.glitchStart=performance.now();
      }
    }
    return true;
  }
  return true;
}

function isBlocked(x,y){
  if(y<0||y>=map.length||x<0||x>=map[0].length)return true;
  if(map[y][x]!==0)return true;
  if(npcs.some(n=>n.x===x&&n.y===y))return true;
  if(state.enemies.some(e=>e.alive&&e.x===x&&e.y===y))return true;
  return false;
}

function move(dx,dy){
  if(combatEnemyId||fx.moving)return;
  hideDialogue();fx.facingX=dx;fx.facingY=dy;
  const nx=state.player.x+dx,ny=state.player.y+dy;
  if(isBlocked(nx,ny)){bump(dx,dy);return;}
  fx.fromX=state.player.x;fx.fromY=state.player.y;fx.toX=nx;fx.toY=ny;
  fx.moveStart=performance.now();fx.moving=true;state.player.x=nx;state.player.y=ny;
  spawnDust(fx.fromX+.5,fx.fromY+.8);
}
function bump(dx,dy){fx.playerX=state.player.x+dx*.08;fx.playerY=state.player.y+dy*.08;setTimeout(()=>{if(!fx.moving){fx.playerX=state.player.x;fx.playerY=state.player.y;}},70);}
function adjacentTo(a,b){return Math.abs(a.x-b.x)+Math.abs(a.y-b.y)===1;}
function interact(){
  if(combatEnemyId||fx.moving)return;
  const npc=npcs.find(n=>adjacentTo(state.player,n));
  if(npc){state.flags.talkedToElder=true;showDialogue(`<strong>${npc.name}</strong><br>${npc.lines.join('<br>')}`);pulseAt(npc.x+.5,npc.y+.35,'#fff1a8');return;}
  const enemy=state.enemies.find(e=>e.alive&&adjacentTo(state.player,e));
  if(enemy){startCombat(enemy.id);return;}
  flashMessage('No hay nada con qué interactuar acá.');
}
function startCombat(enemyId){combatEnemyId=enemyId;hideDialogue();fx.shakeUntil=performance.now()+180;updateCombatPanel('¡Apareció un enemigo!');}
function currentEnemy(){return state.enemies.find(e=>e.id===combatEnemyId);}
function playerAttack(){
  const enemy=currentEnemy();if(!enemy)return;
  const now=performance.now();fx.attackUntil=now+220;fx.enemyHitUntil=now+280;fx.shakeUntil=now+120;
  const damage=5+Math.floor(Math.random()*4)+(state.player.level-1)*2;
  enemy.hp=Math.max(0,enemy.hp-damage);floatText(enemy.x+.5,enemy.y+.2,`-${damage}`,'#ffe66d');burst(enemy.x+.5,enemy.y+.5,'#dff57a',10);
  if(enemy.hp===0){enemy.alive=false;state.player.xp+=10;state.player.gold+=6;maybeLevelUp();combatEnemyId=null;combatEl.classList.add('hidden');setTimeout(()=>flashMessage(`Derrotaste al ${enemy.name}. +10 XP, +6 oro.`),120);return;}
  setTimeout(()=>enemyTurn(`Atacaste e hiciste ${damage} de daño.`),220);
}
function enemyTurn(prefix){
  const enemy=currentEnemy();if(!enemy)return;
  const damage=Math.max(1,enemy.attack+Math.floor(Math.random()*3)-1);state.player.hp=Math.max(0,state.player.hp-damage);
  const now=performance.now();fx.playerHitUntil=now+320;fx.shakeUntil=now+180;floatText(fx.playerX+.5,fx.playerY+.1,`-${damage}`,'#ff7676');burst(fx.playerX+.5,fx.playerY+.5,'#ff6666',7);
  if(state.player.hp===0){state.player.hp=state.player.maxHp;state.player.x=2;state.player.y=5;fx.playerX=2;fx.playerY=5;fx.moving=false;combatEnemyId=null;combatEl.classList.add('hidden');flashMessage('Caíste en combate. Despertaste nuevamente en el pueblo.');return;}
  updateCombatPanel(`${prefix}<br>${enemy.name} responde por ${damage}.`);
}
function usePotion(){
  if(state.inventory.potion<=0){combatEnemyId?updateCombatPanel('No te quedan pociones.'):flashMessage('No te quedan pociones.');return;}
  if(state.player.hp>=state.player.maxHp){combatEnemyId?updateCombatPanel('Ya tenés la vida completa.'):flashMessage('Ya tenés la vida completa.');return;}
  state.inventory.potion--;const healed=Math.min(12,state.player.maxHp-state.player.hp);state.player.hp+=healed;floatText(fx.playerX+.5,fx.playerY+.15,`+${healed}`,'#72f1a5');burst(fx.playerX+.5,fx.playerY+.5,'#72f1a5',9);
  combatEnemyId?setTimeout(()=>enemyTurn(`Usaste una poción y recuperaste ${healed} HP.`),160):flashMessage(`Recuperaste ${healed} HP.`);
}
function maybeLevelUp(){const need=state.player.level*20;if(state.player.xp>=need){state.player.xp-=need;state.player.level++;state.player.maxHp+=6;state.player.hp=state.player.maxHp;floatText(fx.playerX+.5,fx.playerY-.1,'¡NIVEL!','#fff4a8');}}
function updateCombatPanel(text=''){
  const enemy=currentEnemy();if(!enemy)return;combatEl.classList.remove('hidden');
  combatEl.innerHTML=`<strong>Combate: ${enemy.name}</strong><br>Enemigo: ${enemy.hp}/${enemy.maxHp} HP${text?`<p>${text}</p>`:''}<div class="combat-actions"><button id="attackBtn">1 — Atacar</button><button id="potionBtn">2 — Poción</button></div>`;
  document.getElementById('attackBtn').onclick=playerAttack;document.getElementById('potionBtn').onclick=usePotion;
}
function showDialogue(html){dialogueEl.innerHTML=html;dialogueEl.classList.remove('hidden');dialogueEl.classList.remove('pop');void dialogueEl.offsetWidth;dialogueEl.classList.add('pop');}
function hideDialogue(){dialogueEl.classList.add('hidden');}
function flashMessage(text){showDialogue(text);clearTimeout(messageTimer);messageTimer=setTimeout(hideDialogue,2600);}
function saveGame(){localStorage.setItem(SAVE_KEY,JSON.stringify(state));flashMessage('Partida guardada en este navegador.');}
function loadGame(){
  const raw=localStorage.getItem(SAVE_KEY);
  if(raw){try{const parsed=JSON.parse(raw);state={...defaultState(),...parsed,player:{...defaultState().player,...parsed.player},inventory:{...defaultState().inventory,...parsed.inventory},flags:{...defaultState().flags,...parsed.flags}};}catch{localStorage.removeItem(SAVE_KEY);state=defaultState();}}
  fx.playerX=state.player.x;fx.playerY=state.player.y;
  if(!state.identity)startCharacterSelection();else document.body.classList.remove('selecting');
}
function resetGame(){
  localStorage.removeItem(SAVE_KEY);state=defaultState();combatEnemyId=null;fx.playerX=state.player.x;fx.playerY=state.player.y;fx.moving=false;combatEl.classList.add('hidden');hideDialogue();startCharacterSelection();
}
function spawnDust(x,y){for(let i=0;i<5;i++)fx.particles.push({x,y,vx:(Math.random()-.5)*.7,vy:-Math.random()*.35-.08,life:.35,max:.35,color:'#d5cfaa',size:3+Math.random()*3});}
function burst(x,y,color,count){for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,s=.5+Math.random()*1.6;fx.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.42,max:.42,color,size:2+Math.random()*3});}}
function pulseAt(x,y,color){fx.particles.push({x,y,vx:0,vy:0,life:.4,max:.4,color,size:5,pulse:true});}
function floatText(x,y,text,color){fx.texts.push({x,y,text,color,life:.75,max:.75});}
function updateAnimations(now,dt){
  if(fx.moving){const t=clamp01((now-fx.moveStart)/MOVE_MS),k=ease(t);fx.playerX=fx.fromX+(fx.toX-fx.fromX)*k;fx.playerY=fx.fromY+(fx.toY-fx.fromY)*k;if(t>=1){fx.playerX=fx.toX;fx.playerY=fx.toY;fx.moving=false;}}
  for(const p of fx.particles){p.life-=dt;if(!p.pulse){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=2.2*dt;}}fx.particles=fx.particles.filter(p=>p.life>0);
  for(const t of fx.texts){t.life-=dt;t.y-=.45*dt;}fx.texts=fx.texts.filter(t=>t.life>0);
}
function drawTile(x,y,type,time){
  if(type===0){ctx.fillStyle=(x+y)%2?'#5b874b':'#638f51';ctx.fillRect(x*TILE,y*TILE,TILE,TILE);ctx.fillStyle='#557c47';ctx.fillRect(x*TILE+7,y*TILE+9,3,3);ctx.fillRect(x*TILE+32,y*TILE+30,2,2);}
  else if(type===1){ctx.fillStyle='#394b3d';ctx.fillRect(x*TILE,y*TILE,TILE,TILE);ctx.fillStyle='#243229';ctx.fillRect(x*TILE+5,y*TILE+5,TILE-10,TILE-10);}
  else{ctx.fillStyle='#397ca5';ctx.fillRect(x*TILE,y*TILE,TILE,TILE);const wave=Math.sin(time*.004+x+y)*3;ctx.fillStyle='#67a7c7';ctx.fillRect(x*TILE+8+wave,y*TILE+13,23,3);}
}
function drawCharacter(x,y,color,label,time,isPlayer=false){
  const moving=isPlayer&&fx.moving,bob=moving?Math.sin((time-fx.moveStart)*.09)*2:0,px=x*TILE,py=y*TILE+bob,hit=isPlayer&&time<fx.playerHitUntil&&Math.floor(time/45)%2===0;
  ctx.save();if(hit)ctx.globalAlpha=.35;ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(px+12,py+37-bob,24,5);ctx.fillStyle=color;ctx.fillRect(px+13,py+11,22,27);ctx.fillStyle='#f2d1b3';ctx.fillRect(px+16,py+4,16,13);
  if(moving){const leg=Math.sin((time-fx.moveStart)*.09)*4;ctx.fillStyle='#202833';ctx.fillRect(px+15,py+36,6,7+leg);ctx.fillRect(px+27,py+36,6,7-leg);}
  if(isPlayer&&time<fx.attackUntil){const p=1-(fx.attackUntil-time)/220;ctx.strokeStyle='#fff3c4';ctx.lineWidth=4;ctx.beginPath();ctx.arc(px+24,py+23,23,-1.2+p*.7,.3+p*.7);ctx.stroke();}
  ctx.fillStyle='#101820';ctx.font='10px system-ui';ctx.textAlign='center';ctx.fillText(label,px+24,py+47);ctx.restore();
}
function drawEnemy(e,time){
  let px=e.x*TILE,py=e.y*TILE;const bounce=Math.sin(time*.006+e.x)*2;if(e.id===combatEnemyId&&time<fx.enemyHitUntil)px+=Math.sin(time*.12)*5;
  ctx.save();if(e.id===combatEnemyId&&time<fx.enemyHitUntil&&Math.floor(time/40)%2===0)ctx.globalAlpha=.35;ctx.fillStyle='#78d64b';ctx.beginPath();ctx.arc(px+24,py+27+bounce,15,Math.PI,Math.PI*2);ctx.lineTo(px+39,py+36+bounce);ctx.lineTo(px+9,py+36+bounce);ctx.closePath();ctx.fill();ctx.fillStyle='#15202b';ctx.fillRect(px+18,py+25+bounce,3,3);ctx.fillRect(px+28,py+25+bounce,3,3);ctx.restore();
}
function drawEffects(){
  for(const p of fx.particles){const a=clamp01(p.life/p.max);ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=p.color;ctx.fillStyle=p.color;const px=p.x*TILE,py=p.y*TILE;if(p.pulse){ctx.lineWidth=3;ctx.beginPath();ctx.arc(px,py,(1-a)*22+4,0,Math.PI*2);ctx.stroke();}else ctx.fillRect(px,py,p.size,p.size);ctx.restore();}
  for(const t of fx.texts){ctx.save();ctx.globalAlpha=clamp01(t.life/t.max);ctx.fillStyle=t.color;ctx.font='bold 16px system-ui';ctx.textAlign='center';ctx.fillText(t.text,t.x*TILE,t.y*TILE);ctx.restore();}
}
function drawHUD(){
  const id=state.identity?`${state.identity.name} · `:'';statsEl.textContent=`${id}Nv ${state.player.level} · HP ${state.player.hp}/${state.player.maxHp} · XP ${state.player.xp} · Oro ${state.player.gold}`;
  inventoryEl.innerHTML=`<li>Pociones: ${state.inventory.potion}</li><li>Hierbas: ${state.inventory.herb}</li>`;
}
function renderGame(time){
  ctx.save();if(time<fx.shakeUntil)ctx.translate((Math.random()-.5)*5,(Math.random()-.5)*5);
  for(let y=0;y<map.length;y++)for(let x=0;x<map[y].length;x++)drawTile(x,y,map[y][x],time);
  npcs.forEach(n=>drawCharacter(n.x,n.y,n.color,n.name,time));state.enemies.filter(e=>e.alive).forEach(e=>drawEnemy(e,time));
  const playerColor=state.identity?.gender==='female'?'#69758a':'#d94f4f';drawCharacter(fx.playerX,fx.playerY,playerColor,state.identity?.name||'Vos',time,true);drawEffects();ctx.restore();drawHUD();
}
function loop(time){
  const dt=Math.min(.033,(time-lastTime)/1000);lastTime=time;
  updateSelection(time);
  if(selection.active)drawCharacterSelection(time);else{updateAnimations(time,dt);renderGame(time);}
  requestAnimationFrame(loop);
}

document.addEventListener('keydown',e=>{
  const key=e.key.toLowerCase();
  if(['arrowup','arrowdown','arrowleft','arrowright',' ','enter'].includes(key))e.preventDefault();
  if(selection.active){
    if(selection.stage==='name')return;
    handleSelectionKey(key);return;
  }
  if(combatEnemyId){if(key==='1')playerAttack();if(key==='2')usePotion();return;}
  if(key==='w'||key==='arrowup')move(0,-1);else if(key==='s'||key==='arrowdown')move(0,1);else if(key==='a'||key==='arrowleft')move(-1,0);else if(key==='d'||key==='arrowright')move(1,0);else if(key==='e'||key==='enter')interact();else if(key==='2')usePotion();
});

document.getElementById('saveBtn').onclick=saveGame;
document.getElementById('resetBtn').onclick=()=>{if(confirm('¿Borrar la partida y empezar de nuevo?'))resetGame();};

loadGame();
requestAnimationFrame(loop);