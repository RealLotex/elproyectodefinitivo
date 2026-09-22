const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
const nameEntry=document.getElementById('nameEntry');
const residentName=document.getElementById('residentName');
ctx.imageSmoothingEnabled=false;

const W=768,H=480,T=48,MOVE_MS=145,SAVE_KEY='epd-save-v2';
const keys=new Set();
let last=performance.now();

function loadSave(){try{return JSON.parse(localStorage.getItem(SAVE_KEY)||'null')}catch{return null}}
let save=loadSave()||{resident:null,flags:{windowFixed:false}};

const game={
  mode:save.resident?'world':'selection',
  scene:'bedroom',
  resident:save.resident,
  player:{x:7,y:6,vx:7,vy:6,fromX:7,fromY:6,toX:7,toY:6,moving:false,start:0,facingX:0,facingY:1},
  dialogue:null,
  fade:0,
  motherCalled:false,
  sceneStarted:performance.now(),
  prompt:null,
  glitchUntil:0,
  windowFixed:!!save.flags?.windowFixed
};

const sel={phase:'intro',selected:0,confirm:0,started:performance.now(),phaseAt:performance.now(),glitchAt:0,registeredAt:0};
const CHARACTERS=[{gender:'m',name:'Nico'},{gender:'f',name:'Vera'}];

function persist(){localStorage.setItem(SAVE_KEY,JSON.stringify({resident:game.resident,flags:{windowFixed:game.windowFixed}}))}
function resetAll(){localStorage.removeItem(SAVE_KEY);location.reload()}
document.getElementById('resetBtn').onclick=resetAll;

function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
function text(s,x,y,size=16,c='#e7ece8',align='left'){ctx.fillStyle=c;ctx.font=`700 ${size}px ui-monospace,Consolas,monospace`;ctx.textAlign=align;ctx.textBaseline='top';ctx.fillText(s,x,y)}
function panel(x,y,w,h){rect(x,y,w,h,'#090c0a');ctx.strokeStyle='#d3ded4';ctx.lineWidth=2;ctx.strokeRect(x+.5,y+.5,w-1,h-1);ctx.strokeStyle='#455047';ctx.strokeRect(x+4.5,y+4.5,w-9,h-9)}
function blink(now,rate=500){return Math.floor(now/rate)%2===0}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function ease(t){return 1-Math.pow(1-t,3)}

function drawRoomBase(secondBed=true){
  rect(0,0,W,H,'#0a0d0e');
  rect(48,48,672,384,'#323536');
  for(let y=1;y<9;y++)for(let x=1;x<15;x++){
    rect(x*T,y*T,T,T,(x+y)%2?'#3b3e3d':'#393c3b');
    rect(x*T+2,y*T+2,T-4,1,'#414543');
  }
  rect(48,48,672,12,'#171a1a');rect(48,420,672,12,'#171a1a');rect(48,48,12,384,'#171a1a');rect(708,48,12,384,'#171a1a');
  drawWindow(336,48,false);
  drawBed(104,100,true);
  if(secondBed)drawBed(520,100,false);
  drawPoster(secondBed?'SE AUTORIZA UN RESIDENTE.':'RESIDENTE AUTORIZADO.');
}
function drawBed(x,y,used){
  rect(x-5,y+8,116,65,'#080909');rect(x,y,106,58,'#777c77');rect(x+5,y+5,96,48,used?'#8f968c':'#a4aaa3');
  rect(x+8,y+8,34,17,used?'#cbc9b8':'#d8dacd');
  if(used){rect(x+45,y+16,49,4,'#676d67');rect(x+38,y+31,58,3,'#727872')}
}
function drawPoster(label){rect(282,72,204,42,'#d5d5c7');rect(286,76,196,34,'#202322');text(label,384,86,11,'#d9ddd8','center')}
function drawWindow(x,y,fixed){
  rect(x-4,y,100,58,'#080909');rect(x,y+4,92,50,'#172b34');rect(x+44,y+4,4,50,'#090b0c');rect(x,y+28,92,4,'#090b0c');
  for(let i=0;i<7;i++){const rx=x+8+i*12;rect(rx,y+8+(i%2)*7,2,14,'#557987')}
  if(!fixed){ctx.strokeStyle='#d7e1df';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+18,y+7);ctx.lineTo(x+39,y+27);ctx.lineTo(x+28,y+48);ctx.moveTo(x+39,y+27);ctx.lineTo(x+69,y+11);ctx.stroke()}
}

