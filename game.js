const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statsEl = document.getElementById('stats');
const inventoryEl = document.getElementById('inventory');
const dialogueEl = document.getElementById('dialogue');
const combatEl = document.getElementById('combat');

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
  player: { x: 2, y: 5, hp: 30, maxHp: 30, level: 1, xp: 0, gold: 0 },
  inventory: { potion: 2, herb: 0 },
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
  playerX: state.player.x,
  playerY: state.player.y,
  moving: false,
  fromX: 0, fromY: 0, toX: 0, toY: 0, moveStart: 0,
  facingX: 0, facingY: 1,
  attackUntil: 0,
  playerHitUntil: 0,
  enemyHitUntil: 0,
  shakeUntil: 0,
  particles: [],
  texts: []
};

const npcs = [{
  id:'elder', name:'Aldo', x:5, y:5, color:'#f0c674',
  lines:['Forastero, este valle está lleno de slimes.','Derrotá uno y vas a conseguir oro y experiencia.']
}];

function ease(t){ return 1 - Math.pow(1-t, 3); }
function clamp01(v){ return Math.max(0, Math.min(1, v)); }

function isBlocked(x,y){
  if(y < 0 || y >= map.length || x < 0 || x >= map[0].length) return true;
  if(map[y][x] !== 0) return true;
  if(npcs.some(n => n.x === x && n.y === y)) return true;
  if(state.enemies.some(e => e.alive && e.x === x && e.y === y)) return true;
  return false;
}

function move(dx,dy){
  if(combatEnemyId || fx.moving) return;
  hideDialogue();
  fx.facingX = dx; fx.facingY = dy;
  const nx = state.player.x + dx;
  const ny = state.player.y + dy;

  if(isBlocked(nx,ny)){
    bump(dx,dy);
    return;
  }

  fx.fromX = state.player.x;
  fx.fromY = state.player.y;
  fx.toX = nx;
  fx.toY = ny;
  fx.moveStart = performance.now();
  fx.moving = true;
  state.player.x = nx;
  state.player.y = ny;
  spawnDust(fx.fromX + .5, fx.fromY + .8);
}

function bump(dx,dy){
  fx.playerX = state.player.x + dx*.08;
  fx.playerY = state.player.y + dy*.08;
  setTimeout(() => {
    if(!fx.moving){ fx.playerX = state.player.x; fx.playerY = state.player.y; }
  }, 70);
}

function adjacentTo(a,b){
  return Math.abs(a.x-b.x) + Math.abs(a.y-b.y) === 1;
}

function interact(){
  if(combatEnemyId || fx.moving) return;
  const npc = npcs.find(n => adjacentTo(state.player,n));
  if(npc){
    state.flags.talkedToElder = true;
    showDialogue(`<strong>${npc.name}</strong><br>${npc.lines.join('<br>')}`);
    pulseAt(npc.x+.5,npc.y+.35,'#fff1a8');
    return;
  }
  const enemy = state.enemies.find(e => e.alive && adjacentTo(state.player,e));
  if(enemy){ startCombat(enemy.id); return; }
  flashMessage('No hay nada con qué interactuar acá.');
}

function startCombat(enemyId){
  combatEnemyId = enemyId;
  hideDialogue();
  fx.shakeUntil = performance.now()+180;
  updateCombatPanel('¡Apareció un enemigo!');
}

function currentEnemy(){ return state.enemies.find(e => e.id === combatEnemyId); }

function playerAttack(){
  const enemy = currentEnemy();
  if(!enemy) return;
  const now = performance.now();
  fx.attackUntil = now+220;
  fx.enemyHitUntil = now+280;
  fx.shakeUntil = now+120;
  const damage = 5 + Math.floor(Math.random()*4) + (state.player.level-1)*2;
  enemy.hp = Math.max(0, enemy.hp-damage);
  floatText(enemy.x+.5, enemy.y+.2, `-${damage}`, '#ffe66d');
  burst(enemy.x+.5, enemy.y+.5, '#dff57a', 10);

  if(enemy.hp === 0){
    enemy.alive = false;
    state.player.xp += 10;
    state.player.gold += 6;
    maybeLevelUp();
    combatEnemyId = null;
    combatEl.classList.add('hidden');
    setTimeout(() => flashMessage(`Derrotaste al ${enemy.name}. +10 XP, +6 oro.`), 120);
    return;
  }
  setTimeout(() => enemyTurn(`Atacaste e hiciste ${damage} de daño.`), 220);
}

