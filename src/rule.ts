import type { RuleSet } from './types';
import dazhong from './rules/dazhong-mahjong.json';
export const ruleSets: RuleSet[] = [dazhong as RuleSet];
export const getRuleSet = (id: string) => ruleSets.find(r => r.id === id) ?? ruleSets[0];
