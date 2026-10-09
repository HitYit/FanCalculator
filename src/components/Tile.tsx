import { flowerNames, honorNames, tileName } from '../engine/tiles';
import type { Tile as TileType } from '../types';
const numerals=['一','二','三','四','五','六','七','八','九'];
const positions:Record<number,number[][]>={1:[[24,33]],2:[[24,21],[24,45]],3:[[14,17],[24,33],[34,49]],4:[[14,19],[34,19],[14,47],[34,47]],5:[[13,18],[35,18],[24,33],[13,48],[35,48]],6:[[14,17],[34,17],[14,33],[34,33],[14,49],[34,49]],7:[[12,16],[24,24],[36,32],[14,43],[34,43],[14,55],[34,55]],8:[[14,14],[34,14],[14,28],[34,28],[14,42],[34,42],[14,56],[34,56]],9:[[12,16],[24,16],[36,16],[12,33],[24,33],[36,33],[12,50],[24,50],[36,50]]};
function artwork(t:number) {
  let inside='';
  if(t<9) inside=`<text x="24" y="29" text-anchor="middle" font-size="27" font-family="serif" fill="#303b35">${numerals[t]}</text><text x="24" y="58" text-anchor="middle" font-size="28" font-weight="700" font-family="serif" fill="#bd4540">萬</text>`;
  else if(t<18) {
    const n=t%9+1;
    inside=n===1?'<path d="M15 45Q7 28 22 14Q34 16 35 27L27 30L35 47L29 55L22 42L14 57" fill="#1b775b"/><path d="M22 20L32 23" stroke="#bf5147" stroke-width="3"/><circle cx="25" cy="20" r="2" fill="white"/>':positions[n].map(([x,y],i)=>`<rect x="${x-3}" y="${y-5}" width="6" height="11" rx="2" fill="${n===7&&i<3?'#b94b46':'#1a7659'}"/><path d="M${x-5} ${y}h10" stroke="#10573d" stroke-width="1.5"/>`).join('');
  } else if(t<27) inside=positions[t%9+1].map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="${t%9===0?14:5}" fill="none" stroke="${i%3===0?'#25775f':i%3===1?'#b44a44':'#3d6386'}" stroke-width="2.5"/><circle cx="${x}" cy="${y}" r="${t%9===0?8:1.8}" fill="${i%3===0?'#25775f':i%3===1?'#b44a44':'#3d6386'}"/>`).join('');
  else if(t===33) inside='<rect x="9" y="13" width="30" height="44" rx="2" fill="none" stroke="#557b9b" stroke-width="3"/><rect x="13" y="17" width="22" height="36" fill="none" stroke="#557b9b" stroke-width="1"/>';
  else if(t<34) inside=`<text x="24" y="49" text-anchor="middle" font-size="35" font-weight="700" font-family="serif" fill="${t===31?'#bd4540':t===32?'#1b775b':'#344b53'}">${honorNames[t-27]}</text>`;
  else inside=`<path d="M24 53V28M24 42L12 33M24 36L35 27" stroke="#1b775b" stroke-width="2"/><circle cx="24" cy="22" r="8" fill="#cf796c"/><circle cx="15" cy="27" r="6" fill="#e8a99b"/><circle cx="33" cy="27" r="6" fill="#d58b79"/><text x="38" y="61" text-anchor="middle" font-size="12" font-family="serif" fill="#946d46">${flowerNames[t-34]}</text>`;
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 70">${inside}</svg>`)}`;
}
const images=Array.from({length:42},(_,i)=>artwork(i));
export function Tile({ tile, onClick, disabled, selected, small, label, badge }: { tile: TileType; onClick?: ()=>void; disabled?: boolean; selected?: boolean; small?: boolean; label?: string; badge?: number }) {
  const content=<><img src={images[tile]} alt="" draggable={false}/>{badge!==undefined&&badge>0&&<span className="tile-badge">{badge}</span>}</>;
  const cls=`tile ${small?'small':''} ${selected?'selected':''}`;
  return onClick?<button type="button" className={cls} disabled={disabled} aria-label={label??tileName(tile)} title={label??tileName(tile)} aria-pressed={selected} onClick={onClick}>{content}</button>:<span className={cls} role="img" aria-label={tileName(tile)}>{content}</span>;
}
