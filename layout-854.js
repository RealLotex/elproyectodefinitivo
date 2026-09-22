// 854x480 composition override.
// Keeps the existing 48px gameplay grid while extending the room horizontally.

(() => {
  const VIEW_W = 854;
  const INNER_X = 48;
  const INNER_W = 758;
  const RIGHT_WALL_X = 794;

  drawPoster = function(label){
    rect(325,72,204,42,'#d5d5c7');
    rect(329,76,196,34,'#202322');
    text(label,427,86,11,'#d9ddd8','center');
  };

  drawRoomBase = function(secondBed=true){
    rect(0,0,VIEW_W,480,'#0a0d0e');
    rect(INNER_X,48,INNER_W,384,'#323536');
    for(let y=1;y<9;y++)for(let x=1;x<17;x++){
      rect(x*T,y*T,T,T,(x+y)%2?'#3b3e3d':'#393c3b');
      rect(x*T+2,y*T+2,T-4,1,'#414543');
    }
    rect(INNER_X,48,INNER_W,12,'#171a1a');
    rect(INNER_X,420,INNER_W,12,'#171a1a');
    rect(INNER_X,48,12,384,'#171a1a');
    rect(RIGHT_WALL_X,48,12,384,'#171a1a');
    drawWindow(379,48,false);
    drawBed(104,100,true);
    if(secondBed)drawBed(606,100,false);
    drawPoster(secondBed?'SE AUTORIZA UN RESIDENTE.':'RESIDENTE AUTORIZADO.');
  };

  blocked = function(x,y){
    if(x<1||x>16||y<1||y>8)return true;
    return objects().some(o=>x>=o.x&&x<o.x+o.w&&y>=o.y&&y<o.y+o.h);
  };

  drawDownstairs = function(now){
    rect(0,0,VIEW_W,480,'#090c0d');
    rect(INNER_X,48,INNER_W,384,'#363936');
    for(let y=1;y<9;y++)for(let x=1;x<17;x++)rect(x*T,y*T,T,T,(x+y)%2?'#3b3e39':'#393c38');
    rect(INNER_X,48,INNER_W,12,'#171a18');
    rect(INNER_X,420,INNER_W,12,'#171a18');
    rect(INNER_X,48,12,384,'#171a18');
    rect(RIGHT_WALL_X,48,12,384,'#171a18');

    for(let i=0;i<5;i++)rect(320+i*8,56+i*7,122-i*16,6,'#171918');
    rect(148,250,158,87,'#171817');rect(155,257,144,62,'#6e5a47');rect(168,319,10,37,'#171817');rect(276,319,10,37,'#171817');
    drawWindow(676,104,game.windowFixed);
    if(!game.windowFixed){for(let i=0;i<6;i++){const x=666+i*14;ctx.strokeStyle='#688a96';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,165);ctx.lineTo(x-8,205);ctx.stroke()}}
    ctx.globalAlpha=.45;rect(651,208,89,33,'#253833');ctx.globalAlpha=1;
    drawMother(10*T+24,5*T+18,now);
    drawResident(game.player.vx*T+24,game.player.vy*T+18,game.resident.gender,now,{backpack:game.windowFixed||game.prompt||game.dialogue?.speaker==='MAMÁ',step:game.player.moving?(now-game.player.start)*.09:0});
  };

  drawDialogue = function(){
    if(!game.dialogue)return;
    panel(72,355,710,96);
    let y=369;
    if(game.dialogue.speaker){text(game.dialogue.speaker,92,y,12,'#86928a');y+=20}
    for(const line of game.dialogue.lines){text(line,92,y,15,'#e4ebe5');y+=21}
    text('▼',758,420,11,'#79847b','right');
  };

  drawPrompt = function(){
    if(!game.prompt)return;
    panel(504,216,300,204);
    text('PARCELA 14-B',524,234,13,'#87938a');
    text('23 m² DISPONIBLES',524,255,11,'#657068');
    game.prompt.options.forEach((o,i)=>text(`${i===game.prompt.selected?'▶':' '} ${o}`,534,286+i*27,15,i===game.prompt.selected?'#eef3ef':'#929c94'));
  };
})();