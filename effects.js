(function(){
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
  const overlay=document.createElement('div');overlay.id='ritual-overlay';overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','五行唤灵动画');
  overlay.innerHTML='<div class="ritual-stars"></div><div class="ritual-scene"><div class="ritual-ring r1"></div><div class="ritual-ring r2"></div><div class="ritual-ring r3"></div><div class="ritual-core">◈</div>'+['金','木','水','火','土'].map((x,i)=>'<div class="ritual-orb" style="--i:'+i+';--tone:'+['#e9ca81','#9aca88','#8bc5e0','#f5a579','#c9bc97'][i]+'"><span>'+x+'</span></div>').join('')+'<div class="ritual-beam"></div></div><div class="ritual-copy">五行汇聚 · 灵感将至</div><button id="skip-ritual">跳过动画 →</button>';
  document.body.append(overlay);
  let finish;
  window.WanxiangEffects={summon(){return new Promise(resolve=>{if(reduce.matches){resolve();return;}const focused=document.activeElement;const background=[document.querySelector('.shell'),document.querySelector('body>aside')];background.forEach(e=>{if(e)e.inert=true;});overlay.hidden=false;document.getElementById('skip-ritual').focus();overlay.classList.remove('playing');void overlay.offsetWidth;overlay.classList.add('playing');let done=false;const timer=setTimeout(end,1700);function end(){if(done)return;done=true;clearTimeout(timer);overlay.hidden=true;background.forEach(e=>{if(e)e.inert=false;});focused?.focus();finish=null;resolve();}finish=end;});}};
  document.getElementById('skip-ritual').onclick=()=>finish?.();
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&finish)finish();});
  const stage=document.querySelector('.fusion-stage');
  if(stage){stage.insertAdjacentHTML('beforeend','<div class="fusion-vortex">'+Array.from({length:18},(_,i)=>'<i style="--a:'+i*20+'deg;--d:'+i*.028+'s"></i>').join('')+'</div><div class="fusion-flash"></div>');}
})();
