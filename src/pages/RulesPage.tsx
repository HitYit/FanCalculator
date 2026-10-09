import { useState } from 'react';
import { ChevronDown, ExternalLink, Printer, RotateCcw, Search } from 'lucide-react';
import { ruleCatalogs } from '../rules/catalog';
import './RulesPage.css';

const normalize = (text: string) => text.toLowerCase()
  .replace(/[\s、，,。／/（）()—−-]/g, '')
  .replace(/發/g, '发').replace(/萬/g, '万');

export function RulesPage() {
  const [catalogId, setCatalogId] = useState(ruleCatalogs[0].id);
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('');
  const [value, setValue] = useState('');
  const [tag, setTag] = useState('');
  const catalog = ruleCatalogs.find(item => item.id === catalogId) ?? ruleCatalogs[0];
  const values = [...new Set(catalog.rules.map(item => item.value))]
    .sort((a, b) => (a === 'x2' ? Infinity : Number(a)) - (b === 'x2' ? Infinity : Number(b)));
  const tags = [...new Set(catalog.rules.flatMap(item => item.tags))];
  const query = normalize(search);
  const items = catalog.rules.filter(item =>
    (!group || item.group === group) && (!value || item.value === value) &&
    (!tag || item.tags.includes(tag)) && (!query || normalize([
      item.name, item.definition, item.excludes, item.note, ...item.tags,
    ].join(' ')).includes(query)));

  function resetFilters() {
    setSearch(''); setGroup(''); setValue(''); setTag('');
  }

  return <div className="rules-reference">
    <div className="page-heading rules-heading">
      <div><div className="eyebrow">MAHJONG / RULE REFERENCE</div>
        <h1>{catalog.name}规则<span className="heading-dot">.</span></h1>
      </div>
      <label className="rules-selector"><span>麻将规则</span><div className="rule-picker">
        <select aria-label="选择麻将规则" value={catalog.id} onChange={event => {
          setCatalogId(event.target.value); resetFilters();
        }}>{ruleCatalogs.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <ChevronDown size={16}/>
      </div></label>
    </div>
    <div className="rules-summary"><span><strong>{catalog.rules.length}</strong> 项规则</span><span><strong>{catalog.groups.length}</strong> 个分组</span></div>
    <nav className="rules-group-nav" aria-label="番型分组目录">{catalog.groups.map((item, index) => <a key={item.name} href={`#catalog-${catalog.id}-${index}`} onClick={resetFilters}>{item.name}</a>)}</nav>
    <form className="rules-filters" role="search" onSubmit={event => event.preventDefault()} onReset={resetFilters}>
      <label className="search-field"><Search size={18}/><input type="search" aria-label="搜索番型、定义或不计关系" placeholder="搜索番型、定义、不计关系…" value={search} onChange={event => setSearch(event.target.value)}/></label>
      <select aria-label="按分组筛选" value={group} onChange={event => setGroup(event.target.value)}><option value="">全部分组</option>{catalog.groups.map(item => <option key={item.name}>{item.name}</option>)}</select>
      <select aria-label="按番数或倍率筛选" value={value} onChange={event => setValue(event.target.value)}><option value="">全部番数 / 倍率</option>{values.map(item => <option key={item} value={item}>{item === 'x2' ? '×2 倍' : `+${item} 番`}</option>)}</select>
      <select aria-label="按类型筛选" value={tag} onChange={event => setTag(event.target.value)}><option value="">全部类型</option>{tags.map(item => <option key={item}>{item}</option>)}</select>
      <button className="rules-reset" type="reset"><RotateCcw size={14}/>重置</button>
    </form>
    <div className="rules-resultline"><span role="status" aria-live="polite">显示 {items.length} / {catalog.rules.length} 项规则</span><button type="button" onClick={() => window.print()}><Printer size={14}/>打印 / 保存 PDF</button></div>
    {catalog.groups.map((section, index) => { const sectionItems = items.filter(item => item.group === section.name); if (!sectionItems.length) return null; return <section className="rules-section" id={`catalog-${catalog.id}-${index}`} key={section.name}>
      <div className="rules-section-heading"><h2>{section.name}</h2><span>{section.score} · {sectionItems.length} 项</span></div>
      <div className="rules-card-grid">{sectionItems.map(item => <article className="rules-card" key={item.id}>
        <div className="rules-card-heading"><h3>{item.name}</h3><span className={`rules-score${item.value === 'x2' ? ' rules-multiplier' : ''}`}>{item.value === 'x2' ? '×2 倍' : `+${item.value} 番`}</span></div>
        <div className="rules-tags">{item.tags.map(itemTag => <span key={itemTag}>{itemTag}</span>)}</div><p className="rules-definition">{item.definition}</p>
        {item.excludes && <p className="rules-excludes"><strong>不计</strong>{item.excludes}</p>}
        {item.example && <figure className="rules-example"><img src={`${import.meta.env.BASE_URL}${item.example}`} loading="lazy" decoding="async" alt={`${item.name}：截图中的示例牌`}/><figcaption>原图示例牌</figcaption></figure>}
        {item.note && <p className="rules-note">{item.note}</p>}<span className="rules-source">来源截图 {String(item.source).padStart(2, '0')}</span>
      </article>)}</div>
    </section>; })}
    {!items.length && <div className="empty-page"><Search size={30}/><h2>没有匹配的番型</h2><p>请换个关键词，或重置筛选。</p></div>}
    <div className="sources"><a href="https://github.com/masaue/jan-js-lib" target="_blank" rel="noreferrer">牌型识别引擎来源<ExternalLink size={14}/></a></div>
  </div>;
}