function drawResident(px,py,gender,now,{backpack=true,selected=false,step=0}={}){
  px=Math.round(px);py=Math.round(py);
  const bob=step?Math.sin(step)*2:0;py+=bob;
  // shadow
  rect(px-13,py+25,30,5,'#171819');
  if(backpack){rect(px-17,py-17,34,39,'#050505');rect(px-14,py-14,28,33,'#5d665e');rect(px-10,py-10,20,4,'#7d877e')}
  // legs
  rect(px-10,py+8,8,20,'#050505');rect(px+3,py+8,8,20,'#050505');rect(px-8,py+9,5,17,'#262a2c');rect(px+5,py+9,5,17,'#262a2c');
  // torso
  rect(px-15,py-15,30,29,'#050505');
  rect(px-12,py-12,24,23,gender==='m'?'#d8d0b6':'#626a64');
  if(gender==='f'){rect(px-14,py-7,4,19,'#737b75');rect(px+10,py-7,4,19,'#737b75')}
  // head + hair
  rect(px-11,py-34,22,22,'#050505');rect(px-8,py-31,16,16,'#cda98d');
  if(gender==='m'){
    rect(px-10,py-34,20,7,'#171819');rect(px-13,py-31,6,9,'#171819');rect(px+6,py-36,6,10,'#171819');
  }else{
    rect(px-10,py-35,20,8,'#191a1a');rect(px+7,py-31,7,20,'#191a1a');rect(px-13,py-29,5,15,'#191a1a');
  }
  // keyboard + cable
  if(backpack){
    ctx.strokeStyle='#050505';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(px+12,py-2);ctx.quadraticCurveTo(px+27,py+7,px+18,py+17);ctx.stroke();
    ctx.strokeStyle='#7d857d';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px+12,py-2);ctx.quadraticCurveTo(px+27,py+7,px+18,py+17);ctx.stroke();
    rect(px-22,py+2,44,15,'#050505');rect(px-19,py+5,38,9,'#b8b9a9');
    for(let k=0;k<6;k++)rect(px-15+k*6,py+7,3,3,'#343735');
  }
  if(selected&&blink(now,350)){rect(px-3,py-52,6,12,'#e7efe8')}
}

function drawSelection(now){
  const elapsed=now-sel.started;
  if(sel.phase==='intro'){
    rect(0,0,W,H,'#050607');
    if(elapsed>350)text('REGISTRO DE RESIDENTE',384,188,20,'#dce6dc','center');
    if(elapsed>1050)text('PARCELA 14-B',384,225,16,'#87948b','center');
    if(elapsed>1750){sel.phase='choose';sel.phaseAt=now}
    return;
  }
  const secondVisible=!(sel.phase==='glitch'&&now-sel.glitchAt>520)||sel.phase==='choose'||sel.phase==='confirm';
  drawRoomBase(secondVisible);
  const a={x:318,y:282},b={x:450,y:282};
  let ay=a.y,by=b.y;
  if(sel.phase==='confirm'){if(sel.selected===0)ay-=12;else by-=12}
  if(sel.phase==='glitch'){if(sel.selected===0)ay-=12;else by-=12}
  drawResident(a.x,ay,'m',now,{backpack:true,selected:sel.phase==='choose'&&sel.selected===0});
  if(secondVisible)drawResident(b.x,by,'f',now,{backpack:true,selected:sel.phase==='choose'&&sel.selected===1});

  if(sel.phase==='choose'){
    panel(198,350,372,82);text('¿QUIÉN VIVE ACÁ?',384,366,18,'#edf2ed','center');
    text(sel.selected===0?'◀  NICO     VERA':'NICO     VERA  ▶',384,397,14,'#aeb9b0','center');
  }else if(sel.phase==='confirm'){
    panel(232,350,304,92);text('¿ESTE SOS VOS?',384,365,18,'#edf2ed','center');
    text(sel.confirm===0?'▶ SÍ     NO':'SÍ     ▶ NO',384,402,15,'#bec8c0','center');
  }else if(sel.phase==='glitch'){
    const d=now-sel.glitchAt;
    if(d<520){for(let i=0;i<18;i++){const y=70+Math.random()*330;rect(Math.random()*W,y,40+Math.random()*180,2+Math.random()*5,i%2?'#dfe7df':'#202422')}}
    if(d>300&&d<1100){panel(247,355,274,58);text('RESIDENTE AUTORIZADO.',384,374,15,'#dce7dd','center')}
    if(d>1150){sel.phase='name';residentName.value=CHARACTERS[sel.selected].name;nameEntry.classList.remove('hidden');setTimeout(()=>residentName.focus(),0)}
  }else if(sel.phase==='registered'){
    const d=now-sel.registeredAt;panel(218,354,332,70);text('REGISTRO ACTUALIZADO.',384,369,15,'#dce7dd','center');
    if(d>650&&d<1030)text('ESTE REGISTRO SIEMPRE FUE ASÍ.',384,398,12,'#7d887f','center');
    if(d>1450)startWorld();
  }
}

