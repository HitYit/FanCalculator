export type Tile = number;
export type MeldType = 'chow' | 'pung' | 'concealed_pung' | 'exposed_kan' | 'concealed_kan';
export interface Meld { id: string; type: MeldType; tiles: Tile[] }
export type WinEvent = 'normal' | 'replacement' | 'rob_kong' | 'last_draw' | 'last_discard' | 'kong_discard' | 'heavenly' | 'earthly' | 'human';
export interface HandContext {
  handTiles: Tile[];
  melds: Meld[];
  winTile: Tile | null;
  isSelfDraw: boolean;
  discarderIsDealer: boolean;
  flowers: Tile[];
  roundWind: number;
  seatWind: number;
  event: WinEvent;
  isLastCopy: boolean;
}
export interface FanItem {
  id: string; name: string; fan: number; category: string;
  condition: string; conditionParams?: { count?: number };
  description: string; multiplier?: number; excludes?: string[]; source?: string;
}
export interface RuleSet {
  id: string; name: string; description: string; engine: 'dazhong';
  tileSet: { suits: string[]; honors: string[]; flowers: string[]; totalTiles: number };
  fanItems: FanItem[];
  scoring: { selfDrawMultiplier: number; discardMultiplier: number; dealerMultiplier: number; minimumAdditiveFan: number; baseFan: number; minFanToWin: number; chickenSelfDrawOnly: boolean };
}
export interface FanMatch { id: string; name: string; fan: number; count: number; multiplier?: number; description?: string }
export interface FanResult {
  valid: boolean; errors: string[]; items: FanMatch[];
  additiveFan: number; multiplier: number; totalFan: number; shape?: string;
}
