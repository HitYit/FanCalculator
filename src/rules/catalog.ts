import dazhong from './dazhong-catalog.json';

export interface CatalogRule {
  id: string;
  name: string;
  value: string;
  tags: string[];
  definition: string;
  excludes: string;
  source: number;
  note: string;
  group: string;
  example?: string;
}

export interface RuleCatalog {
  id: string;
  name: string;
  groups: { name: string; score: string }[];
  rules: CatalogRule[];
}

// Add another catalog here to make it available in the rule selector.
export const ruleCatalogs: RuleCatalog[] = [dazhong];