function enemyTurn(prefix){
  const enemy = currentEnemy();
  if(!enemy) return;
  const damage = Math.max(1, enemy.attack + Math.floor(Math.random()*3)-1);
  state.player.hp = Math.max(0, state.player.hp-damage);
  const now = performance.now();
  fx.playerHitUntil = now+320;
  fx.shakeUntil = now+180;
  floatText(fx.playerX+.5, fx.playerY+.1, `-${damage}`, '#ff7676');
  burst(fx.playerX+.5, fx.playerY+.5, '#ff6666', 7);

  if(state.player.hp === 0){
    state.player.hp = state.player.maxHp;
    state.player.x = 2; state.player.y = 5;
    fx.playerX = 2; fx.playerY = 5; fx.moving = false;
    combatEnemyId = null;
    combatEl.classList.add('hidden');
    flashMessage('Caíste en combate. Despertaste nuevamente en el pueblo.');
    return;
  }
  updateCombatPanel(`${prefix}<br>${enemy.name} responde por ${damage}.`);
}

function usePotion(){
  if(state.inventory.potion <= 0){
    combatEnemyId ? updateCombatPanel('No te quedan pociones.') : flashMessage('No te quedan pociones.');
    return;
  }
  if(state.player.hp >= state.player.maxHp){
    combatEnemyId ? updateCombatPanel('Ya tenés la vida completa.') : flashMessage('Ya tenés la vida completa.');
    return;
  }
  state.inventory.potion--;
  const healed = Math.min(12, state.player.maxHp-state.player.hp);
  state.player.hp += healed;
  floatText(fx.playerX+.5,fx.playerY+.15,`+${healed}`,'#72f1a5');
  burst(fx.playerX+.5,fx.playerY+.5,'#72f1a5',9);
  combatEnemyId ? setTimeout(()=>enemyTurn(`Usaste una poción y recuperaste ${healed} HP.`),160) : flashMessage(`Recuperaste ${healed} HP.`);
}

function maybeLevelUp(){
  const need = state.player.level*20;
  if(state.player.xp >= need){
    state.player.xp -= need;
    state.player.level++;
    state.player.maxHp += 6;
    state.player.hp = state.player.maxHp;
    floatText(fx.playerX+.5,fx.playerY-.1,'¡NIVEL!','#fff4a8');
  }
}

function updateCombatPanel(text=''){
  const enemy = currentEnemy();
  if(!enemy) return;
  combatEl.classList.remove('hidden');
  combatEl.innerHTML = `<strong>Combate: ${enemy.name}</strong><br>Enemigo: ${enemy.hp}/${enemy.maxHp} HP${text?`<p>${text}</p>`:''}<div class="combat-actions"><button id="attackBtn">1 — Atacar</button><button id="potionBtn">2 — Poción</button></div>`;
  document.getElementById('attackBtn').onclick = playerAttack;
  document.getElementById('potionBtn').onclick = usePotion;
}

function showDialogue(html){ dialogueEl.innerHTML=html; dialogueEl.classList.remove('hidden'); dialogueEl.classList.remove('pop'); void dialogueEl.offsetWidth; dialogueEl.classList.add('pop'); }
function hideDialogue(){ dialogueEl.classList.add('hidden'); }
function flashMessage(text){ showDialogue(text); clearTimeout(messageTimer); messageTimer=setTimeout(hideDialogue,2600); }

