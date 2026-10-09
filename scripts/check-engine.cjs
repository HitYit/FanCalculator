const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

// Transpile in-process so verification also works where child processes are restricted.
require.extensions['.ts'] = (module, filename) => {
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }
  });
  module._compile(compiled.outputText, filename);
};
const { calculateFan } = require('../src/engine/fan-calculator.ts');
const { getRuleSet, ruleSets } = require('../src/rule.ts');
const { makeMeld } = require('../src/engine/tiles.ts');
const { calculateScore } = require('../src/engine/score-calculator.ts');
const rule = getRuleSet('dazhong-mahjong');
const base = {handTiles: [], winTile: null, melds: [], flowers: [], isSelfDraw: true, discarderIsDealer: false, event: 'normal', roundWind: 0, seatWind: 0, isLastCopy: false};
function run(tiles, options = {}) {
  const result = calculateFan({...base, handTiles: tiles.slice(0, -1), winTile: tiles.at(-1), ...options}, rule);
  assert.equal(result.valid, true, result.errors.join('; '));
  return result;
}
const ids = r => r.items.map(i => i.id);
assert.equal(ruleSets.length, 1);
assert.equal(rule.fanItems.length, 81);
assert.equal(new Set(rule.fanItems.map(i => i.id)).size, 81);
assert.deepEqual(fs.readdirSync('src/rules').filter(name => name === 'dazhong-mahjong.json'), ['dazhong-mahjong.json']);
for (const item of rule.fanItems) for (const id of item.excludes ?? []) assert.ok(rule.fanItems.some(i => i.id === id), `${item.id} excludes unknown ${id}`);
const ordinary = [0,1,2,3,4,5,6,7,8,10,11,12,22,22];
const result = run(ordinary);
assert.equal(result.items.find(i => i.id === 'PURE_STRAIGHT').fan, 24);
assert.ok(ids(result).includes('CONCEALED_HAND'));
assert.ok(ids(result).includes('SELF_DRAWN'));
assert.ok(!ids(result).includes('CLOSED_WAIT'));
assert.equal(run(ordinary, {flowers:[34,35,36]}).items.some(i=>i.id==='FLOWER_TILES'), false);
assert.equal(run(ordinary, {flowers:[34,35,36,37,38,39,40,41]}).items.find(i=>i.id==='FLOWER_TILES').count, 1);
for (const [event,self] of [['replacement',true],['last_draw',true],['last_discard',false],['rob_kong',false],['kong_discard',false]]) {
  const r=run(ordinary,{event,isSelfDraw:self});
  assert.equal(r.multiplier,2,event);
  assert.equal(r.totalFan,r.additiveFan*2,event);
  if(event==='last_draw') assert.ok(!ids(r).includes('SELF_DRAWN'));
}
const stars=run([27,27,28,28,29,29,30,30,31,31,32,32,33,33]);
assert.ok(ids(stars).includes('BIG_SEVEN_STARS'));
assert.ok(!ids(stars).includes('ALL_HONORS'));
assert.ok(!ids(stars).includes('SEVEN_PAIRS'));
const odd=run([0,0,0,4,4,4,9,9,9,20,20,20,26,26]);
assert.ok(ids(odd).includes('ALL_ODD'));
const even=run([1,1,3,3,5,5,7,7,10,10,12,12,14,14]);
assert.ok(ids(even).includes('ALL_EVEN_PUNGS'));
const seven=run([0,0,1,1,2,2,4,4,24,24,29,29,32,32]);
assert.equal(seven.items.find(i=>i.id==='SEVEN_PAIRS').fan,32);
assert.ok(!ids(seven).includes('CONCEALED_HAND'));
const orphan=run([0,8,9,17,18,26,27,28,29,30,31,32,33,0]);
assert.equal(orphan.items.find(i=>i.id==='THIRTEEN_ORPHANS').fan,88);
assert.ok(!ids(orphan).includes('CONCEALED_HAND'));
const knitted=run([0,3,6,10,13,16,20,23,26,27,27],{melds:[makeMeld('chow',1,'knit')]});
assert.equal(knitted.items.find(i=>i.id==='KNITTED_STRAIGHT').fan,12);
const disconnected=run([0,3,6,10,13,16,20,23,26,27,28,29,30,31]);
assert.equal(disconnected.items.find(i=>i.id==='LESSER_HONORS_AND_KNITTED_TILES').fan,12);
assert.ok(!ids(disconnected).includes('CONCEALED_HAND'));
const kongs=run([18,19,20,22,22],{melds:[makeMeld('exposed_kan',0,'a'),makeMeld('exposed_kan',9,'b'),makeMeld('pung',27,'c')]});
assert.equal(kongs.items.find(i=>i.id==='MELDED_KONG').count,2);
const dragon=run([0,1,2,6,7,8,10,11,12,31,31,31,22,22]);
assert.equal(dragon.items.find(i=>i.id==='DRAGON_PUNG').fan,4);
assert.ok(!ids(dragon).includes('PUNG_OF_TERMINALS_OR_HONORS'));
for(const event of ['heavenly','earthly','human']) {
  const r=run(ordinary,{event,isSelfDraw:event!=='human',seatWind:event==='heavenly'?0:1});
  assert.ok(ids(r).includes({heavenly:'HEAVENLY_HAND',earthly:'EARTHLY_HAND',human:'HUMAN_HAND'}[event]));
}
assert.equal(calculateFan(base,rule).valid,false);
assert.deepEqual(calculateScore(result,{...base,isSelfDraw:true,seatWind:1,roundWind:0},rule).payments,[result.totalFan,result.totalFan,result.totalFan*2]);
const pictureCases = [
  [[0,1,2,9,9,9,18,19,20,24,25,26,27,27],'OUTSIDE_HAND',8],
  [[0,1,2,9,9,9,15,16,17,18,19,20,26,26],'PURE_OUTSIDE_HAND',16],
  [[0,1,2,13,14,15,31,31,31,32,32,32,26,26],'TWO_DRAGON_PUNGS',12],
  [[0,1,2,31,31,31,32,32,32,33,33,33,8,8],'BIG_THREE_DRAGONS',88],
  [[0,1,2,27,27,27,28,28,28,29,29,29,32,32],'BIG_THREE_WINDS',16],
  [[2,2,2,27,27,27,28,28,28,29,29,29,30,30],'LITTLE_FOUR_WINDS',64],
  [[27,27,27,28,28,28,29,29,29,30,30,30,0,0],'BIG_FOUR_WINDS',88],
  [[0,0,1,1,2,2,3,3,4,4,5,5,6,6],'SEVEN_SHIFTED_PAIRS',88],
  [[0,1,2,0,1,2,6,7,8,6,7,8,4,4],'PURE_TERMINAL_CHOWS',64],
  [[0,0,0,1,2,3,4,5,6,7,8,8,8,1],'NINE_GATES',88],
  [[1,2,3,10,11,12,18,19,20,27,27,27,33,33],'ALL_TYPES',8],
  [[12,13,14,16,16,16,25,25,25,33,33,33,13,13],'REVERSIBLE_TILES',16]
];
for(const [tiles,id,fan] of pictureCases) assert.equal(run(tiles).items.find(i=>i.id===id)?.fan,fan,id);
const eight = {valid:true, errors:[], items:[], additiveFan:8, multiplier:1, totalFan:8};
for (let roundWind = 0; roundWind < 4; roundWind++) {
  for (let seatWind = 0; seatWind < 4; seatWind++) {
    const ctx = {...base, roundWind, seatWind};
    const self = calculateScore(eight, ctx, rule);
    const dealer = seatWind === roundWind;
    assert.equal(self.total, dealer ? 48 : 32);
    assert.equal(self.payments.reduce((sum, value) => sum + value, 0), self.total);
    assert.equal(self.playerIsDealer.filter(Boolean).length, dealer ? 0 : 1);
    self.payments.forEach((payment, index) => assert.equal(payment, dealer || self.playerIsDealer[index] ? 16 : 8));
    for (const discarderIsDealer of [false, true]) {
      const discard = calculateScore(eight, {...ctx, isSelfDraw:false, discarderIsDealer}, rule);
      assert.equal(discard.total, dealer || discarderIsDealer ? 16 : 8);
      assert.equal(discard.payments.filter(value => value > 0).length, 1);
      const payer = discard.payments.findIndex(value => value > 0);
      assert.equal(discard.playerIsDealer[payer], !dealer && discarderIsDealer);
    }
  }
}
const floorRule = {...rule, fanItems:rule.fanItems.map(item => ({...item, fan:0})), scoring:{...rule.scoring, chickenSelfDrawOnly:false}};
const floorContext = {...base, handTiles:ordinary.slice(0,-1), winTile:ordinary.at(-1)};
assert.equal(calculateFan(floorContext, floorRule).totalFan, 1);
const floorDoubled = calculateFan({...floorContext, event:'last_draw'}, floorRule);
assert.equal(floorDoubled.additiveFan, 1);
assert.equal(floorDoubled.totalFan, 2);
assert.equal(calculateScore(floorDoubled, floorContext, floorRule).total, 12);
console.log('Dazhong checks passed: patterns, minimum fan, dealer wins/discards, all seat rotations and payment totals.');
