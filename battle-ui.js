/* Element battle replay UI. Pure presentation: settlement belongs to the caller. */
(function (root) {
  'use strict';
  const active = new WeakMap();
  const esc = text => String(text ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number = (n, fallback = 0) => Number.isFinite(Number(n)) ? Number(n) : fallback;
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const glyphs = {
    metal: '<path d="m32 7 21 17-9 28H20L11 24Z"/><path d="m11 24 21 8 21-8M32 7v45M20 52l12-20 12 20"/>',
    wood: '<path d="M32 57V29M32 37C12 38 8 24 11 12c17-2 26 9 21 25ZM32 29C30 12 42 7 54 10c2 14-5 24-22 19Z"/><path d="m17 20 15 17M46 17 32 29"/>',
    water: '<path d="M32 7C26 19 13 29 13 41a19 19 0 0 0 38 0C51 29 38 19 32 7Z"/><path d="M22 37c-4 9 1 13 8 15"/>',
    fire: '<path d="M34 6c3 15-7 18-4 29 8-2 11-10 10-17 13 13 17 26 7 35-10 9-30 6-34-8-3-10 4-22 12-29-3 14 0 18 5 19"/><path d="M32 36c-11 13-8 20 1 21 10-1 12-9 4-17"/>',
    earth: '<path d="m5 47 18-29 15 19 7-12 15 22Z"/><path d="m17 28 6 4 6-4M12 54h41M22 59h22"/>',
    star: '<path d="m32 5 8 19 19 8-19 8-8 19-8-19L5 32l19-8Z"/><circle cx="32" cy="32" r="11"/>'
  };
  function family(value, id) {
    const aliases = {'金':'metal','木':'wood','水':'water','火':'fire','土':'earth'};
    const key = aliases[value] || String(value || '').toLowerCase();
    if (glyphs[key]) return key;
    if (glyphs[id]) return id;
    if (['steam','ice','mist','cloud','rain','ocean'].includes(id)) return 'water';
    if (['lava','sun','phoenix'].includes(id)) return 'fire';
    if (['forest','sprout','life'].includes(id)) return 'wood';
    if (['sand','clay','mountain','world'].includes(id)) return 'earth';
    if (['alloy','glass','crystal','moon'].includes(id)) return 'metal';
    return 'star';
  }
  function art(unit) {
    const id = unit.elementId;
    const icon = glyphs[family(unit.affinity, id)];
    return '<svg class="battle-symbol" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + icon + '</svg>';
  }
  function play(result, container, onDone) {
    if (typeof container === 'string') container = document.querySelector(container);
    if (!container || typeof container.querySelector !== 'function') throw new TypeError('WanxiangBattleUI.play requires a battle container.');
    active.get(container)?.dispose();
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
    const byId = root.Wanxiang?.byId || {};
    const teams = {player: Array.isArray(result?.player) ? result.player : [], enemy: Array.isArray(result?.enemy) ? result.enemy : []};
    const units = new Map();
    const elements = new Map();
    const events = Array.isArray(result?.events) ? result.events : [];
    let cursor = 0, rate = 1, mainTimer = null, complete = false, disposed = false;
    const timers = new Set();
    const later = (fn, delay) => { const timer=setTimeout(()=>{timers.delete(timer);if(!disposed)fn();},delay);timers.add(timer);return timer; };
    for (const team of ['player','enemy']) {
      for (const source of teams[team]) {
        const maxHp = Math.max(1, number(source.maxHp, 100));
        units.set(String(source.uid), {...source, uid:String(source.uid), team, maxHp, currentHp:maxHp, shield:0, finalShield:Math.max(0,number(source.shield)), finalHp:clamp(number(source.hp, maxHp),0,maxHp)});
      }
    }
    function unitCard(source) {
      if (!source) return '<div class="battle-empty-slot" aria-hidden="true"><span>◇</span></div>';
      const unit = units.get(String(source.uid)), element = byId[unit.elementId] || {};
      const color = /^#[\da-f]{3,8}$/i.test(element.color || '') ? element.color : unit.team === 'player' ? '#759d78' : '#b88773';
      const name = element.name || unit.elementId || '元素';
      const role = ({tank:'守护',guard:'守护',support:'辅助',healer:'治疗',damage:'输出',dps:'输出',striker:'强攻',mage:'术士',assassin:'突袭'})[unit.role] || unit.role || '元素';
      return '<div class="battle-unit" data-uid="'+esc(unit.uid)+'" style="--unit-color:'+color+'" aria-label="'+esc(name)+'，生命 '+unit.maxHp+'/'+unit.maxHp+'"><div class="battle-unit-meta"><span>'+esc(role)+'</span><b>'+(number(unit.slot)+1)+'</b></div><div class="battle-unit-art"><div class="battle-art-halo"></div>'+art(unit)+'<i class="battle-shield-mark" hidden>◇ <span>0</span></i></div><strong class="battle-unit-name">'+esc(name)+'</strong><div class="battle-hp-track"><i class="battle-hp-lag"></i><i class="battle-hp-fill"></i></div><div class="battle-hp-label"><span>'+unit.maxHp+'</span><small>/ '+unit.maxHp+'</small></div><div class="battle-unit-floats" aria-hidden="true"></div><span class="battle-fallen-tag" hidden>已退场</span></div>';
    }
    function row(team, positions, name) {
      return '<div class="battle-row '+name+'">'+positions.map(slot=>unitCard(teams[team].find(u=>number(u.slot,-1)===slot))).join('')+'</div>';
    }
    container.innerHTML = '<div class="battle-replay'+(reduced?' battle-reduced':'')+'" style="--battle-rate:1"><div class="battle-toolbar"><div><span class="battle-eyebrow">ELEMENTAL CLASH</span><h3>五行交锋 <small class="battle-round">第 1 回合</small></h3></div><div class="battle-controls"><div class="battle-speed" aria-label="回放速度"><button data-speed="1" class="active" aria-pressed="true">1×</button><button data-speed="2" aria-pressed="false">2×</button><button data-speed="3" aria-pressed="false">3×</button></div><button class="battle-skip" data-finish>跳过战斗 ↗</button></div></div><div class="battle-field"><div class="battle-arena-rings" aria-hidden="true"></div><div class="battle-team battle-enemy"><div class="battle-team-label"><i></i><span>对手阵容</span><b class="battle-enemy-alive">'+teams.enemy.length+'</b></div>'+row('enemy',[2,3,4],'battle-back')+row('enemy',[0,1],'battle-front')+'</div><div class="battle-divider"><span>✧</span><i></i><b>五行相生 · 亦相克</b><i></i><span>✧</span></div><div class="battle-team battle-player">'+row('player',[0,1],'battle-front')+row('player',[2,3,4],'battle-back')+'<div class="battle-team-label"><i></i><span>我的阵容</span><b class="battle-player-alive">'+teams.player.length+'</b></div></div><div class="battle-fx-layer" aria-hidden="true"></div><div class="battle-result-host"></div></div><div class="battle-commentary" role="status" aria-live="polite"><span class="battle-commentary-dot"></span><p>五行灵气汇聚，交锋即将开始。</p><span class="battle-event-count">0 / '+events.length+'</span></div></div>';
    const replay = container.querySelector('.battle-replay');
    const field = container.querySelector('.battle-field');
    const fx = container.querySelector('.battle-fx-layer');
    const commentary = container.querySelector('.battle-commentary p');
    const round = container.querySelector('.battle-round');
    const counter = container.querySelector('.battle-event-count');
    const resultHost = container.querySelector('.battle-result-host');
    container.querySelectorAll('.battle-unit').forEach(el=>elements.set(el.dataset.uid,el));
    function setHealth(uid, value) {
      const unit=units.get(String(uid)), el=elements.get(String(uid));if(!unit||!el)return;
      unit.currentHp=clamp(number(value,unit.currentHp),0,unit.maxHp);
      const percent=unit.currentHp/unit.maxHp*100;
      el.querySelector('.battle-hp-fill').style.width=percent+'%';
      el.querySelector('.battle-hp-lag').style.width=percent+'%';
      el.querySelector('.battle-hp-label span').textContent=Math.ceil(unit.currentHp);
      el.classList.toggle('battle-low-hp',percent>0&&percent<30);
      el.classList.toggle('battle-fallen',unit.currentHp<=0);
      el.querySelector('.battle-fallen-tag').hidden=unit.currentHp>0;
      el.setAttribute('aria-label',(byId[unit.elementId]?.name||unit.elementId)+'，生命 '+Math.ceil(unit.currentHp)+'/'+unit.maxHp);
      for(const team of ['player','enemy'])container.querySelector('.battle-'+team+'-alive').textContent=[...units.values()].filter(u=>u.team===team&&u.currentHp>0).length;
    }
    function pulse(el, cls, ms=330) {
      if(!el)return;el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);later(()=>el.classList.remove(cls),ms/rate);
    }
    function floatNumber(el, text, type, critical=false) {
      if(!el)return;const label=document.createElement('span');label.className='battle-float '+type+(critical?' critical':'');label.textContent=text;el.querySelector('.battle-unit-floats').append(label);later(()=>label.remove(),800/rate);
    }
    function center(el) {
      const base=field.getBoundingClientRect(),box=el.getBoundingClientRect();
      return {x:box.left-base.left+box.width/2,y:box.top-base.top+box.height*.42};
    }
    function ray(actor,target,type,unit) {
      if(!actor||!target)return;
      const from=center(actor),to=center(target),color=type==='heal'?'#9acb85':type==='shield'?'#b3cfe0':byId[unit?.elementId]?.color||'#ddc78e';
      if(!reduced&&actor!==target){
        const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),path=document.createElementNS(ns,'path');
        svg.setAttribute('class','battle-beam');svg.setAttribute('viewBox','0 0 '+field.clientWidth+' '+field.clientHeight);
        svg.style.color=color;
        const bend=(from.x+to.x)/2+(type==='heal'?42:-30);
        path.setAttribute('d','M '+from.x+' '+from.y+' Q '+bend+' '+((from.y+to.y)/2)+' '+to.x+' '+to.y);
        path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width',type==='shield'?'2':'3');path.setAttribute('pathLength','100');
        svg.append(path);fx.append(svg);later(()=>svg.remove(),350/rate);
      }
      const impact=document.createElement('i');impact.className='battle-impact '+type;impact.style.left=to.x+'px';impact.style.top=to.y+'px';impact.style.setProperty('--impact-color',color);fx.append(impact);later(()=>impact.remove(),550/rate);
      if(!reduced)for(let i=0;i<7;i++){
        const particle=document.createElement('i');particle.className='battle-spark';particle.style.left=to.x+'px';particle.style.top=to.y+'px';particle.style.background=color;particle.style.setProperty('--spark-x',Math.cos(i*Math.PI*2/7)*(19+i%3*9)+'px');particle.style.setProperty('--spark-y',Math.sin(i*Math.PI*2/7)*(19+i%3*9)+'px');fx.append(particle);later(()=>particle.remove(),500/rate);
      }
    }
    function apply(event) {
      const actorUnit=units.get(String(event.actor)),targetUnit=units.get(String(event.target));
      const actor=elements.get(String(event.actor)),target=elements.get(String(event.target));
      const amount=Math.max(0,number(event.amount));
      if(Number.isFinite(Number(event.round)))round.textContent='第 '+Math.max(1,Number(event.round))+' 回合';
      commentary.textContent=event.text||({attack:'元素灵力碰撞！',heal:'治愈之光降临。',shield:'护盾已展开。',end:'交锋结束。'}[event.type]||'灵力正在流转。');
      pulse(actor,'battle-acting');
      if(event.type==='attack'){
        ray(actor,target,'attack',actorUnit);pulse(actor,'battle-lunge');pulse(target,'battle-hit');
        if(targetUnit)setHealth(targetUnit.uid,Number.isFinite(Number(event.hpAfter))?Number(event.hpAfter):targetUnit.currentHp-amount);
        floatNumber(target,(event.critical?'暴击 ':'−')+Math.round(amount),'damage',!!event.critical);
        if(targetUnit){if(Number.isFinite(event.shieldAfter))targetUnit.shield=Math.max(0,event.shieldAfter);else if(Number.isFinite(event.absorbed))targetUnit.shield=Math.max(0,targetUnit.shield-event.absorbed);setShield(targetUnit);}
      }else if(event.type==='heal'){
        ray(actor,target,'heal',actorUnit);pulse(target,'battle-healed',450);
        if(targetUnit)setHealth(targetUnit.uid,Number.isFinite(Number(event.hpAfter))?Number(event.hpAfter):targetUnit.currentHp+amount);
        floatNumber(target,'+'+Math.round(amount),'heal');
      }else if(event.type==='shield'){
        const recipient=targetUnit||actorUnit,el=target||actor;
        ray(actor,el,'shield',actorUnit);pulse(el,'battle-guarded',450);
        if(recipient){recipient.shield=Number.isFinite(event.shieldAfter)?Math.max(0,event.shieldAfter):recipient.shield+amount;setShield(recipient);}
        floatNumber(el,'护盾 +'+Math.round(amount),'shield');
      }
    }
    function setShield(unit) {
      const el=elements.get(unit.uid);if(!el)return;
      const badge=el.querySelector('.battle-shield-mark');badge.hidden=unit.shield<=0;badge.querySelector('span').textContent=Math.ceil(unit.shield);
    }
    function cancelTimers() {if(mainTimer!==null)clearTimeout(mainTimer);mainTimer=null;timers.forEach(clearTimeout);timers.clear();}
    function finish() {
      if(disposed||complete)return;
      complete=true;cancelTimers();fx.replaceChildren();
      for(const [uid,unit] of units){setHealth(uid,unit.finalHp);unit.shield=unit.finalShield;setShield(unit);}
      elements.forEach(el=>{el.classList.remove('battle-acting','battle-lunge','battle-hit','battle-healed','battle-guarded');el.querySelector('.battle-unit-floats').replaceChildren();});
      const winner=result?.winner||'draw',won=winner==='player',draw=winner==='draw';
      const title=won?'万象共鸣 · 胜利':draw?'势均力敌 · 平局':'灵力未尽 · 再战';
      const subtitle=won?'你的元素阵容赢得了这场交锋。':draw?'双方的力量在此刻达成平衡。':'调整站位与五行搭配，下一次会有新的可能。';
      resultHost.innerHTML='<div class="battle-result '+(won?'victory':draw?'draw':'defeat')+'"><div class="battle-result-emblem" aria-hidden="true"><span>'+ (won?'✦':draw?'◇':'✧')+'</span><i></i><i></i></div><span class="battle-eyebrow">'+(won?'VICTORY':draw?'DRAW':'KEEP EXPLORING')+'</span><h3>'+title+'</h3><p>'+subtitle+'</p><div class="battle-result-rounds">'+Math.max(0,number(result?.rounds))+' <span>回合交锋</span></div></div>';
      commentary.textContent=won?'你的阵容取得胜利，继续挑战更强的对手吧。':draw?'战斗以平局结束。':'本次交锋结束，可以调整阵容再试。';
      round.textContent='战斗结束';counter.textContent=events.length+' / '+events.length;
      container.querySelector('[data-finish]').disabled=true;
      container.querySelectorAll('[data-speed]').forEach(b=>b.disabled=true);
      if(typeof onDone==='function')onDone();
    }
    function tick() {
      if(disposed||complete)return;
      if(cursor>=events.length){finish();return;}
      apply(events[cursor++]);counter.textContent=cursor+' / '+events.length;
      mainTimer=setTimeout(tick,450/rate);
    }
    function click(event) {
      const button=event.target.closest('button');if(!button||!container.contains(button))return;
      if(button.hasAttribute('data-finish'))finish();
      if(button.dataset.speed&&!complete&&!disposed){
        rate=clamp(number(button.dataset.speed,1),1,3);replay.style.setProperty('--battle-rate',rate);
        container.querySelectorAll('[data-speed]').forEach(b=>{const selected=Number(b.dataset.speed)===rate;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});
        if(mainTimer!==null)clearTimeout(mainTimer);mainTimer=setTimeout(tick,450/rate);
      }
    }
    container.addEventListener('click',click);
    function dispose() {
      if(disposed)return;disposed=true;cancelTimers();container.removeEventListener('click',click);fx.replaceChildren();
      if(active.get(container)===api)active.delete(container);
    }
    const api={dispose,finish};active.set(container,api);
    mainTimer=setTimeout(tick,250);
    return api;
  }
  root.WanxiangBattleUI=Object.freeze({play});
})(typeof window!=='undefined'?window:globalThis);