function saveGame(){ localStorage.setItem(SAVE_KEY,JSON.stringify(state)); flashMessage('Partida guardada en este navegador.'); }
function loadGame(){
  const raw=localStorage.getItem(SAVE_KEY);
  if(raw){ try{ state=JSON.parse(raw); }catch{ localStorage.removeItem(SAVE_KEY); state=defaultState(); } }
  fx.playerX=state.player.x; fx.playerY=state.player.y;
}
function resetGame(){
  localStorage.removeItem(SAVE_KEY); state=defaultState(); combatEnemyId=null;
  fx.playerX=state.player.x; fx.playerY=state.player.y; fx.moving=false;
  combatEl.classList.add('hidden'); hideDialogue();
}

function spawnDust(x,y){
  for(let i=0;i<5;i++) fx.particles.push({x,y,vx:(Math.random()-.5)*.7,vy:-Math.random()*.35-.08,life:.35,max:.35,color:'#d5cfaa',size:3+Math.random()*3});
}
function burst(x,y,color,count){
  for(let i=0;i<count;i++){
    const a=Math.random()*Math.PI*2,s=.5+Math.random()*1.6;
    fx.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.42,max:.42,color,size:2+Math.random()*3});
  }
}
function pulseAt(x,y,color){ fx.particles.push({x,y,vx:0,vy:0,life:.4,max:.4,color,size:5,pulse:true}); }
function floatText(x,y,text,color){ fx.texts.push({x,y,text,color,life:.75,max:.75}); }

function updateAnimations(now,dt){
  if(fx.moving){
    const t=clamp01((now-fx.moveStart)/MOVE_MS);
    const k=ease(t);
    fx.playerX=fx.fromX+(fx.toX-fx.fromX)*k;
    fx.playerY=fx.fromY+(fx.toY-fx.fromY)*k;
    if(t>=1){ fx.playerX=fx.toX; fx.playerY=fx.toY; fx.moving=false; }
  }
  for(const p of fx.particles){ p.life-=dt; if(!p.pulse){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=2.2*dt;} }
  fx.particles=fx.particles.filter(p=>p.life>0);
  for(const t of fx.texts){ t.life-=dt; t.y-=.45*dt; }
  fx.texts=fx.texts.filter(t=>t.life>0);
}

function drawTile(x,y,type,time){
  if(type===0){
    ctx.fillStyle=(x+y)%2?'#5b874b':'#638f51'; ctx.fillRect(x*TILE,y*TILE,TILE,TILE);
    ctx.fillStyle='#557c47'; ctx.fillRect(x*TILE+7,y*TILE+9,3,3); ctx.fillRect(x*TILE+32,y*TILE+30,2,2);
  }else if(type===1){
    ctx.fillStyle='#394b3d';ctx.fillRect(x*TILE,y*TILE,TILE,TILE);ctx.fillStyle='#243229';ctx.fillRect(x*TILE+5,y*TILE+5,TILE-10,TILE-10);
  }else{
    ctx.fillStyle='#397ca5';ctx.fillRect(x*TILE,y*TILE,TILE,TILE);
    const wave=Math.sin(time*.004+x+y)*3;ctx.fillStyle='#67a7c7';ctx.fillRect(x*TILE+8+wave,y*TILE+13,23,3);
  }
}

function drawCharacter(x,y,color,label,time,isPlayer=false){
  const moving=isPlayer&&fx.moving;
  const bob=moving?Math.sin((time-fx.moveStart)*.09)*2:0;
  const px=x*TILE,py=y*TILE+bob;
  const hit=isPlayer&&time<fx.playerHitUntil&&Math.floor(time/45)%2===0;
  ctx.save();
  if(hit) ctx.globalAlpha=.35;
  ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(px+12,py+37-bob,24,5);
  ctx.fillStyle=color;ctx.fillRect(px+13,py+11,22,27);
  ctx.fillStyle='#f2d1b3';ctx.fillRect(px+16,py+4,16,13);
  if(moving){
    const leg=Math.sin((time-fx.moveStart)*.09)*4;
    ctx.fillStyle='#202833';ctx.fillRect(px+15,py+36,6,7+leg);ctx.fillRect(px+27,py+36,6,7-leg);
  }
  if(isPlayer&&time<fx.attackUntil){
    const p=1-(fx.attackUntil-time)/220;
    ctx.strokeStyle='#fff3c4';ctx.lineWidth=4;ctx.beginPath();
    ctx.arc(px+24,py+23,23,-1.2+p*.7,.3+p*.7);ctx.stroke();
  }
  ctx.fillStyle='#101820';ctx.font='10px system-ui';ctx.textAlign='center';ctx.fillText(label,px+24,py+47);
  ctx.restore();
}

