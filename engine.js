(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.Wanxiang = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const rows = [
    ['metal', '金', 'METAL', 0, '#B89349', '藏在山脉深处的一线锋芒。', null],
    ['wood', '木', 'WOOD', 0, '#658C64', '一枝新绿，孕育万物生机。', null],
    ['water', '水', 'WATER', 0, '#548EAB', '无定形，却能穿过最坚硬的时光。', null],
    ['fire', '火', 'FIRE', 0, '#CD7251', '一簇跃动的光，唤醒沉睡的世界。', null],
    ['earth', '土', 'EARTH', 0, '#A88460', '沉默的大地，承载所有可能。', null],
    ['steam', '蒸汽', 'STEAM', 1, '#83A7AD', '当水遇见热情，它决定向天空出发。', ['water', 'fire']],
    ['lava', '熔岩', 'LAVA', 1, '#C76746', '大地的心跳，炽热而缓慢。', ['fire', 'earth']],
    ['forest', '森林', 'FOREST', 1, '#487C5A', '树与树相遇，便有了风的回声。', ['wood', 'wood']],
    ['clay', '陶土', 'CLAY', 1, '#AC7A62', '柔软的土壤，等待被赋予形状。', ['water', 'earth']],
    ['alloy', '合金', 'ALLOY', 1, '#959A83', '金石相契，锻出新的坚韧。', ['metal', 'earth']],
    ['thunder', '雷', 'THUNDER', 1, '#AD91BC', '金属与火光碰撞，天空有了声音。', ['metal', 'fire']],
    ['ice', '冰', 'ICE', 1, '#80AFBF', '两滴水相拥，把流动凝成永恒。', ['water', 'water']],
    ['sand', '沙', 'SAND', 1, '#C2A367', '大地磨碎了棱角，学会随风旅行。', ['earth', 'earth']],
    ['sprout', '新芽', 'SPROUT', 1, '#7A9D5C', '水润木生，第一片叶子舒展开来。', ['wood', 'water']],
    ['mist', '雾', 'MIST', 1, '#94ACAC', '轻盈的水，替远山披上薄纱。', ['steam', 'water']],
    ['cloud', '云', 'CLOUD', 2, '#93A5BD', '雾与蒸汽在高处相逢，写下天空的形状。', ['mist', 'steam']],
    ['rain', '雨', 'RAIN', 2, '#598BA1', '云寄给大地的一封长信。', ['cloud', 'water']],
    ['crystal', '水晶', 'CRYSTAL', 2, '#A48CB7', '冰的秩序，被大地永久珍藏。', ['ice', 'earth']],
    ['glass', '琉璃', 'GLASS', 2, '#66A49B', '细沙穿过火焰，成为光的容器。', ['sand', 'fire']],
    ['storm', '风暴', 'STORM', 2, '#7B7DB1', '雷声走入云海，掀起天地的波澜。', ['thunder', 'cloud']],
    ['ocean', '海洋', 'OCEAN', 2, '#3C83A0', '无数场雨，终于汇成一片蔚蓝。', ['rain', 'water']],
    ['life', '生命', 'LIFE', 2, '#6F9C64', '新芽沐雨，世界第一次有了呼吸。', ['sprout', 'rain']],
    ['mountain', '山岳', 'MOUNTAIN', 2, '#858D70', '熔岩冷却后，留下大地的脊梁。', ['earth', 'lava']],
    ['sun', '太阳', 'SUN', 2, '#D3A250', '火焰借水晶聚光，点亮一轮新日。', ['fire', 'crystal']],
    ['moon', '月亮', 'MOON', 2, '#939DBD', '冷光凝于金石，照亮漫长的夜。', ['ice', 'alloy']],
    ['rainbow', '虹', 'RAINBOW', 3, '#AC8AAB', '阳光穿过雨幕，留下七色的约定。', ['sun', 'rain']],
    ['phoenix', '凤凰', 'PHOENIX', 3, '#CC795D', '生命拥抱烈火，从灰烬中展翼。', ['fire', 'life']],
    ['world', '世界', 'WORLD', 3, '#5D9689', '山海相连，一颗星球有了归处。', ['ocean', 'mountain']],
    ['star', '星辰', 'STAR', 3, '#A78D56', '日月的余辉，散落为无尽星光。', ['sun', 'moon']],
    ['all', '万象', 'ALL THINGS', 3, '#B89650', '世界仰望星辰，万物在此相生。', ['world', 'star']]
  ];
  const elements = Object.freeze(rows.map(([id, name, en, tier, color, desc, recipe]) => Object.freeze({
    id, name, en, tier, color, desc, recipe: recipe ? Object.freeze(recipe) : null
  })));
  const byId = Object.create(null);
  for (const element of elements) byId[element.id] = element;
  Object.freeze(byId);
  const base = elements.filter(e => e.tier === 0).map(e => e.id);
  const rare = elements.filter(e => e.tier === 1).map(e => e.id);
  const recipeKey = (a, b) => [a, b].sort().join('|');
  const recipes = new Map(elements.filter(e => e.recipe).map(e => [recipeKey(...e.recipe), e.id]));
  const rewards = [120, 180, 240, 400];
  const names = ['初识五行', '万物生长', '生命之始', '万象归一'];
  const int = (n, fallback, max = 1000000000) => typeof n === 'number' && Number.isFinite(n) && n >= 0 ? Math.min(max, Math.floor(n)) : fallback;
  function freshState() {
    return { version: 1, energy: 400, discovered: [...base], pity: 0, draws: 0, fusions: 0, claimed: [], logs: [], lastGather: 0 };
  }
  function sanitize(saved) {
    const initial = freshState();
    if (!saved || typeof saved !== 'object' || Array.isArray(saved) || saved.version !== 1) return initial;
    const discovered = [...new Set([...base, ...(Array.isArray(saved.discovered) ? saved.discovered.filter(id => typeof id === 'string' && byId[id]) : [])])];
    const logs = Array.isArray(saved.logs) ? saved.logs.filter(l => l && typeof l === 'object' && typeof l.text === 'string').slice(-40).map(l => ({ text: l.text.slice(0, 200).replace(/[<>]/g, ''), time: int(l.time, 0, Number.MAX_SAFE_INTEGER) })) : [];
    return {
      version: 1,
      energy: int(saved.energy, 400),
      discovered,
      pity: int(saved.pity, 0, 9),
      draws: int(saved.draws, 0),
      fusions: int(saved.fusions, 0),
      claimed: [...new Set(Array.isArray(saved.claimed) ? saved.claimed.filter(i => Number.isInteger(i) && i >= 0 && i < 4) : [])],
      logs,
      lastGather: Math.min(int(saved.lastGather, 0, Number.MAX_SAFE_INTEGER), Date.now())
    };
  }
  class Game {
    constructor(saved) {
      this.state = sanitize(saved);
      this.state.claimed = this.state.claimed.filter(i => this.taskProgress(i).done);
    }
    has(id) { return typeof id === 'string' && this.state.discovered.includes(id); }
    log(text) {
      this.state.logs.push({ text, time: Date.now() });
      if (this.state.logs.length > 40) this.state.logs.splice(0, this.state.logs.length - 40);
    }
    draw(count, rng = Math.random) {
      if ((count !== 1 && count !== 5) || typeof rng !== 'function') return [];
      const cost = count === 1 ? 50 : 200;
      if (this.state.energy < cost) return [];
      // Sample before mutating so a faulty injected RNG cannot partially charge a draw.
      const samples = [];
      for (let i = 0; i < count * 2; i++) {
        const n = rng();
        if (typeof n !== 'number' || !Number.isFinite(n)) return [];
        samples.push(Math.max(0, Math.min(1 - Number.EPSILON, n)));
      }
      this.state.energy -= cost;
      const result = [];
      for (let i = 0; i < count; i++) {
        const isRare = this.state.pity >= 9 || samples[i * 2] < 0.2;
        const pool = isRare ? rare : base;
        const id = pool[Math.floor(samples[i * 2 + 1] * pool.length)];
        const isNew = !this.has(id);
        this.state.pity = isRare ? 0 : this.state.pity + 1;
        this.state.draws += 1;
        if (isNew) this.state.discovered.push(id);
        else this.state.energy += 15;
        result.push({ id, isNew });
      }
      this.log('唤灵' + (count === 1 ? '单抽' : '五连') + '：' + result.map(r => byId[r.id].name + (r.isNew ? '（新）' : '')).join('、'));
      return result;
    }
    fuse(a, b) {
      const failed = { ok: false, id: null, isNew: false };
      if (!this.has(a) || !this.has(b)) return failed;
      const id = recipes.get(recipeKey(a, b));
      if (!id) return failed;
      const isNew = !this.has(id);
      this.state.fusions += 1;
      if (isNew) {
        this.state.discovered.push(id);
        this.state.energy += 60;
      }
      this.log(byId[a].name + ' ＋ ' + byId[b].name + ' → ' + byId[id].name + (isNew ? ' · 首次发现 +60 灵气' : ' · 再次共鸣'));
      return { ok: true, id, isNew };
    }
    gather(now = Date.now()) {
      if (typeof now !== 'number' || !Number.isFinite(now) || now <= 0) return false;
      if (this.state.lastGather && now - this.state.lastGather < 8000) return false;
      this.state.lastGather = Math.floor(now);
      this.state.energy += 80;
      this.log('凝聚灵气 +80');
      return true;
    }
    taskProgress(index) {
      let value, target;
      if (index === 0 || index === 1) {
        target = index === 0 ? 8 : 15;
        value = Math.min(this.state.discovered.length, target);
      } else if (index === 2 || index === 3) {
        target = 1;
        value = this.has(index === 2 ? 'life' : 'all') ? 1 : 0;
      } else return { value: 0, target: 1, done: false };
      return { value, target, done: value >= target };
    }
    claim(index) {
      if (!Number.isInteger(index) || index < 0 || index >= rewards.length || this.state.claimed.includes(index) || !this.taskProgress(index).done) return false;
      this.state.claimed.push(index);
      this.state.energy += rewards[index];
      this.log('完成委托「' + names[index] + '」 +' + rewards[index] + ' 灵气');
      return true;
    }
  }
  return Object.freeze({ elements, byId, Game });
});