function startWorld(){
  game.mode='world';game.scene='bedroom';game.sceneStarted=performance.now();game.motherCalled=false;game.dialogue=null;game.prompt=null;
  Object.assign(game.player,{x:7,y:6,vx:7,vy:6,fromX:7,fromY:6,toX:7,toY:6,moving:false,facingX:0,facingY:1});
  persist();
}

const bedroomObjects=[
  {id:'bed',x:2,y:2,w:3,h:1},
  {id:'closet',x:1,y:4,w:1,h:2},
  {id:'plant',x:3,y:6,w:1,h:1},
  {id:'desk',x:10,y:6,w:3,h:1},
  {id:'tv',x:11,y:2,w:2,h:1},
  {id:'door',x:7,y:8,w:1,h:1}
];
const downstairsObjects=[
  {id:'table',x:3,y:5,w:3,h:2},
  {id:'window',x:12,y:2,w:1,h:2},
  {id:'stairs',x:7,y:1,w:1,h:1},
  {id:'mother',x:9,y:5,w:1,h:1}
];
function objects(){return game.scene==='bedroom'?bedroomObjects:downstairsObjects}
function blocked(x,y){
  if(x<1||x>14||y<1||y>8)return true;
  return objects().some(o=>x>=o.x&&x<o.x+o.w&&y>=o.y&&y<o.y+o.h);
}
function beginMove(dx,dy,now){
  const p=game.player;if(p.moving||game.dialogue||game.prompt)return;
  p.facingX=dx;p.facingY=dy;const nx=p.x+dx,ny=p.y+dy;if(blocked(nx,ny))return;
  p.fromX=p.vx;p.fromY=p.vy;p.toX=nx;p.toY=ny;p.x=nx;p.y=ny;p.start=now;p.moving=true;
}
function updateMove(now){
  const p=game.player;if(p.moving){const q=clamp((now-p.start)/MOVE_MS,0,1),e=ease(q);p.vx=p.fromX+(p.toX-p.fromX)*e;p.vy=p.fromY+(p.toY-p.fromY)*e;if(q>=1){p.vx=p.toX;p.vy=p.toY;p.moving=false}}
  if(!p.moving&&!game.dialogue&&!game.prompt){if(keys.has('arrowup')||keys.has('w'))beginMove(0,-1,now);else if(keys.has('arrowdown')||keys.has('s'))beginMove(0,1,now);else if(keys.has('arrowleft')||keys.has('a'))beginMove(-1,0,now);else if(keys.has('arrowright')||keys.has('d'))beginMove(1,0,now)}
}

function drawBedroom(now){
  drawRoomBase(false);
  // closet
  rect(62,192,45,100,'#090a0a');rect(66,196,37,92,'#565b58');rect(83,201,2,82,'#242725');rect(92,240,4,4,'#c0ba91');
  // plant
  rect(151,312,30,25,'#191a18');rect(156,315,20,18,'#725b46');rect(163,286,5,30,'#243629');rect(148,291,20,6,'#3b6545');rect(164,280,18,7,'#44714d');
  // desk pc
  rect(484,319,146,12,'#171918');rect(494,331,8,44,'#171918');rect(612,331,8,44,'#171918');rect(530,283,58,37,'#080909');rect(535,288,48,27,'#202526');text('NO SIGNAL',559,297,8,'#89928b','center');
  // TV
  rect(523,126,103,65,'#080909');rect(529,132,91,52,'#242b29');
  const ad=Math.floor(now/1800)%2===0;text(ad?'¿CANSADO DE TU PARCELA?':'AMPLIACIONES GONZÁLEZ',574,143,9,'#ced7cd','center');text(ad?'MÁS ESPACIO PARA SER VOS':'SUJETO A APROBACIÓN MUNICIPAL',574,160,7,'#828e85','center');
  // door
  rect(337,385,94,47,'#090a0a');rect(343,390,82,42,'#4b504d');rect(409,409,5,5,'#c5b888');
  // absent second bed faint floor mismatch
  rect(520,100,106,2,'#444846');rect(520,156,106,2,'#303332');
  drawResident(game.player.vx*T+24,game.player.vy*T+18,game.resident.gender,now,{backpack:false,step:game.player.moving?(now-game.player.start)*.09:0});
  text('23:48',75,68,12,'#8b958d');
}

