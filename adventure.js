(function (root, factory) {
  'use strict';
  const core = typeof module === 'object' && module.exports ? require('./engine.js') : root.Wanxiang;
  const api = factory(core);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.WanxiangAdventure = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (core) {
  'use strict';
  if (!core || !core.elements) throw new Error('Load engine.js before adventure.js');
  const { elements, byId } = core;
  const baseIds = ['metal', 'wood', 'water', 'fire', 'earth'];
  const tierPrices = [40, 90, 220, 500];
  const prices = Object.create(null);
  const shopStock = elements.map(e => {
    const price = tierPrices[e.tier];
    prices[e.id] = price;
    return Object.freeze({ ...e, price, sellPrice: Math.floor(price * 0.35), requiredClears: e.tier < 2 ? 0 : e.tier === 2 ? 2 : 4 });
  });
  Object.freeze(prices);
  Object.freeze(shopStock);
  const stockById = Object.fromEntries(shopStock.map(e => [e.id, e]));
  const stages = Object.freeze([
    { id: 0, name: '青芽林地', desc: '三位本源守卫，检验你的第一支元素小队。', enemy: ['wood', 'water', 'earth', null, null], rewardGold: 80, rewardItem: 'sprout', unlockAfter: -1 },
    { id: 1, name: '五行石阵', desc: '完整五行阵容。调整站位，找到克制的突破口。', enemy: ['fire', 'metal', 'wood', 'water', 'earth'], rewardGold: 120, rewardItem: 'lava', unlockAfter: 0 },
    { id: 2, name: '雾泽回廊', desc: '自然元素交织，雾与雷封锁了前路。', enemy: ['steam', 'thunder', 'forest', 'ice', 'mist'], rewardGold: 160, rewardItem: 'cloud', unlockAfter: 1 },
    { id: 3, name: '晶岳边境', desc: '水晶与山岳镇守关口，需要更成熟的组合。', enemy: ['crystal', 'mountain', 'rain', 'alloy', 'thunder'], rewardGold: 200, rewardItem: 'crystal', unlockAfter: 2 },
    { id: 4, name: '日月之门', desc: '昼夜同时降临，奇观元素在门前列阵。', enemy: ['sun', 'moon', 'storm', 'ocean', 'life'], rewardGold: 240, rewardItem: 'star', unlockAfter: 3 },
    { id: 5, name: '万象守卫', desc: '世界与星辰共鸣，迎接最终的造物试炼。', enemy: ['world', 'star', 'storm', 'phoenix', 'mountain'], rewardGold: 280, rewardItem: 'world', unlockAfter: 4 }
  ].map(s => Object.freeze({ ...s, enemy: Object.freeze(s.enemy) })));
  const quests = Object.freeze([
    { id: 0, title: '初探万物', desc: '累计发现 8 种元素', gold: 80, energy: 60 },
    { id: 1, title: '熟练造物', desc: '成功完成 3 次融合', gold: 100, energy: 80 },
    { id: 2, title: '旗开得胜', desc: '赢得第一场元素对战', gold: 120, energy: 80 },
    { id: 3, title: '远征先锋', desc: '首次通关 3 个不同关卡', gold: 180, energy: 100 },
    { id: 4, title: '生命之光', desc: '永久发现「生命」元素', gold: 220, energy: 120 },
    { id: 5, title: '万象征服者', desc: '首次通关全部 6 个关卡', gold: 350, energy: 200 }
  ].map(q => Object.freeze(q)));
  const int = (v, fallback = 0, max = 1000000000) => typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.min(Math.floor(v), max) : fallback;
  const known = id => typeof id === 'string' && Boolean(byId[id]);
  const discoveryList = value => Array.isArray(value) ? [...new Set(value.filter(known))] : [];
  function fresh() {
    return { version: 1, gold: 300, formation: [...baseIds], cleared: [], wins: 0, battles: 0, claimed: [], inventory: Object.fromEntries(baseIds.map(id => [id, 2])), logs: [] };
  }
  function normalize(saved) {
    const state = fresh();
    if (!saved || typeof saved !== 'object' || Array.isArray(saved) || saved.version !== 1) return state;
    state.gold = int(saved.gold, 300);
    const cleared = new Set(Array.isArray(saved.cleared) ? saved.cleared : []);
    for (let i = 0; i < stages.length && cleared.has(i); i++) state.cleared.push(i);
    state.wins = Math.max(int(saved.wins), state.cleared.length);
    state.battles = Math.max(int(saved.battles), state.wins);
    state.claimed = [...new Set(Array.isArray(saved.claimed) ? saved.claimed.filter(id => Number.isInteger(id) && id >= 0 && id < quests.length) : [])];
    if (Array.isArray(saved.formation) && saved.formation.length <= 5) {
      const ids = saved.formation.filter(id => id !== null);
      if (ids.length >= 3 && ids.every(known) && new Set(ids).size === ids.length) state.formation = [...saved.formation, ...Array(5 - saved.formation.length).fill(null)];
    }
    if (saved.inventory && typeof saved.inventory === 'object' && !Array.isArray(saved.inventory)) {
      state.inventory = {};
      for (const e of elements) {
        const amount = int(saved.inventory[e.id], 0, 1000000);
        if (amount) state.inventory[e.id] = amount;
      }
    }
    state.logs = Array.isArray(saved.logs) ? saved.logs.filter(l => l && typeof l.text === 'string').slice(-40).map(l => ({ text: l.text.slice(0, 200).replace(/[<>]/g, ''), time: int(l.time, 0, Number.MAX_SAFE_INTEGER) })) : [];
    return state;
  }
  class Game {
    constructor(saved) { this.state = normalize(saved); }
    log(text) {
      this.state.logs.push({ text, time: Date.now() });
      if (this.state.logs.length > 40) this.state.logs.splice(0, this.state.logs.length - 40);
    }
    setFormation(array, discovered) {
      if (!Array.isArray(array) || array.length > 5 || array.length < 3) return false;
      const ids = array.filter(id => id !== null), owned = discoveryList(discovered);
      if (ids.length < 3 || new Set(ids).size !== ids.length || !ids.every(id => known(id) && owned.includes(id))) return false;
      this.state.formation = [...array, ...Array(5 - array.length).fill(null)];
      return true;
    }
    availableStages() { return stages.filter(s => s.unlockAfter === -1 || this.state.cleared.includes(s.unlockAfter)).map(s => s.id); }
    buy(id, discovered) {
      if (!known(id)) return { ok: false, reason: '不存在这个元素' };
      const stock = stockById[id];
      if (this.state.cleared.length < stock.requiredClears) return { ok: false, reason: '首次通关 ' + stock.requiredClears + ' 个关卡后开放该商品' };
      if (this.state.gold < stock.price) return { ok: false, reason: '金币不足' };
      this.state.gold -= stock.price;
      this.state.inventory[id] = (this.state.inventory[id] || 0) + 1;
      this.log('购入「' + byId[id].name + '」碎片 ×1，金币 -' + stock.price);
      return { ok: true, isNew: !discoveryList(discovered).includes(id), id };
    }
    sell(id) {
      if (!known(id) || !(this.state.inventory[id] > 0)) return false;
      this.state.inventory[id] -= 1;
      this.state.gold += stockById[id].sellPrice;
      this.log('出售「' + byId[id].name + '」碎片 ×1，金币 +' + stockById[id].sellPrice);
      return true;
    }
    recordBattle(stageId, won) {
      if (!Number.isInteger(stageId) || !this.availableStages().includes(stageId) || typeof won !== 'boolean') return { ok: false, gold: 0, reason: '关卡未开放或结算无效' };
      const stage = stages[stageId];
      this.state.battles += 1;
      if (!won) {
        this.state.gold += 10;
        this.log('挑战「' + stage.name + '」失利，补给金币 +10');
        return { ok: true, gold: 10, firstClear: false };
      }
      const firstClear = !this.state.cleared.includes(stageId);
      const gold = firstClear ? stage.rewardGold : 20 + stageId * 10;
      const item = firstClear ? stage.rewardItem : baseIds[stageId % baseIds.length];
      if (firstClear) this.state.cleared.push(stageId);
      this.state.wins += 1;
      this.state.gold += gold;
      this.state.inventory[item] = (this.state.inventory[item] || 0) + 1;
      this.log((firstClear ? '首次通关' : '再次通关') + '「' + stage.name + '」，金币 +' + gold + '，' + byId[item].name + '碎片 ×1');
      return { ok: true, gold, item, firstClear };
    }
    questProgress(id, baseState) {
      if (!Number.isInteger(id) || id < 0 || id >= quests.length) return { value: 0, target: 1, done: false };
      const discovered = discoveryList(baseState && baseState.discovered);
      const values = [discovered.length, int(baseState && baseState.fusions), this.state.wins, this.state.cleared.length, discovered.includes('life') ? 1 : 0, this.state.cleared.length];
      const target = [8, 3, 1, 3, 1, 6][id];
      const value = Math.min(target, values[id]);
      return { value, target, done: value >= target };
    }
    claimQuest(id, baseState) {
      if (!Number.isInteger(id) || id < 0 || id >= quests.length || this.state.claimed.includes(id) || !this.questProgress(id, baseState).done) return { ok: false, gold: 0, energy: 0 };
      const quest = quests[id];
      this.state.claimed.push(id);
      this.state.gold += quest.gold;
      this.log('完成任务「' + quest.title + '」，金币 +' + quest.gold + '，灵气 +' + quest.energy);
      return { ok: true, gold: quest.gold, energy: quest.energy };
    }
  }
  return Object.freeze({ Game, stages, quests, shopStock, prices });
});
