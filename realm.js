/* Wanxiang living realm: original Canvas illustration, no external assets. */
(function () {
  'use strict';
  const canvas = document.getElementById('realm-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = motionQuery.matches;
  let found = new Set(['metal', 'wood', 'water', 'fire', 'earth']);
  let width = 900, height = 340, dpr = 1, inView = true, stopped = false;
  let frame = 0, lastFrame = 0, time = 0, celebrationUntil = 0;
  let pointer = null, trail = [], rings = [];
  const tau = Math.PI * 2;
  const colors = ['#e6c879', '#9cbf84', '#86c4cb', '#e69b70', '#c9b48b'];
  const rand = n => { const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
  const has = id => found.has(id);
  const sceneScale = () => Math.min(width / 650, height / 350);
  function ellipse(x, y, rx, ry, fill, rotation = 0) {
    ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rotation, 0, tau);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  }
  function polygon(points, fill, stroke) {
    ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
  }
  function line(points, color, thickness = 1) {
    ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    ctx.strokeStyle = color; ctx.lineWidth = thickness; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
  }
  function sparkle(x, y, radius, color, alpha = 1) {
    ctx.save(); ctx.globalAlpha = alpha;
    polygon([[x, y-radius], [x+radius*.2,y-radius*.2], [x+radius,y], [x+radius*.2,y+radius*.2], [x,y+radius], [x-radius*.2,y+radius*.2], [x-radius,y], [x-radius*.2,y-radius*.2]], color);
    ctx.restore();
  }
  function glow(x, y, radius, color) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, color); g.addColorStop(1, 'rgba(240,230,180,0)');
    ctx.fillStyle = g; ctx.fillRect(x-radius,y-radius,radius*2,radius*2);
  }
  function cloud(x, y, scale, alpha) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.globalAlpha = alpha;
    const color = has('storm') ? '#a5bbb5' : '#fbf9e9';
    ellipse(0, 0, 44, 12, color); ellipse(-18,-7,22,13,color); ellipse(9,-13,26,19,color); ellipse(33,-5,20,12,color);
    ctx.restore();
  }
  function tree(x, y, scale, seed) {
    ctx.save(); ctx.translate(x,y); ctx.scale(scale,scale);
    ctx.rotate(Math.sin(time*.8+seed)*.018);
    ellipse(0,3,24,5,'#244f4036');
    line([[0,4],[-1,-39],[8,-64]],'#456647',5);
    line([[-1,-30],[-14,-45]],'#456647',3);
    ellipse(-13,-45,22,26,'#477654',-.15);
    ellipse(10,-56,25,32,'#56875c',.16);
    ellipse(-4,-74,21,24,'#729966');
    ellipse(12,-73,12,16,'#90ac75',.2);
    line([[0,-26],[-2,-52],[6,-69]],'#c3d09575',1);
    ctx.restore();
  }
  function pine(x,y,s) {
    ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.rotate(Math.sin(time+1)*.012);
    line([[0,0],[0,-52]],'#395e47',4);
    polygon([[-24,-13],[0,-46],[24,-13]],'#4b765a');
    polygon([[-19,-28],[0,-61],[19,-28]],'#638c67');
    polygon([[-12,-44],[0,-71],[12,-44]],'#82a078');
    ctx.restore();
  }
  function crystal(x,y,s) {
    ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.rotate(Math.sin(time*.7)*.025);
    polygon([[0,-32],[11,-18],[8,2],[-7,6],[-12,-15]],'#b9d6cc','#e9f3d8');
    polygon([[0,-32],[1,2],[8,2],[11,-18]],'#80b5ad');
    polygon([[-13,-17],[-7,-6],[-7,7],[-18,2],[-21,-7]],'#a4c4c9');
    sparkle(1,-27,3,'#fbf9da',.5+Math.sin(time*2)*.3);
    ctx.restore();
  }
  function mainIsland() {
    ctx.save();
    ctx.translate(0, Math.sin(time*.65)*3);
    ellipse(0,143,173,13,'#406a5112');
    polygon([[-237,0],[-204,46],[-152,68],[-117,91],[-54,103],[-5,131],[44,108],[107,100],[158,69],[210,43],[239,1]],'#3f6657');
    polygon([[-237,0],[-204,46],[-152,68],[-117,91],[-139,25],[-78,9]],'#6f8970');
    polygon([[-139,25],[-117,91],[-54,103],[-77,40],[-13,24]],'#54705c');
    polygon([[-13,24],[-77,40],[-54,103],[-5,131],[12,67],[53,27]],'#334f46');
    polygon([[53,27],[12,67],[-5,131],[44,108],[107,100],[97,38],[155,9]],'#4f6d59');
    polygon([[155,9],[97,38],[107,100],[158,69],[210,43],[239,1]],'#3b5b4d');
    // Hanging roots and tiny stones make the island feel suspended.
    line([[-161,54],[-157,76],[-165,91]],'#567b55',2);
    line([[154,58],[149,80],[154,91]],'#5f845e',2);
    polygon([[-166,111],[-154,117],[-164,131],[-173,119]],'#96ad8b');
    polygon([[170,103],[179,106],[174,120],[164,111]],'#78967c');
    ctx.beginPath();ctx.moveTo(-240,0);ctx.bezierCurveTo(-196,-53,-79,-62,7,-53);ctx.bezierCurveTo(101,-60,202,-38,240,0);ctx.bezierCurveTo(191,41,96,54,0,49);ctx.bezierCurveTo(-100,54,-191,34,-240,0);ctx.fillStyle='#93af7e';ctx.fill();
    ctx.beginPath();ctx.moveTo(-232,-1);ctx.bezierCurveTo(-150,-51,-45,-53,35,-44);ctx.bezierCurveTo(131,-42,190,-23,220,0);ctx.bezierCurveTo(115,9,38,0,-15,20);ctx.bezierCurveTo(-94,37,-181,15,-232,-1);ctx.fillStyle='#a8be8b';ctx.fill();
    // The luminous river bends through the land, then falls beyond its edge.
    ctx.beginPath();ctx.moveTo(93,-42);ctx.bezierCurveTo(74,-25,12,-23,18,-4);ctx.bezierCurveTo(21,12,69,19,49,45);ctx.lineTo(29,48);ctx.bezierCurveTo(47,25,-9,15,-1,-5);ctx.bezierCurveTo(8,-30,62,-25,76,-45);ctx.closePath();ctx.fillStyle='#74b6ac';ctx.fill();
    ctx.beginPath();ctx.moveTo(85,-42);ctx.bezierCurveTo(67,-24,5,-21,9,-4);ctx.bezierCurveTo(18,16,57,20,38,47);ctx.strokeStyle='#cce7c2';ctx.lineWidth=2;ctx.stroke();
    const waterfall=ctx.createLinearGradient(0,43,0,154);waterfall.addColorStop(0,'#a4d8c9');waterfall.addColorStop(.7,'#9cd2c291');waterfall.addColorStop(1,'#a5d8cb00');
    ctx.beginPath();ctx.moveTo(29,46);ctx.bezierCurveTo(29,88,26,122,32,159);ctx.lineTo(52,159);ctx.bezierCurveTo(44,108,48,71,49,43);ctx.closePath();ctx.fillStyle=waterfall;ctx.fill();
    for(let i=0;i<7;i++){const yy=50+((i*19+time*26)%101);line([[33+i%3*4,yy],[32+i%3*4,yy+12]],'#e0eee1a6',1);}
    glow(39,148,31,'#d7ead07a');
    // A gentle bank, meadow stones, and gold ore are visible from the start.
    for(let i=0;i<24;i++){const x=-208+rand(i+7)*407,y=-28+rand(i+88)*53;if(Math.abs(x-28)<35)continue;line([[x,y],[x-2,y-5],[x+1,y-3],[x+3,y-7]],'#6c985e',.8);}
    polygon([[-191,5],[-182,-7],[-169,-4],[-164,8],[-182,11]],'#bec59a');
    polygon([[-188,2],[-182,-7],[-177,4],[-182,11]],'#dbcc91');
    tree(-119,-7,.88,2);
    if(has('forest')){tree(-177,-16,.58,5);tree(-69,-24,.7,4);pine(-91,18,.68);}
    else pine(-175,0,.38);
    if(has('sprout')||has('life'))for(let i=0;i<15;i++){const x=-151+rand(i+30)*124,y=7+rand(i+35)*26;line([[x,y],[x,y-5]],'#4e845b',1);ellipse(x,y-6,2.5,2.5,i%3?'#e7ce89':'#f0dac7');}
    if(has('mountain')){polygon([[110,-22],[151,-99],[198,-15]],'#6f8a70');polygon([[151,-99],[163,-74],[150,-79],[141,-73]],'#e6e6cb');polygon([[151,-99],[151,-23],[198,-15]],'#536e60');}
    if(has('lava'))volcano(has('mountain')?190:147,-3,has('mountain')?.57:.79);
    else{polygon([[143,2],[155,-16],[172,-8],[177,6],[159,10]],'#8f9d78');}
    if(has('crystal')||has('ice'))crystal(98,21,has('crystal')?1:.65);
    if(has('life'))butterflies();
    if(has('phoenix'))phoenix();
    ctx.restore();
  }
  function volcano(x,y,s) {
    ctx.save();ctx.translate(x,y);ctx.scale(s,s);
    polygon([[-43,6],[-18,-54],[13,-58],[43,6]],'#75806a');
    polygon([[-7,-53],[13,-58],[43,6],[11,2]],'#596754');
    ellipse(-2,-54,15,5,'#f4bb77');
    ctx.beginPath();ctx.moveTo(-4,-51);ctx.bezierCurveTo(-8,-34,10,-37,6,-19);ctx.bezierCurveTo(1,-4,20,0,23,7);ctx.strokeStyle='#dc9760';ctx.lineWidth=6;ctx.stroke();
    line([[-3,-51],[-5,-39],[7,-25],[5,-12],[22,7]],'#f5cd88',2);
    for(let i=0;i<8;i++){const p=(time*.22+i/8)%1,xx=-1+Math.sin(p*4+i)*12*p;ellipse(xx,-57-p*52,5+p*12,5+p*8,'rgba(215,220,190,'+((1-p)*.32)+')');}
    for(let i=0;i<6;i++){const p=(time*.6+i/6)%1;ellipse(-2+Math.sin(i*3)*p*30,-57-Math.sin(p*Math.PI)*26,1.8*(1-p),1.8*(1-p),'#f2bf78');}
    ctx.restore();
  }
  function butterflies() {
    for(let i=0;i<5;i++){const x=-76+Math.sin(time*.42+i*2)*81,y=-32+Math.cos(time*.7+i)*17;ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(time+i)*.22);const wing=2+Math.abs(Math.sin(time*7+i))*5;ellipse(-wing*.5,-2,wing,4.8,colors[i],-.3);ellipse(wing*.5,-2,wing,4.8,colors[i],.3);line([[0,-4],[0,4]],'#5c7256',1);ctx.restore();}
  }
  function phoenix() {
    const x=175+Math.sin(time*.32)*65,y=-72+Math.cos(time*.6)*13;
    ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(time*.3)*.15);
    const flap=Math.sin(time*2.5)*9;
    ctx.beginPath();ctx.moveTo(-29,flap-5);ctx.quadraticCurveTo(-15,8,0,0);ctx.quadraticCurveTo(14,7,29,flap-5);ctx.strokeStyle='#c77c4e';ctx.lineWidth=3;ctx.stroke();
    line([[0,0],[7,-9],[12,-7]],'#db9d58',2);
    line([[0,2],[-8,14],[-22,18]],'#ddaa65',2);line([[0,2],[-5,16],[-14,23]],'#e5bd78',1);
    ctx.restore();
  }
  function satellites() {
    if(!has('world'))return;
    [[-302,29,.25],[302,-8,.29]].forEach(([x,y,s],i)=>{
      ctx.save();ctx.translate(x,y+Math.sin(time*.6+i)*6);ctx.scale(s,s);
      polygon([[-95,0],[-49,58],[0,95],[47,54],[100,0]],'#6e917a');ellipse(0,0,100,24,'#b0c397');
      tree(-20,0,.62,i);crystal(43,4,.65);ctx.restore();
    });
  }
  function heavens() {
    if(has('sun')){
      const x=197,y=-114;glow(x,y,67,'#f4d59772');ellipse(x,y,23,23,'#e6c480');ellipse(x-3,y-3,18,18,'#efd396');
      ctx.save();ctx.translate(x,y);ctx.rotate(time*.04);for(let i=0;i<12;i++){const a=i*tau/12;line([[Math.cos(a)*31,Math.sin(a)*31],[Math.cos(a)*36,Math.sin(a)*36]],'#cfb57a',1);}ctx.restore();
    }else{glow(208,-110,40,'#f0dfaf33');}
    if(has('moon')){
      ctx.save();ctx.translate(-230,-115);ctx.rotate(-.2);ctx.beginPath();ctx.arc(0,0,19,-.9,2.4);ctx.quadraticCurveTo(7,10,12,-15);ctx.fillStyle='#faf0ca';ctx.fill();ctx.restore();
      sparkle(-203,-123,4,'#fff4ce');
    }
    if(has('rainbow')){
      for(let i=0;i<5;i++){ctx.beginPath();ctx.ellipse(1,-1,203-i*7,147-i*7,0,Math.PI,0);ctx.strokeStyle=['#d6a18c55','#dac78766','#c4cb8866','#87b7a066','#91b5be66'][i];ctx.lineWidth=5;ctx.stroke();}
    }
    if(has('all')){
      for(let i=0;i<3;i++){ctx.beginPath();for(let x=-300;x<=300;x+=8){const y=-116+Math.sin(x*.01+time*.4+i)*16+i*10;if(x===-300)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.strokeStyle=['#91c8ab55','#d2cc8c55','#9fcac355'][i];ctx.lineWidth=15;ctx.stroke();}
      ctx.save();ctx.rotate(-.16);ctx.beginPath();ctx.ellipse(0,3,278,76,0,0,tau);ctx.strokeStyle='#e4d5a08a';ctx.lineWidth=1;ctx.setLineDash([2,7]);ctx.stroke();ctx.setLineDash([]);
      for(let i=0;i<5;i++){const a=time*.25+i*tau/5;glow(Math.cos(a)*278,Math.sin(a)*76,12,colors[i]+'90');ellipse(Math.cos(a)*278,Math.sin(a)*76,3,3,colors[i]);}ctx.restore();
    }
    if(has('star')||has('all')){
      for(let i=0;i<27;i++){const x=(rand(i+31)-.5)*660,y=-160+rand(i+73)*92;const alpha=.3+(.5+Math.sin(time*1.5+i)*.5)*.55;sparkle(x,y,1+rand(i+18)*2,'#fff5d3',alpha);}
      const p=(time*.08)%1;if(p<.32){const x=-270+p*1300,y=-155+p*190;line([[x,y],[x-41,y-8]],'#f7eacb66',1.5);sparkle(x,y,2.5,'#fff4d0');}
    }
  }
  function render() {
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
    const bg=ctx.createLinearGradient(0,0,0,height);
    if(has('star')){bg.addColorStop(0,'#385e59');bg.addColorStop(.55,'#789b87');bg.addColorStop(1,'#cad8bc');}
    else{bg.addColorStop(0,'#e8ecdc');bg.addColorStop(.45,'#dce6ce');bg.addColorStop(1,'#b5cdb8');}
    ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);
    for(let i=0;i<110;i++){ctx.fillStyle=has('star')?'#eff4da12':'#617e4410';ctx.fillRect(rand(i+29)*width,rand(i+233)*height,1,1);}
    // Distant ridgelines use screen width, keeping the canvas filled at any ratio.
    ctx.beginPath();ctx.moveTo(0,height);for(let x=0;x<=width+30;x+=30)ctx.lineTo(x,height*.78+Math.sin(x*.012)*12+Math.cos(x*.006)*18);ctx.lineTo(width,height);ctx.fillStyle='#71978013';ctx.fill();
    const scale=sceneScale();ctx.save();ctx.translate(width*.5,height*.57);ctx.scale(scale,scale);
    heavens();
    for(let i=0;i<4;i++){const xx=((time*(i%2?3:-2.5)+i*177+410)%820+820)%820-410;cloud(xx,-79+i%2*39,.6+i*.16,.32+i*.04);}
    if(has('cloud')||has('rain'))cloud(-64+Math.sin(time*.18)*16,-117,1.23,has('rain')?.73:.5);
    if(has('rain'))for(let i=0;i<38;i++){const x=-110+rand(i+48)*134,y=-112+((time*75+i*11)%111);line([[x,y],[x-3,y+7]],'#709b9b80',.8);}
    if(has('storm')&&Math.sin(time*.55)> .993){line([[-40,-111],[-53,-86],[-42,-87],[-58,-62]],'#fff3c3',2);}
    satellites();mainIsland();
    // Five elemental lights keep moving even before a discovery.
    for(let i=0;i<5;i++){const a=time*.22+i*tau/5,x=Math.cos(a)*261,y=Math.sin(a)*51+32;glow(x,y,16,colors[i]+'55');ellipse(x,y,3,3,colors[i]);}
    for(let i=0;i<22;i++){const x=Math.sin(time*.13+i*2.3)*276,y=Math.cos(time*.17+i)*63+20,alpha=.15+(Math.sin(time*1.8+i)+1)*.25;glow(x,y,8,'#f1dfa94d');ellipse(x,y,1.2,1.2,'rgba(249,233,177,'+alpha+')');}
    const ctime=performance.now();
    if(ctime<celebrationUntil&&!reduced){const p=1-(celebrationUntil-ctime)/1800;ctx.save();ctx.globalAlpha=Math.max(0,1-p);for(let i=0;i<40;i++){const a=i*tau/40,r=25+p*(110+rand(i)*160);sparkle(Math.cos(a)*r,Math.sin(a)*r*.55-27,2.7,colors[i%5]);}ctx.restore();}
    ctx.restore();
    // Pointer interaction is decorative and never changes game progress.
    rings=rings.filter(r=>ctime-r.birth<1000);
    rings.forEach(r=>{const age=(ctime-r.birth)/1000;ctx.beginPath();ctx.ellipse(r.x,r.y,10+age*38,4+age*12,0,0,tau);ctx.strokeStyle='rgba(245,235,190,'+(1-age)*.55+')';ctx.lineWidth=1;ctx.stroke();});
    trail=trail.filter(p=>ctime-p.birth<750);
    trail.forEach(p=>{const age=(ctime-p.birth)/750;sparkle(p.x,p.y-age*17,2.5*(1-age),'#fff2bc',1-age);});
    if(pointer&&!reduced)glow(pointer.x,pointer.y,32,'#f6e6ae32');
  }
  function animate(timestamp) {
    frame=0;
    if(stopped||document.hidden||!inView||reduced)return;
    if(timestamp-lastFrame>=32){time+=Math.min((timestamp-lastFrame)/1000,.06);lastFrame=timestamp;render();}
    frame=requestAnimationFrame(animate);
  }
  function start() {
    if(reduced){render();return;}
    if(!frame&&!stopped&&!document.hidden&&inView){lastFrame=performance.now();frame=requestAnimationFrame(animate);}
  }
  function stop(){if(frame)cancelAnimationFrame(frame);frame=0;}
  function resize() {
    const box=canvas.getBoundingClientRect();if(box.width<1||box.height<1)return;
    width=box.width;height=box.height;dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    render();start();
  }
  function celebrate() {celebrationUntil=performance.now()+1800;if(reduced)render();else start();}
  function update(discovered) {
    if(!Array.isArray(discovered))return;
    const previous=found.size;found=new Set(discovered);
    const caption=document.getElementById('realm-caption');
    if(caption)caption.textContent=has('all')?'山海与星辰相遇，你亲手创造了万象。':has('life')?'生命已经苏醒。风过树林，蝴蝶带来新的灵感。':has('rain')?'云端落下第一场雨，世界正在悄悄生长。':has('forest')?'新生的树林在风中轻摇。继续发现，点亮整个世界。':'每一种发现，都会让世界多一点生机。';
    if(found.size>previous)celebrate();
    render();start();
  }
  window.addEventListener('wanxiang:state',event=>update(event.detail?.discovered));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else start();});
  function motionChange(e){reduced=e.matches;stop();render();start();}
  if(motionQuery.addEventListener)motionQuery.addEventListener('change',motionChange);else motionQuery.addListener(motionChange);
  canvas.addEventListener('pointermove',e=>{
    const b=canvas.getBoundingClientRect();pointer={x:e.clientX-b.left,y:e.clientY-b.top};
    if(!reduced&&(!trail.length||performance.now()-trail[trail.length-1].birth>32)){trail.push({...pointer,birth:performance.now()});if(trail.length>25)trail.shift();}
  });
  canvas.addEventListener('pointerleave',()=>{pointer=null;});
  canvas.addEventListener('pointerdown',e=>{if(reduced)return;const b=canvas.getBoundingClientRect();rings.push({x:e.clientX-b.left,y:e.clientY-b.top,birth:performance.now()});if(rings.length>5)rings.shift();});
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize',resize);
  if(typeof IntersectionObserver!=='undefined')new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(inView)start();else stop();},{rootMargin:'60px'}).observe(canvas);
  window.WanxiangRealm={celebrate,update,pause(){stopped=true;stop();},resume(){stopped=false;start();}};
  resize();
})();