function drawDownstairs(now){
  rect(0,0,W,H,'#090c0d');rect(48,48,672,384,'#363936');
  for(let y=1;y<9;y++)for(let x=1;x<15;x++){rect(x*T,y*T,T,T,(x+y)%2?'#3b3e39':'#393c38')}
  rect(48,48,672,12,'#171a18');rect(48,420,672,12,'#171a18');rect(48,48,12,384,'#171a18');rect(708,48,12,384,'#171a18');
  // stairs
  for(let i=0;i<5;i++)rect(320+i*8,56+i*7,122-i*16,6,'#171918');
  // table
  rect(148,250,158,87,'#171817');rect(155,257,144,62,'#6e5a47');rect(168,319,10,37,'#171817');rect(276,319,10,37,'#171817');
  // broken/fixed window
  drawWindow(590,104,game.windowFixed);
  if(!game.windowFixed){for(let i=0;i<6;i++){const x=580+i*14;ctx.strokeStyle='#688a96';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,165);ctx.lineTo(x-8,205);ctx.stroke()}}
  // damp patch
  ctx.globalAlpha=.45;rect(565,208,89,33,'#253833');ctx.globalAlpha=1;
  drawMother(9*T+24,5*T+18,now);
  drawResident(game.player.vx*T+24,game.player.vy*T+18,game.resident.gender,now,{backpack:game.windowFixed||game.prompt||game.dialogue?.speaker==='MAMÁ',step:game.player.moving?(now-game.player.start)*.09:0});
}
function drawMother(px,py,now){
  rect(px-12,py+24,27,4,'#191a19');rect(px-12,py-13,24,35,'#080909');rect(px-9,py-10,18,29,'#6f625a');rect(px-9,py-32,18,20,'#080909');rect(px-6,py-29,12,14,'#c8a486');rect(px-9,py-34,18,7,'#39312e');
}

function say(lines,speaker=null,onClose=null){game.dialogue={lines:Array.isArray(lines)?lines:[lines],speaker,onClose}}
function closeDialogue(){if(!game.dialogue)return;const cb=game.dialogue.onClose;game.dialogue=null;if(cb)cb()}
function drawDialogue(){
  if(!game.dialogue)return;panel(72,355,624,96);let y=369;if(game.dialogue.speaker){text(game.dialogue.speaker,92,y,12,'#86928a');y+=20}for(const line of game.dialogue.lines){text(line,92,y,15,'#e4ebe5');y+=21}text('▼',672,420,11,'#79847b','right')
}

