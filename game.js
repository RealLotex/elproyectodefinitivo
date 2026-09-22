const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statsEl = document.getElementById('stats');
const inventoryEl = document.getElementById('inventory');
const dialogueEl = document.getElementById('dialogue');
const combatEl = document.getElementById('combat');

const TILE = 48;
const SAVE_KEY = 'elproyectodefinitivo-save-v1';

// 0 pasto, 1 pared, 2 agua
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
    { id: 'slime-1', name: 'Slime', x: 10, y: 7, hp: 18, maxHp: 18, attack: 4, alive: true },
    { id: 'slime-2', name: 'Slime', x: 13, y: 4, hp: 18, maxHp: 18, attack: 4, alive: true }
  ],
  flags: { talkedToElder: false }
});

let state = defaultState();
let combatEnemyId = null;
let messageTimer = null;

const npcs = [
  { id:'elder', name:'Aldo', x:5, y:5, color:'#f0c674', lines:[
    'Forastero, este valle está lleno de slimes.',
    'Derrotá uno y vas a conseguir oro y experiencia.'
  ]}
];

function isBlocked(x,y){
  if(y < 0 || y >= map.length || x < 0 || x >= map[0].length) return true;
  if(map[y][x] !== 0) return true;
  if(npcs.some(n => n.x === x && n.y === y)) return true;
  if(state.enemies.some(e => e.alive && e.x === x && e.y === y)) return true;
  return false;
}

function move(dx,dy){
  if(combatEnemyId) return;
  hideDialogue();
  const nx = state.player.x + dx;
  const ny = state.player.y + dy;
  if(!isBlocked(nx,ny)){
    state.player.x = nx;
    state.player.y = ny;
    render();
  }
}

function adjacentTo(a,b){
  return Math.abs(a.x-b.x) + Math.abs(a.y-b.y) === 1;
}

function interact(){
  if(combatEnemyId) return;
  const npc = npcs.find(n => adjacentTo(state.player,n));
  if(npc){
    state.flags.talkedToElder = true;
    showDialogue(`<strong>${npc.name}</strong><br>${npc.lines.join('<br>')}`);
    return;
  }
  const enemy = state.enemies.find(e => e.alive && adjacentTo(state.player,e));
  if(enemy){
    startCombat(enemy.id);
    return;
  }
  showDialogue('No hay nada con qué interactuar acá.');
}

function startCombat(enemyId){
  combatEnemyId = enemyId;
  hideDialogue();
  updateCombatPanel(`¡Apareció un enemigo!`);
  render();
}

function currentEnemy(){
  return state.enemies.find(e => e.id === combatEnemyId);
}

function playerAttack(){
  const enemy = currentEnemy();
  if(!enemy) return;
  const damage = 5 + Math.floor(Math.random()*4) + (state.player.level-1)*2;
  enemy.hp = Math.max(0, enemy.hp-damage);
  if(enemy.hp === 0){
    enemy.alive = false;
    state.player.xp += 10;
    state.player.gold += 6;
    maybeLevelUp();
    combatEnemyId = null;
    combatEl.classList.add('hidden');
    flashMessage(`Derrotaste al ${enemy.name}. +10 XP, +6 oro.`);
    render();
    return;
  }
  enemyTurn(`Atacaste e hiciste ${damage} de daño.`);
}

function enemyTurn(prefix){
  const enemy = currentEnemy();
  if(!enemy) return;
  const damage = Math.max(1, enemy.attack + Math.floor(Math.random()*3)-1);
  state.player.hp = Math.max(0, state.player.hp-damage);
  if(state.player.hp === 0){
    state.player.hp = state.player.maxHp;
    state.player.x = 2;
    state.player.y = 5;
    combatEnemyId = null;
    combatEl.classList.add('hidden');
    flashMessage('Caíste en combate. Despertaste nuevamente en el pueblo.');
    render();
    return;
  }
  updateCombatPanel(`${prefix}<br>${enemy.name} responde por ${damage}.`);
  render();
}

function usePotion(){
  if(state.inventory.potion <= 0){
    if(combatEnemyId) updateCombatPanel('No te quedan pociones.');
    else flashMessage('No te quedan pociones.');
    return;
  }
  if(state.player.hp >= state.player.maxHp){
    if(combatEnemyId) updateCombatPanel('Ya tenés la vida completa.');
    else flashMessage('Ya tenés la vida completa.');
    return;
  }
  state.inventory.potion--;
  const healed = Math.min(12, state.player.maxHp-state.player.hp);
  state.player.hp += healed;
  if(combatEnemyId) enemyTurn(`Usaste una poción y recuperaste ${healed} HP.`);
  else flashMessage(`Recuperaste ${healed} HP.`);
  render();
}

function maybeLevelUp(){
  const need = state.player.level * 20;
  if(state.player.xp >= need){
    state.player.xp -= need;
    state.player.level++;
    state.player.maxHp += 6;
    state.player.hp = state.player.maxHp;
  }
}

