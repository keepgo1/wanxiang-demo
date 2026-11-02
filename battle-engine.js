(function(root,factory){
  'use strict';
  const source = root.Wanxiang || (typeof require === 'function' ? require('./engine.js') : null);
  const api = factory(source);
  if(typeof module === 'object' && module.exports) module.exports = api;
  root.WanxiangBattle = api;
})(typeof globalThis !== 'undefined' ? globalThis : this,function(source){
  'use strict';
  if(!source || !source.byId) throw new Error('Load engine.js before battle-engine.js');
  const counters = Object.freeze({metal:'wood',wood:'earth',earth:'water',water:'fire',fire:'metal'});
  const config = {
    metal:['striker','metal','裂金锋',58], wood:['healer','wood','青木回春',51], water:['healer','water','清泉疗愈',55],
    fire:['striker','fire','赤焰冲击',62], earth:['guard','earth','磐石壁垒',36],
    steam:['striker','water','沸腾冲击',60], lava:['striker','fire','地心喷发',43], forest:['guard','wood','林海守护',40],
    clay:['guard','earth','陶土护壁',38], alloy:['guard','metal','合金屏障',42], thunder:['striker','metal','惊雷贯穿',67],
    ice:['guard','water','冰晶护幕',44], sand:['striker','earth','流沙突袭',59], sprout:['healer','wood','新芽复苏',57], mist:['healer','water','雾息滋养',61],
    cloud:['healer','water','云露润泽',60], rain:['healer','water','甘霖复苏',56], crystal:['guard','metal','晶壁折光',46],
    glass:['striker','fire','琉璃光刃',64], storm:['striker','metal','风暴雷鸣',72], ocean:['healer','water','潮汐回响',50],
    life:['healer','wood','生命绽放',59], mountain:['guard','earth','山岳镇守',32], sun:['striker','fire','日轮耀击',63], moon:['healer','water','月华赐福',66],
    rainbow:['healer','wood','虹光祝福',65], phoenix:['striker','fire','凤焰燎原',69], world:['guard','earth','山海之盾',39],
    star:['striker','metal','星陨冲击',73], all:['striker','earth','万象归一',68]
  };
  const stats = Object.create(null);
  for(const element of source.elements){
    const [role,affinity,skill,speed] = config[element.id];
    const t=element.tier;
    stats[element.id]=Object.freeze({
      name:element.name, hp:100+t*22+(role==='guard'?28:role==='healer'?-4:0),
      atk:24+t*5+(role==='striker'?4:role==='guard'?-4:-3),
      def:7+t*2+(role==='guard'?5:role==='striker'?-1:0), speed,
      role,affinity,skill
    });
  }
  function getStats(id){
    if(typeof id!=='string'||!stats[id]) throw new RangeError('Unknown element: '+String(id));
    return {...stats[id]};
  }
  function validate(formation,label){
    if(!Array.isArray(formation)||formation.length!==5) throw new RangeError(label+' formation must contain exactly five slots');
    const seen=new Set();
    for(let i=0;i<5;i++){
      const id=formation[i];
      if(id===null)continue;
      if(typeof id!=='string'||!stats[id]) throw new RangeError(label+' has an unknown element in slot '+i);
      if(seen.has(id)) throw new RangeError(label+' cannot contain duplicate elements');
      seen.add(id);
    }
    if(seen.size<3)throw new RangeError(label+' needs at least three elements');
  }
  function build(formation,side){
    const diversity=new Set(formation.filter(Boolean).map(id=>stats[id].affinity)).size;
    return formation.flatMap((id,slot)=>{
      if(id===null)return [];
      const s=stats[id],maxHp=Math.round(s.hp*(diversity>=3?1.12:1));
      return [{uid:(side==='player'?'p':'e')+slot,elementId:id,slot,maxHp,hp:maxHp,
        atk:Math.round(s.atk*(diversity===5?1.12:1)),def:s.def,speed:s.speed,role:s.role,affinity:s.affinity,
        shield:0,side,skill:s.skill}];
    });
  }
  function simulate(team,enemy,rng=Math.random){
    validate(team,'Player');validate(enemy,'Enemy');
    if(typeof rng!=='function')throw new TypeError('rng must be a function');
    const roll=()=>{const value=rng();if(typeof value!=='number'||!Number.isFinite(value))throw new TypeError('rng must return a finite number');return Math.max(0,Math.min(1-Number.EPSILON,value));};
    const player=build(team,'player'),foes=build(enemy,'enemy'),events=[];
    const live=units=>units.filter(u=>u.hp>0);
    const sort=units=>live(units).sort((a,b)=>b.speed-a.speed||a.slot-b.slot);
    function emit(type,actor,target,amount,round,options={}){
      const e={type,actor:actor.uid,team:actor.side,target:target.uid,targetTeam:target.side,amount,
        critical:false,effect:type,round,hpAfter:target.hp,text:'',...options};
      events.push(e);
    }
    function act(actor,round){
      if(actor.hp<=0)return;
      const allies=actor.side==='player'?player:foes,opponents=actor.side==='player'?foes:player;
      const living=live(opponents);if(!living.length)return;
      const skillTurn=round%3===0;
      if(skillTurn&&actor.role==='healer'){
        const target=live(allies).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp||a.slot-b.slot)[0];
        if(target.hp<target.maxHp){
          const amount=Math.min(target.maxHp-target.hp,Math.round(actor.atk*1.25+12));
          target.hp+=amount;
          emit('heal',actor,target,amount,round,{effect:'heal',skill:actor.skill,text:stats[actor.elementId].name+'施放「'+actor.skill+'」，'+stats[target.elementId].name+'恢复 '+amount+' 生命。'});
          return;
        }
      }
      if(skillTurn&&actor.role==='guard'){
        const frontline=live(allies).filter(u=>u.slot<2);
        const target=(frontline.length?frontline:live(allies)).sort((a,b)=>a.shield-b.shield||a.hp/a.maxHp-b.hp/b.maxHp||a.slot-b.slot)[0];
        const amount=Math.max(0,Math.min(Math.round(target.maxHp*.4)-target.shield,24+actor.def*2));
        if(amount>0){target.shield+=amount;emit('shield',actor,target,amount,round,{effect:'shield',shieldAfter:target.shield,skill:actor.skill,text:stats[actor.elementId].name+'施放「'+actor.skill+'」，为'+stats[target.elementId].name+'提供 '+amount+' 护盾。'});return;}
      }
      const frontline=living.filter(u=>u.slot<2),pool=frontline.length?frontline:living;
      const target=pool[Math.floor(roll()*pool.length)],critical=roll()<.1;
      const advantage=counters[actor.affinity]===target.affinity;
      const burst=skillTurn&&actor.role==='striker';
      const base=Math.max(1,actor.atk*(burst?1.65:1)*(critical?1.4:1)*(advantage?1.3:1)-target.def*.65);
      const damage=Math.max(1,Math.round(base*(target.slot<2?.85:1)));
      const absorbed=Math.min(target.shield,damage);target.shield-=absorbed;
      const amount=Math.min(target.hp,Math.max(0,damage-absorbed));target.hp-=amount;
      const effect=burst?'skill':advantage?'counter':critical?'critical':'normal';
      emit('attack',actor,target,amount,round,{critical,effect,advantage,absorbed,shieldAfter:target.shield,skill:burst?actor.skill:null,
        text:stats[actor.elementId].name+(burst?'施放「'+actor.skill+'」':'攻击')+' → '+stats[target.elementId].name+'，造成 '+amount+' 伤害'+(advantage?'（五行克制）':'')+(critical?'（暴击）':'')+(absorbed?'，护盾吸收 '+absorbed:'')+(target.hp===0?'，目标退场。':'。')});
    }
    let rounds=0;
    for(let round=1;round<=20;round++){
      if(!live(player).length||!live(foes).length)break;
      rounds=round;
      const p=sort(player),e=sort(foes);
      const playerFirst=p[0].speed>e[0].speed||(p[0].speed===e[0].speed&&round%2===1);
      const first=playerFirst?p:e,second=playerFirst?e:p;
      // Each side's speed ordering is preserved; alternating sides avoids a full-team opening volley.
      for(let i=0;i<Math.max(first.length,second.length);i++){
        if(first[i])act(first[i],round);
        if(!live(player).length||!live(foes).length)break;
        if(second[i])act(second[i],round);
        if(!live(player).length||!live(foes).length)break;
      }
    }
    const ratio=units=>units.reduce((n,u)=>n+u.hp,0)/units.reduce((n,u)=>n+u.maxHp,0);
    const pRatio=ratio(player),eRatio=ratio(foes);
    const winner=Math.abs(pRatio-eRatio)<1e-10?'draw':pRatio>eRatio?'player':'enemy';
    const representative=(winner==='enemy'?live(foes):live(player))[0]||player[0];
    emit('end',representative,representative,0,rounds,{effect:winner==='draw'?'draw':'victory',winner,text:winner==='draw'?'战斗结束：双方势均力敌。':(winner==='player'?'我方获胜！':'敌方获胜。')+(rounds===20?'已达到20回合，按剩余生命比例判定。':'')});
    const snapshot=units=>units.map(({uid,elementId,slot,maxHp,hp,atk,def,speed,role,affinity,shield})=>({uid,elementId,slot,maxHp,hp,atk,def,speed,role,affinity,shield}));
    return {winner,rounds,events,player:snapshot(player),enemy:snapshot(foes)};
  }
  return Object.freeze({getStats,simulate});
});
