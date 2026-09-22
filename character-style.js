// Character rendering override.
// Visual target: hand-drawn MS Paint / Pizza Tower-like sprites,
// pure black outlines, no antialiasing, few flat colors, uneven silhouettes.

(() => {
  const C = {
    black:'#000000', skin:'#f4d2a4', skinShadow:'#d89d82',
    red:'#ff1515', blue:'#1f55e5', pink:'#ef55a8', purple:'#7556d4',
    white:'#fff8e9', gray:'#c9c1ad', dark:'#181818', yellow:'#ffd400'
  };

  function R(x,y,w,h,c){ rect(Math.round(x),Math.round(y),Math.round(w),Math.round(h),c); }

  function glasses(px,py){
    R(px-16,py-31,14,10,C.black); R(px+2,py-31,14,10,C.black);
    R(px-14,py-29,10,6,'#eee9d7'); R(px+4,py-29,10,6,'#eee9d7');
    R(px-2,py-28,4,2,C.black);
    R(px-11,py-27,3,2,C.dark); R(px+7,py-27,3,2,C.dark);
  }

  function backpack(px,py,gender){
    const c=gender==='m'?'#6b736d':'#706d7e';
    R(px-22,py-17,9,33,C.black); R(px-20,py-15,6,29,c);
    R(px+13,py-17,9,33,C.black); R(px+14,py-15,6,29,c);
    R(px-18,py-20,36,32,C.black); R(px-15,py-17,30,26,c);
    R(px-10,py-14,20,4,'#979d96');
  }

  function keyboard(px,py,gender){
    const angle=gender==='f'?3:0;
    const y=py+7+angle;
    // cable: square stair-step curve, deliberately jagged
    R(px+15,py-2,4,4,C.black); R(px+18,py+1,4,4,C.black); R(px+20,py+4,4,8,C.black);
    R(px+18,py+11,4,6,C.black); R(px+15,py+15,5,4,C.black);
    // keyboard
    R(px-24,y-3,48,18,C.black); R(px-21,y,42,12,C.gray);
    for(let row=0;row<2;row++) for(let col=0;col<7;col++) R(px-18+col*5.5,y+2+row*5,3,3,C.dark);
  }

  function male(px,py,now,opts){
    const walking=!!opts.step;
    const gait=walking?Math.round(Math.sin(opts.step)*3):0;
    const idle=!walking && (now%5200)>3900;

    if(opts.backpack) backpack(px,py,'m');

    // shadow
    R(px-22,py+31,44,5,'#111111');

    // shoes, deliberately asymmetrical
    R(px-20,py+24+gait,18,8,C.black); R(px-17,py+24+gait,14,5,C.white); R(px-15,py+29+gait,13,2,C.red);
    R(px+2,py+24-gait,20,8,C.black); R(px+5,py+24-gait,15,5,C.white); R(px+5,py+29-gait,13,2,C.red);

    // pants
    R(px-16,py+2,13,25+gait,C.black); R(px-13,py+4,9,21+gait,C.blue);
    R(px+1,py+2,14,25-gait,C.black); R(px+4,py+4,9,21-gait,C.blue);
    R(px-6,py+3,12,8,C.black); R(px-4,py+4,8,7,C.blue);

    // torso / oversized red shirt
    R(px-21,py-18,42,24,C.black); R(px-18,py-15,36,19,C.red);
    R(px-25,py-13,9,26,C.black); R(px-22,py-11,6,21,C.red);
    R(px+16,py-13,10,28,C.black); R(px+17,py-10,6,22,C.red);

    // exposed belly / keyboard support opening
    R(px-11,py-1,22,10,C.black); R(px-8,py+1,16,6,C.skin);

    // head, squarish and lumpy
    R(px-18,py-41,36,24,C.black); R(px-15,py-38,30,19,C.skin);
    R(px-20,py-34,6,12,C.black); R(px+14,py-35,6,13,C.black);

    // hair
    R(px-14,py-42,7,6,C.black); R(px-6,py-45,8,7,C.black); R(px+1,py-43,10,6,C.black); R(px+10,py-40,7,6,C.black);

    glasses(px,py);
    R(px+8,py-20,7,3,'#ff766d'); // blush
    R(px-1,py-20,5,2,C.black); // mouth

    // arms / hands
    R(px-27,py-2,8,10,C.black); R(px-24,py,5,6,C.skin);
    R(px+20,py+2,8,10,C.black); R(px+21,py+4,5,6,C.skin);

    if(opts.backpack) keyboard(px,py,'m');

    // characteristic idle: taps one key, nothing happens
    if(idle && opts.backpack){
      R(px+8,py+5,8,8,C.black); R(px+10,py+6,5,5,C.skin);
      R(px+27,py-18,3,7,C.yellow); R(px+31,py-14,6,3,C.yellow);
    }
  }

  function female(px,py,now,opts){
    const walking=!!opts.step;
    const gait=walking?Math.round(Math.sin(opts.step)*3):0;
    const idle=!walking && (now%5600)>4100;

    if(opts.backpack) backpack(px,py,'f');
    R(px-22,py+31,44,5,'#111111');

    // shoes
    R(px-19,py+24+gait,18,8,C.black); R(px-16,py+24+gait,14,5,C.white); R(px-14,py+29+gait,12,2,C.pink);
    R(px+1,py+24-gait,20,8,C.black); R(px+4,py+24-gait,15,5,C.white); R(px+4,py+29-gait,13,2,C.pink);

    // pants
    R(px-15,py+2,13,25+gait,C.black); R(px-12,py+4,9,21+gait,C.purple);
    R(px+1,py+2,14,25-gait,C.black); R(px+4,py+4,9,21-gait,C.purple);
    R(px-5,py+3,11,8,C.black); R(px-3,py+4,7,7,C.purple);

    // oversized pink jacket
    R(px-22,py-19,44,25,C.black); R(px-18,py-16,36,20,C.pink);
    R(px-27,py-13,10,27,C.black); R(px-23,py-10,6,21,C.pink);
    R(px+17,py-14,11,29,C.black); R(px+18,py-11,7,23,C.pink);
    R(px-11,py-1,22,10,C.black); R(px-8,py+1,16,6,C.skin);

    // head / hair
    R(px-18,py-41,36,24,C.black); R(px-15,py-38,30,19,C.skin);
    R(px-20,py-35,6,15,C.black); R(px+14,py-35,6,16,C.black);
    R(px-15,py-43,30,7,C.black); R(px+11,py-39,8,17,C.black);

    // bow
    R(px-17,py-49,8,8,C.black); R(px-15,py-47,5,5,C.pink);
    R(px-8,py-48,8,8,C.black); R(px-7,py-46,5,5,'#ff7ec2');

    glasses(px,py);
    R(px+8,py-20,7,3,'#ff766d');
    R(px-1,py-20,5,2,C.black);

    // arms / hands; right arm higher as in reference
    R(px-27,py-1,8,11,C.black); R(px-24,py+1,5,7,C.skin);
    R(px+18,py-8,10,19,C.black); R(px+19,py-7,7,15,C.pink); R(px+17,py-10,8,8,C.black); R(px+19,py-9,5,5,C.skin);

    if(opts.backpack) keyboard(px,py,'f');

    // characteristic idle: glances at terminal; tiny status cue
    if(idle && opts.backpack){
      R(px+26,py-29,3,7,C.yellow); R(px+30,py-25,6,3,C.yellow);
    }
  }

  drawResident = function(px,py,gender,now,{backpack=true,selected=false,step=0}={}){
    px=Math.round(px); py=Math.round(py);
    const bob=step?Math.round(Math.sin(step)*1):0;
    py+=bob;
    const opts={backpack,selected,step};
    if(gender==='f') female(px,py,now,opts); else male(px,py,now,opts);
    if(selected && blink(now,330)){
      R(px-4,py-58,8,11,C.yellow);
      R(px-11,py-53,5,3,C.yellow); R(px+7,py-53,5,3,C.yellow);
    }
  };
})();