function drawEnemy(e,time){
  let px=e.x*TILE,py=e.y*TILE;
  const bounce=Math.sin(time*.006+e.x)*2;
  if(e.id===combatEnemyId&&time<fx.enemyHitUntil) px+=Math.sin(time*.12)*5;
  ctx.save();
  if(e.id===combatEnemyId&&time<fx.enemyHitUntil&&Math.floor(time/40)%2===0) ctx.globalAlpha=.35;
  ctx.fillStyle='#78d64b';ctx.beginPath();ctx.arc(px+24,py+27+bounce,15,Math.PI,Math.PI*2);ctx.lineTo(px+39,py+36+bounce);ctx.lineTo(px+9,py+36+bounce);ctx.closePath();ctx.fill();
  ctx.fillStyle='#15202b';ctx.fillRect(px+18,py+25+bounce,3,3);ctx.fillRect(px+28,py+25+bounce,3,3);ctx.restore();
}

function drawEffects(){
  for(const p of fx.particles){
    const a=clamp01(p.life/p.max);ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=p.color;ctx.fillStyle=p.color;
    const px=p.x*TILE,py=p.y*TILE;
    if(p.pulse){ctx.lineWidth=3;ctx.beginPath();ctx.arc(px,py,(1-a)*22+4,0,Math.PI*2);ctx.stroke();}
    else ctx.fillRect(px,py,p.size,p.size);
    ctx.restore();
  }
  for(const t of fx.texts){
    ctx.save();ctx.globalAlpha=clamp01(t.life/t.max);ctx.fillStyle=t.color;ctx.font='bold 16px system-ui';ctx.textAlign='center';ctx.fillText(t.text,t.x*TILE,t.y*TILE);ctx.restore();
  }
}

function drawHUD(){
  statsEl.textContent=`Nv ${state.player.level} · HP ${state.player.hp}/${state.player.maxHp} · XP ${state.player.xp} · Oro ${state.player.gold}`;
  inventoryEl.innerHTML=`<li>Pociones: ${state.inventory.potion}</li><li>Hierbas: ${state.inventory.herb}</li>`;
}

function render(time){
  ctx.save();
  if(time<fx.shakeUntil) ctx.translate((Math.random()-.5)*5,(Math.random()-.5)*5);
  for(let y=0;y<map.length;y++) for(let x=0;x<map[y].length;x++) drawTile(x,y,map[y][x],time);
  npcs.forEach(n=>drawCharacter(n.x,n.y,n.color,n.name,time));
  state.enemies.filter(e=>e.alive).forEach(e=>drawEnemy(e,time));
  drawCharacter(fx.playerX,fx.playerY,'#d94f4f','Vos',time,true);
  drawEffects();
  ctx.restore();
  drawHUD();
}

function loop(time){
  const dt=Math.min(.033,(time-lastTime)/1000);lastTime=time;
  updateAnimations(time,dt);render(time);requestAnimationFrame(loop);
}

document.addEventListener('keydown',e=>{
  const key=e.key.toLowerCase();
  if(['arrowup','arrowdown','arrowleft','arrowright',' ','enter'].includes(key))e.preventDefault();
  if(combatEnemyId){if(key==='1')playerAttack();if(key==='2')usePotion();return;}
  if(key==='w'||key==='arrowup')move(0,-1);
  else if(key==='s'||key==='arrowdown')move(0,1);
  else if(key==='a'||key==='arrowleft')move(-1,0);
  else if(key==='d'||key==='arrowright')move(1,0);
  else if(key==='e'||key==='enter')interact();
  else if(key==='2')usePotion();
});

document.getElementById('saveBtn').onclick=saveGame;
document.getElementById('resetBtn').onclick=()=>{if(confirm('¿Borrar la partida y empezar de nuevo?'))resetGame();};

loadGame();
requestAnimationFrame(loop);