function updateCombatPanel(text=''){
  const enemy = currentEnemy();
  if(!enemy) return;
  combatEl.classList.remove('hidden');
  combatEl.innerHTML = `
    <strong>Combate: ${enemy.name}</strong><br>
    Enemigo: ${enemy.hp}/${enemy.maxHp} HP<br>
    ${text ? `<p>${text}</p>` : ''}
    <div class="combat-actions">
      <button id="attackBtn">1 — Atacar</button>
      <button id="potionBtn">2 — Poción</button>
    </div>`;
  document.getElementById('attackBtn').onclick = playerAttack;
  document.getElementById('potionBtn').onclick = usePotion;
}

function showDialogue(html){
  dialogueEl.innerHTML = html;
  dialogueEl.classList.remove('hidden');
}
function hideDialogue(){ dialogueEl.classList.add('hidden'); }

function flashMessage(text){
  showDialogue(text);
  clearTimeout(messageTimer);
  messageTimer = setTimeout(hideDialogue, 2600);
}

function saveGame(){
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  flashMessage('Partida guardada en este navegador.');
}

function loadGame(){
  const raw = localStorage.getItem(SAVE_KEY);
  if(!raw) return;
  try { state = JSON.parse(raw); }
  catch { localStorage.removeItem(SAVE_KEY); state = defaultState(); }
}

function resetGame(){
  localStorage.removeItem(SAVE_KEY);
  state = defaultState();
  combatEnemyId = null;
  combatEl.classList.add('hidden');
  hideDialogue();
  render();
}

function drawTile(x,y,type){
  if(type === 0){
    ctx.fillStyle = (x+y)%2 ? '#5b874b' : '#638f51';
    ctx.fillRect(x*TILE,y*TILE,TILE,TILE);
    ctx.fillStyle='#557c47';
    ctx.fillRect(x*TILE+7,y*TILE+9,3,3);
    ctx.fillRect(x*TILE+32,y*TILE+30,2,2);
  } else if(type === 1){
    ctx.fillStyle='#394b3d'; ctx.fillRect(x*TILE,y*TILE,TILE,TILE);
    ctx.fillStyle='#243229'; ctx.fillRect(x*TILE+5,y*TILE+5,TILE-10,TILE-10);
  } else {
    ctx.fillStyle='#397ca5'; ctx.fillRect(x*TILE,y*TILE,TILE,TILE);
    ctx.fillStyle='#67a7c7'; ctx.fillRect(x*TILE+8,y*TILE+13,26,3);
  }
}

function drawCharacter(x,y,color,label){
  const px=x*TILE, py=y*TILE;
  ctx.fillStyle='rgba(0,0,0,.25)'; ctx.fillRect(px+12,py+37,24,5);
  ctx.fillStyle=color; ctx.fillRect(px+13,py+11,22,27);
  ctx.fillStyle='#f2d1b3'; ctx.fillRect(px+16,py+4,16,13);
  ctx.fillStyle='#101820'; ctx.font='10px system-ui'; ctx.textAlign='center';
  ctx.fillText(label,px+24,py+47);
}

function drawEnemy(e){
  const px=e.x*TILE, py=e.y*TILE;
  ctx.fillStyle='#78d64b';
  ctx.beginPath(); ctx.arc(px+24,py+27,15,Math.PI,Math.PI*2); ctx.lineTo(px+39,py+36); ctx.lineTo(px+9,py+36); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#15202b'; ctx.fillRect(px+18,py+25,3,3); ctx.fillRect(px+28,py+25,3,3);
}

function render(){
  for(let y=0;y<map.length;y++) for(let x=0;x<map[y].length;x++) drawTile(x,y,map[y][x]);

  npcs.forEach(n => drawCharacter(n.x,n.y,n.color,n.name));
  state.enemies.filter(e=>e.alive).forEach(drawEnemy);
  drawCharacter(state.player.x,state.player.y,'#d94f4f','Vos');

  statsEl.textContent = `Nv ${state.player.level} · HP ${state.player.hp}/${state.player.maxHp} · XP ${state.player.xp} · Oro ${state.player.gold}`;
  inventoryEl.innerHTML = `<li>Pociones: ${state.inventory.potion}</li><li>Hierbas: ${state.inventory.herb}</li>`;
  if(combatEnemyId) updateCombatPanel();
}

document.addEventListener('keydown', e => {
  const key=e.key.toLowerCase();
  if(['arrowup','arrowdown','arrowleft','arrowright',' ','enter'].includes(key)) e.preventDefault();
  if(combatEnemyId){
    if(key==='1') playerAttack();
    if(key==='2') usePotion();
    return;
  }
  if(key==='w'||key==='arrowup') move(0,-1);
  else if(key==='s'||key==='arrowdown') move(0,1);
  else if(key==='a'||key==='arrowleft') move(-1,0);
  else if(key==='d'||key==='arrowright') move(1,0);
  else if(key==='e'||key==='enter') interact();
  else if(key==='2') usePotion();
});

document.getElementById('saveBtn').onclick = saveGame;
document.getElementById('resetBtn').onclick = () => { if(confirm('¿Borrar la partida y empezar de nuevo?')) resetGame(); };

loadGame();
render();
