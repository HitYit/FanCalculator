import { Tile } from './Tile';
import { IOSBottomSheet } from './ios/IOSBottomSheet';
import { honorNames } from '../engine/tiles';
import type { Tile as TileType } from '../types';
import './MahjongGlossary.css';

interface Term {
  name: string;
  explanation: string;
  tiles: TileType[];
  example: string;
}

export function MahjongGlossary({ open, onClose, seatWind, roundWind }: {
  open: boolean;
  onClose: () => void;
  seatWind?: number;
  roundWind?: number;
}) {
  const terms: Term[] = [
    { name: '门风', explanation: '你本局的座位风，分东、南、西、北；对应风牌组成刻子或杠时，可计门风刻。', tiles: Array(3).fill(27 + (seatWind ?? 0)), example: `按当前门风：${honorNames[seatWind ?? 0]}风刻子` },
    { name: '场风', explanation: '当前圈的风，如东风圈的场风是东；对应风牌组成刻子或杠时，可计场风刻。', tiles: Array(3).fill(27 + (roundWind ?? 0)), example: `按当前场风：${honorNames[roundWind ?? 0]}风刻子` },
    { name: '顺子', explanation: '同一种花色、数字连续的三张牌；字牌不能组成顺子。', tiles: [0, 1, 2], example: '一万、二万、三万' },
    { name: '刻（刻子）', explanation: '三张完全相同的牌。', tiles: [31, 31, 31], example: '三个红中' },
    { name: '暗刻', explanation: '三张相同的牌由自己摸齐，未碰出；点炮胡牌时，用胡牌张组成的刻子不算暗刻。', tiles: [10, 10, 10], example: '自己摸齐的三个二条' },
    { name: '杠', explanation: '四张完全相同的牌组成一组；开杠后要补摸一张牌。', tiles: [18, 18, 18, 18], example: '四个一筒' },
    { name: '明杠', explanation: '手中有三张相同的牌，杠别人打出的第四张；补杠也属于明杠。', tiles: [4, 4, 4, 4], example: '三个五万，杠入第四张' },
    { name: '暗杠', explanation: '自己摸齐四张相同的牌后开杠，没有使用别人打出的牌。', tiles: [32, 32, 32, 32], example: '自己摸齐四个发财' },
    { name: '补杠', explanation: '已经碰出一组刻子，再摸到第四张相同的牌，将碰升级为杠。', tiles: [23, 23, 23, 23], example: '已碰三个六筒，再补第四张' },
    { name: '将（对子）', explanation: '两张相同的牌；普通胡牌中的那一对称为将牌。', tiles: [8, 8], example: '一对九万' },
    { name: '吃', explanation: '用上家打出的牌，与手中两张牌组成顺子，并把这组牌亮出。', tiles: [12, 13, 14], example: '四条、六条，吃上家的五条' },
    { name: '碰', explanation: '用别人打出的牌，与手中两张相同的牌组成刻子，并把这组牌亮出。', tiles: [33, 33, 33], example: '两张白板，碰入第三张' },
    { name: '字牌', explanation: '东、南、西、北四张风牌，以及中、发、白三张箭牌。', tiles: [27, 31, 32, 33], example: '示例：东风、红中、发财、白板' },
    { name: '幺九牌', explanation: '各花色的一和九；“幺九字牌”还包括全部字牌。', tiles: [0, 8, 9, 17], example: '示例：一万、九万、一条、九条' },
    { name: '花牌', explanation: '春、夏、秋、冬、梅、兰、竹、菊；摸到后亮出并补牌，不参与组成面子或将。', tiles: [34, 35, 38, 39], example: '示例：春、夏、梅、兰' }
  ];

  return <IOSBottomSheet open={open} title="麻将术语说明" onClose={onClose} className="mahjong-glossary-sheet">
    <p className="glossary-intro" id="glossary-intro">看名称、读解释，再对照牌例。门风与场风示例对应首页当前选择。</p>
    <div className="glossary-table-scroll" role="region" aria-label="麻将术语表，可横向滚动" aria-describedby="glossary-intro" tabIndex={0}>
      <table className="glossary-table" aria-label="麻将术语、简短解释及示例牌型">
        <colgroup><col className="glossary-name-column"/><col/><col className="glossary-example-column"/></colgroup>
        <thead><tr><th scope="col">名称</th><th scope="col">简短解释</th><th scope="col">示例牌型</th></tr></thead>
        <tbody>{terms.map(term => <tr key={term.name}>
          <th scope="row">{term.name}</th>
          <td>{term.explanation}</td>
          <td><div className="glossary-tiles">{term.tiles.map((tile, index) => <Tile key={index} tile={tile} small/>)}</div><p className="glossary-example-note">{term.example}</p></td>
        </tr>)}</tbody>
      </table>
    </div>
    <p className="glossary-footnote">牌图用于说明牌的组合；明杠、暗杠、吃、碰等区别取决于牌的来源和操作。</p>
  </IOSBottomSheet>;
}
