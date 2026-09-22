drawSelection=function(now){
  const VIEW_W=854,CX=427;
  const elapsed=now-sel.started;
  if(sel.phase==='intro'){
    rect(0,0,VIEW_W,480,'#050607');
    if(elapsed>350)text('REGISTRO DE RESIDENTE',CX,188,20,'#dce6dc','center');
    if(elapsed>1050)text('PARCELA 14-B',CX,225,16,'#87948b','center');
    if(elapsed>1750){sel.phase='choose';sel.phaseAt=now}
    return;
  }

  const d=sel.phase==='glitch'?now-sel.glitchAt:9999;
  const pairVisible=sel.phase==='choose'||sel.phase==='confirm'||(sel.phase==='glitch'&&d<520);
  drawRoomBase(pairVisible);

  const a={x:330,y:292},b={x:524,y:292};
  let ay=a.y,by=b.y;
  if(sel.phase==='confirm'||sel.phase==='glitch'){
    if(sel.selected===0)ay-=12;else by-=12;
  }

  if(pairVisible){
    drawResident(a.x,ay,'m',now,{backpack:true,selected:sel.phase==='choose'&&sel.selected===0});
    drawResident(b.x,by,'f',now,{backpack:true,selected:sel.phase==='choose'&&sel.selected===1});
  }else{
    const chosen=CHARACTERS[sel.selected];
    const pos=sel.selected===0?a:b;
    drawResident(pos.x,pos.y-12,chosen.gender,now,{backpack:true});
  }

  if(sel.phase==='choose'){
    panel(241,350,372,82);text('¿QUIÉN VIVE ACÁ?',CX,366,18,'#edf2ed','center');
    text(sel.selected===0?'◀  NICO     VERA':'NICO     VERA  ▶',CX,397,14,'#aeb9b0','center');
  }else if(sel.phase==='confirm'){
    panel(275,350,304,92);text('¿ESTE SOS VOS?',CX,365,18,'#edf2ed','center');
    text(sel.confirm===0?'▶ SÍ     NO':'SÍ     ▶ NO',CX,402,15,'#bec8c0','center');
  }else if(sel.phase==='glitch'){
    if(d<520){
      for(let i=0;i<18;i++){
        const y=70+Math.random()*330;
        rect(Math.random()*VIEW_W,y,40+Math.random()*180,2+Math.random()*5,i%2?'#dfe7df':'#202422');
      }
    }
    if(d>300&&d<1100){panel(290,355,274,58);text('RESIDENTE AUTORIZADO.',CX,374,15,'#dce7dd','center')}
    if(d>1150){
      sel.phase='name';
      residentName.value=CHARACTERS[sel.selected].name;
      nameEntry.classList.remove('hidden');
      setTimeout(()=>residentName.focus(),0);
    }
  }else if(sel.phase==='registered'){
    const rd=now-sel.registeredAt;
    panel(261,354,332,70);text('REGISTRO ACTUALIZADO.',CX,369,15,'#dce7dd','center');
    if(rd>650&&rd<1030)text('ESTE REGISTRO SIEMPRE FUE ASÍ.',CX,398,12,'#7d887f','center');
    if(rd>1450)startWorld();
  }
};