function targetObject(){
  const p=game.player,tx=p.x+p.facingX,ty=p.y+p.facingY;return objects().find(o=>tx>=o.x&&tx<o.x+o.w&&ty>=o.y&&ty<o.y+o.h)
}
function interact(){
  if(game.dialogue){closeDialogue();return}if(game.prompt)return;const o=targetObject();if(!o)return;
  if(game.scene==='bedroom'){
    if(o.id==='bed')say('La cama está deshecha.');
    if(o.id==='closet')say('PARCELA NO AUTORIZADA.');
    if(o.id==='plant')say('Dice pertenecer a otra persona.');
    if(o.id==='desk')say('No funciona.');
    if(o.id==='tv')say(['¿CANSADO DE TU PARCELA?','AMPLIACIONES GONZÁLEZ — “MÁS ESPACIO PARA SER VOS”','Sujeto a aprobación municipal.']);
    if(o.id==='door'){transitionTo('downstairs')}
  }else{
    if(o.id==='stairs')transitionTo('bedroom');
    if(o.id==='table')say('Hay un mate frío y tres facturas viejas.');
    if(o.id==='window')say(game.windowFixed?'La ventana está arreglada.':'Entra agua por el vidrio roto.');
    if(o.id==='mother'){
      if(game.windowFixed)say(['Bien.','Ya que estás, eliminá la humedad.'],'MAMÁ',()=>say('OBJETO NO ENCONTRADO.'));
      else say('Arreglala.','MAMÁ',()=>openPrompt());
    }
  }
}
function transitionTo(scene){
  game.scene=scene;game.sceneStarted=performance.now();game.dialogue=null;game.prompt=null;
  if(scene==='downstairs')Object.assign(game.player,{x:7,y:2,vx:7,vy:2,fromX:7,fromY:2,toX:7,toY:2,moving:false,facingX:0,facingY:1});
  else Object.assign(game.player,{x:7,y:7,vx:7,vy:7,fromX:7,fromY:7,toX:7,toY:7,moving:false,facingX:0,facingY:-1});
}
function openPrompt(){game.prompt={selected:0,options:['REPARAR','MOVER','CAMBIAR','ELIMINAR']}}
function drawPrompt(){
  if(!game.prompt)return;panel(418,216,278,204);text('PARCELA 14-B',438,234,13,'#87938a');text('23 m² DISPONIBLES',438,255,11,'#657068');
  game.prompt.options.forEach((o,i)=>text(`${i===game.prompt.selected?'▶':' '} ${o}`,448,286+i*27,15,i===game.prompt.selected?'#eef3ef':'#929c94'));
}
function executePrompt(){
  if(!game.prompt)return;const choice=game.prompt.options[game.prompt.selected];game.prompt=null;
  if(choice!=='REPARAR'){say('PERMISO VÁLIDO. OBJETO NO COMPATIBLE.');return}
  game.glitchUntil=performance.now()+420;setTimeout(()=>{game.windowFixed=true;persist();say('Bien.','MAMÁ',()=>say(['Ya que estás, eliminá la humedad.'],'MAMÁ',()=>say('OBJETO NO ENCONTRADO.')))},430)
}

function drawGlitch(now){if(now>=game.glitchUntil)return;for(let i=0;i<14;i++){const y=95+Math.random()*145;rect(560+Math.random()*110,y,10+Math.random()*60,1+Math.random()*5,i%3===0?'#e4ebe5':'#202524')}}

function updateWorld(now){
  updateMove(now);
  if(game.scene==='bedroom'&&!game.motherCalled&&now-game.sceneStarted>1700){game.motherCalled=true;say('¡SE ROMPIÓ OTRA VEZ!','MAMÁ')}
}
function drawWorld(now){
  if(game.scene==='bedroom')drawBedroom(now);else drawDownstairs(now);
  drawGlitch(now);drawDialogue();drawPrompt();
}

function handleSelectionKey(key){
  if(sel.phase==='choose'){
    if(key==='arrowleft'||key==='a')sel.selected=0;if(key==='arrowright'||key==='d')sel.selected=1;
    if(key==='enter'||key==='e'){sel.phase='confirm';sel.confirm=0;sel.phaseAt=performance.now()}
  }else if(sel.phase==='confirm'){
    if(['arrowleft','arrowup','a','w'].includes(key))sel.confirm=0;if(['arrowright','arrowdown','d','s'].includes(key))sel.confirm=1;
    if(key==='enter'||key==='e'){if(sel.confirm===1){sel.phase='choose';return}sel.phase='glitch';sel.glitchAt=performance.now()}
  }
}

document.addEventListener('keydown',e=>{
  const key=e.key.toLowerCase();
  if(['arrowup','arrowdown','arrowleft','arrowright',' ','enter'].includes(key))e.preventDefault();
  if(game.mode==='selection'){handleSelectionKey(key);return}
  if(game.prompt){if(['arrowup','w'].includes(key))game.prompt.selected=(game.prompt.selected+3)%4;else if(['arrowdown','s'].includes(key))game.prompt.selected=(game.prompt.selected+1)%4;else if(key==='enter'||key==='e')executePrompt();return}
  if(game.dialogue){if(key==='enter'||key==='e'||key===' ')closeDialogue();return}
  keys.add(key);if(key==='enter'||key==='e')interact();
});
document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));

nameEntry.addEventListener('submit',e=>{
  e.preventDefault();if(sel.phase!=='name')return;const fallback=CHARACTERS[sel.selected].name;const name=residentName.value.trim().slice(0,12)||fallback;
  game.resident={gender:CHARACTERS[sel.selected].gender,name};save.resident=game.resident;nameEntry.classList.add('hidden');residentName.blur();sel.phase='registered';sel.registeredAt=performance.now();persist();
});

function loop(now){
  const dt=Math.min(.033,(now-last)/1000);last=now;
  if(game.mode==='selection')drawSelection(now);else{updateWorld(now,dt);drawWorld(now)}
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
