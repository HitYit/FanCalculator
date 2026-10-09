"""Build a self-contained HTML reference from all 33 pic screenshots.

Text and crop coordinates were checked visually against screenshots 7–39.
Run from any directory: python scripts/build-rules-reference.py
"""
from pathlib import Path
from collections import Counter
from PIL import Image
import base64
import html
import io
import json

ROOT = Path(__file__).resolve().parent.parent
# name | score (x2 = multiplier) | tags | definition | explicit exclusions |
# screenshot | example crop Y coordinates on a 2048px-wide preview | note
ROWS = """
自摸|1|胡牌方式|自己抓进牌成胡牌。||7||
四花|2|花牌|胡牌时，补花数量 ≥ 4 张。||7||
明杠|2|杠牌|自己有暗刻，用别人打出的一张相同的牌开杠；或自己抓进一张与碰出的明刻相同的牌开杠。||7||
断幺九|4|幺九类|胡牌中没有 1、9 的序数牌及字牌。||8|454,542|
一般高|4|顺子类|由一种花色的 2 副相同顺子组成的牌。||8|695,784|
喜相逢|4|顺子类|2 种花色的 2 副序数相同的顺子。||9|472,560|
连六|4|顺子类|胡牌时，有 6 张同一花色、序数相连的牌组成 2 副顺子。||9|713,801|
老少副|4|顺子类|一种花色牌的 123、789 两副顺子。||10|403,491|
箭刻|4|刻子类 字牌类|手中有一副箭刻（中／发／白）。||10|644,733|
场风刻|4|刻子类 字牌类|手中有一副场风（东风）刻子。||11|394,484|截图明确写的是“场风（东风）”，未说明场风是否随局数轮换。
门风刻|4|刻子类 字牌类|手中有一副与本门风相同的风刻。||11||
暗杠|4|杠牌|自己摸到 4 张相同的牌开杠。||11||
四归一|4|牌张组合|包含 4 张相同的牌胡牌，不能杠出。||12|389,479|
门清|4|胡牌方式|胡牌时，没有吃、碰和明杠。||12|632,721|
双暗刻|4|刻子类|胡牌时有 2 个暗刻。||13|449,539|
双同刻|4|刻子类|胡牌时有 2 副序数相同的刻子。||13|691,782|
杠上开花|x2|胡牌方式|杠牌／补花后摸上的一张牌胡牌。||15||截图将“补花后胡牌”也列入本项。
妙手回春|x2|胡牌方式|自摸牌墙上最后一张牌胡牌。|自摸|15||
海底捞月|x2|胡牌方式|胡打出的最后一张牌。||15||
抢杠胡|x2|胡牌方式|胡别人补杠的那张牌。||15||
杠上炮|x2|胡牌方式|胡别人杠牌后打出的那张牌。||14||
金钩钩|8|胡牌方式|手中的牌都被吃、碰、杠放倒，只剩 1 张牌单钓将。||14|594,683|
带幺九（全带幺）|8|幺九类|胡牌时，每副牌、将牌都有幺牌（1、9 序数牌和字牌）。||16|436,526|
五门齐|8|花色类|胡牌时，3 种序数牌、风牌、箭牌齐全。||16|677,767|
混一色|12|花色类|由一种花色序数牌及字牌组成的胡牌。||17|448,539|
碰碰胡|12|刻子类|由 4 副刻子（或杠）、将牌组成的胡牌。||17|691,782|
双箭刻|12|刻子类 字牌类|胡牌时有 2 副箭刻（或杠）。|箭刻|19|389,479|
花龙|12|顺子类|3 种花色的 3 副顺子连接成 1—9 的序数牌。||19|630,721|
组合龙|12|牌张组合|包含 3 种花色的 147、258、369 的 9 张序数牌组成的胡牌。||18|442,532|
全不靠|12|特殊结构|由单张 3 种花色的 147、258、369 序数牌及东南西北中发白，共 16 张牌中的任何 14 张牌组成的胡牌。|五门齐、门清|18|734,823|
三色三同顺|12|顺子类|胡牌时，有 3 种花色、3 副序数相同的顺子。|喜相逢|20|418,508|
推不倒|16|牌张组合|由牌面图形没有上下区别的牌组成的胡牌，包括 1、2、3、4、5、8、9 饼，2、4、5、6、8、9 条及白板。||20|709,799|
纯带幺九|16|幺九类|胡牌时，每副牌、将牌都包含 1／9 的序数牌。||21|379,469|
三风刻|16|刻子类 字牌类|胡牌时包含 3 副风刻。|小三风、门风刻、场风刻|21|620,710|
全单|16|牌张组合|胡牌时，手牌都是单数的序数牌。||23|392,482|
清龙|24|顺子类|胡牌时，有一种花色 1—9 相连接的序数牌。|连六、老少副|23|633,724|
一色三步高|24|顺子类|一种花色的 3 副顺子，依次递增一位数或二位数。|一般高、老少副、喜相逢、连六|22|457,547|
三同刻|24|刻子类|3 个序数相同的刻子（杠）。|双同刻|22|698,789|
三暗刻|24|刻子类|胡牌时包含 3 个暗刻。|双暗刻|24|397,487|
七星不靠|24|特殊结构|必须有 7 个单张的东南西北中发白，加上 3 种花色、数位按 147、258、369 中的 7 张序数牌，组成没有将牌的胡牌。|五门齐、门清、全不靠|24|739,823|
七对|32|七对类|由 7 个对子组成胡牌。|门清|25|432,523|
全双|32|牌张组合|胡牌时，手牌都是双数的序数牌。||25|674,765|
清一色|32|花色类|只由一种花色序数牌组成的胡牌。||27|394,485|
三连刻（一色三节高）|32|刻子类|胡牌时有一种花色的 3 副刻子，依次递增一位数字。|一色三同顺|27|635,726|
三同顺|32|顺子类|胡牌时有一种花色的 3 副序数相同的顺子。|三连刻、一般高|28|424,514|
全大|32|牌张组合|胡牌时，手牌都是 7／8／9 的序数牌。||28|665,756|
全中|32|牌张组合|胡牌时，手牌都是 4／5／6 的序数牌。||26|401,492|
全小|32|牌张组合|胡牌时，手牌都是 1／2／3 的序数牌。||26|642,732|
一色四步高|36|顺子类 花色类|一种花色的 4 副顺子，依次递增一位数或二位数。|一色三步高、一般高、老少副、喜相逢、连六|29|514,605|
十二金钗（三杠）|36|杠牌|胡牌时，手中有 3 副杠牌。||29|734,823|
混幺九|36|幺九类|只由序数牌 1／9 和字牌组成的胡牌。|碰碰胡、双同刻、全带幺、混一色|31|433,525|
四同顺|48|顺子类 花色类|一种花色的 4 副序数相同的顺子。|一色三节高、一般高、四归一、一色三同顺、老少副、缺一门|31|725,815|
四连刻（一色四节高）|48|刻子类 花色类|一种花色的 4 副刻子，依次递增一位数。|三同顺、三连刻、碰碰胡|35|486,577|
清幺九|64|幺九类|只由序数牌 1／9 组成的胡牌。|碰碰胡、双同刻、全带幺|35|727,817|
小四喜|64|字牌类|胡牌时，有风牌的 3 副刻子及 1 对将牌。|场风刻、门风刻、三风刻、小三风|30|466,557|
小三元|64|字牌类|胡牌时，有箭牌的 2 副刻子及 1 对将牌。|箭刻、双箭刻|30|708,799|
字一色|64|花色类 字牌类|由字牌的刻子（杠）、将组成的胡牌。|碰碰胡、混幺九、全带幺|33|463,555|
四暗刻|64|刻子类|4 个暗刻（暗杠）。|门清、碰碰胡、三暗刻、双暗刻|33|704,796|
一色双龙会|64|花色类 七对类|一种花色的两个老少副，5 为将牌。|七对、清一色、一般高、老少副|36|440,532|
人胡|64|胡牌方式|发完手牌后，非庄家第一轮就吃胡。如在第一次摸牌前有任意玩家吃、碰、杠，则不算人胡。||36||
大四喜|88|字牌类|由 4 副风刻（杠）组成的胡牌。|场风刻、门风刻、三风刻、小三风、碰碰胡|34|524,615|
大三元|88|字牌类|胡牌中，有中、发、白 3 副刻子。|箭刻、双箭刻|34||本截图底部的示例牌被截断，定义及“不计”关系可完整读取。
绿一色|88|花色类|由 2、3、4、6、8 条及发字中的任何牌，组成顺子、刻子、将的胡牌。|混一色|32|488,580|
十八罗汉（四杠）|88|杠牌|胡牌时，手中有 4 副杠牌。|碰碰胡、十二金钗、金钩钩|32|706,817|
连七对|88|七对类|由同一花色序数牌组成序数相连的 7 个对子的胡牌。|清一色、门清、七对|37|468,561|
大七星|88|七对类 字牌类|胡牌为七种字牌做出的七对。|字一色、七对|37|710,801|
九莲宝灯|88|顺子类 花色类|由一种花色序数牌组成“1112345678999”特定牌型，见同花色任何 1 张序数牌即可胡牌。|清一色、门清|39|431,524|
十三幺|88|幺九类|由 3 种序数牌的 1／9 牌、七种字牌及其中一对作将组成的胡牌。|五门齐、门清、全带幺|39|723,815|
天胡|88|胡牌方式|庄家发完手牌后直接胡牌。||38||
地胡|88|胡牌方式|发完手牌后，非庄家第一次摸牌就自摸胡牌。如在第一次摸牌前有任意玩家吃、碰、杠，则不算地胡。||38||
""".strip()

rules = []
for line in ROWS.splitlines():
    name, value, tags, definition, excludes, source, crop, note = line.split('|')
    if value == 'x2':
        group = '加倍番型'
    else:
        fan = int(value)
        group = '起胡推荐' if fan <= 4 else '中级番型' if fan <= 32 else '高级番型' if fan <= 64 else '顶级番型'
    rules.append(dict(name=name, value=value, tags=tags.split(), definition=definition,
                      excludes=excludes, source=int(source), crop=crop, note=note, group=group))

def esc(value):
    return html.escape(str(value), quote=True)

def encoded_crop(number, box, max_width=None):
    filename = ROOT / 'pic' / f'微信图片_20261008164747_{number}_277.jpg'
    with Image.open(filename) as original:
        scale = original.width / 2048
        image = original.crop(tuple(round(v * scale) for v in box))
        if max_width and image.width > max_width:
            image.thumbnail((max_width, 2000), Image.Resampling.LANCZOS)
        buffer = io.BytesIO()
        image.save(buffer, format='JPEG', quality=87, optimize=True)
        return 'data:image/jpeg;base64,' + base64.b64encode(buffer.getvalue()).decode('ascii')

groups = ['起胡推荐', '加倍番型', '中级番型', '高级番型', '顶级番型']
subtitles = ['+1—4 番', '×2 倍', '+8—32 番', '+36—64 番', '+88 番']
counts = Counter(r['group'] for r in rules)
sections = []
for group, subtitle in zip(groups, subtitles):
    cards = []
    for index, r in enumerate(rules):
        if r['group'] != group:
            continue
        score = '×2 倍' if r['value'] == 'x2' else f'+{r["value"]} 番'
        tags = ''.join(f'<span class="tag">{esc(t)}</span>' for t in r['tags'])
        exclusions = f'<p class="excludes"><strong>不计</strong> {esc(r["excludes"])}</p>' if r['excludes'] else ''
        note = f'<p class="note">{esc(r["note"])}</p>' if r['note'] else ''
        example = ''
        if r['crop']:
            y1, y2 = map(int, r['crop'].split(','))
            img = encoded_crop(r['source'], (554, y1, 1424, y2), max_width=1080)
            example = f'<figure class="example"><img loading="lazy" src="{img}" alt="{esc(r["name"])}：截图中的示例牌" width="1080"><figcaption>原图示例牌</figcaption></figure>'
        search = ' '.join([r['name'], r['definition'], r['excludes'], r['note'], *r['tags']])
        cards.append(f'''<article class="rule" id="rule-{index+1}" data-search="{esc(search)}" data-value="{r['value']}" data-group="{group}" data-tags="{esc(' '.join(r['tags']))}">
<div class="rule-heading"><h3>{esc(r['name'])}</h3><span class="score{' multiplier' if r['value']=='x2' else ''}">{score}</span></div>
<div class="tags">{tags}</div><p class="definition">{esc(r['definition'])}</p>{exclusions}{example}{note}
<span class="source-link">来源截图 {r['source']:02d}</span></article>''')
    sections.append(f'<section class="rule-section" id="group-{groups.index(group)}"><div class="section-heading"><h2>{group}</h2><span>{subtitle} · {counts[group]} 项</span></div><div class="grid">'+''.join(cards)+'</div></section>')

sources = []
coverage = {}
for n in range(7, 40):
    names = [r['name'] for r in rules if r['source'] == n]
    # Screenshot 38 also repeats the full definition for 十三幺 from screenshot 39.
    if n == 38:
        names.insert(0, '十三幺（续页）')
    coverage[str(n)] = names
    img = encoded_crop(n, (544, 201, 1685, 838))
    sources.append(f'<details class="source" id="source-{n}"><summary><span class="source-number">{n:02d}</span> {esc(" / ".join(names))}</summary><p class="source-filename">微信图片_20261008164747_{n}_277.jpg · 规则区域裁切</p><button class="zoom" type="button" aria-label="放大截图 {n}"><img loading="lazy" src="{img}" alt="截图 {n} 的规则原文和示例牌"></button><p class="note">点击图片可放大查看。</p></details>')

TEMPLATE = r'''<!doctype html>
<html lang="zh-CN">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>大众麻将规则 · 图片整理版</title>
<style>
:root{--ink:#213b34;--muted:#677870;--green:#17634c;--paper:#f6f5ef;--line:#dedfd5;--gold:#aa6f2f}*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:165px}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.8 system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif}a{color:var(--green);text-underline-offset:4px}button,input,select{font:inherit}button,select{cursor:pointer}button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible,summary:focus-visible{outline:3px solid #c69755;outline-offset:4px}.wrap{max-width:1180px;margin:auto;padding:0 32px}.hero{background:#173f33;color:#f8f6ed;padding:54px 0 34px;position:relative;overflow:hidden}.hero:after{content:"發";position:absolute;right:5%;top:-70px;font:300px/1.5 serif;opacity:.05;transform:rotate(12deg);pointer-events:none}.eyebrow{letter-spacing:3px;font-size:12px;color:#c5d6c3}.hero h1{font-family:"Songti SC",SimSun,serif;font-weight:500;font-size:48px;letter-spacing:5px;margin:14px 0}.hero p{max-width:730px;color:#d2dfd5;margin:0;font-size:15px}.stats{display:flex;gap:36px;margin-top:28px}.stats strong{font-size:26px;font-weight:500;margin-right:8px}.stats span{font-size:13px;color:#c8d7ce}.topnav{margin-top:26px;display:flex;gap:22px;flex-wrap:wrap}.topnav a{color:#d8e3d8;font-size:14px;text-decoration:none}.topnav a:hover{text-decoration:underline}.intro{padding:30px 0 20px}.notice{background:#eeefe4;border-left:3px solid #88986b;padding:18px 23px;font-size:14px}.notice p{margin:4px 0}.notice strong{color:#466044}.controls-shell{position:sticky;top:0;z-index:5;background:#f6f5eff5;backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}.controls{padding-top:17px;padding-bottom:15px;display:grid;grid-template-columns:minmax(180px,1fr) 145px 150px 145px auto;gap:10px;align-items:center}.controls input,.controls select{width:100%;padding:9px 12px;background:#fffefb;border:1px solid #d7ddd3;border-radius:7px;color:var(--ink);font-size:14px}.controls button{padding:8px 14px;border:1px solid #d7ddd3;background:transparent;border-radius:7px;color:var(--green);font-size:14px}.resultline{display:flex;justify-content:space-between;gap:12px;margin-top:24px;color:var(--muted);font-size:13px}.print-button{border:0;background:none;color:var(--green);padding:0;font-size:13px;cursor:pointer}.section-heading{display:flex;align-items:baseline;gap:18px;border-bottom:1px solid #cdd6ca;padding:12px 0;margin:20px 0 20px}.section-heading h2{font-size:23px;letter-spacing:2px;font-weight:550;margin:0}.section-heading>span{color:var(--muted);font-size:13px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.rule{padding:24px 25px 17px;background:#fffefb;border:1px solid #e0e4da;border-radius:12px;display:flex;flex-direction:column;scroll-margin-top:160px}.rule-heading{display:flex;align-items:baseline;justify-content:space-between;gap:12px}.rule h3{font-size:20px;margin:0;font-weight:600;line-height:1.5}.score{flex-shrink:0;font-size:19px;font-weight:650;color:var(--gold)}.score.multiplier{color:#92543e}.tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}.tag{font-size:11px;background:#eef3ed;color:#526a5c;line-height:1.6;padding:2px 8px;border-radius:4px}.definition{font-size:15px;margin:16px 0 10px}.excludes{font-size:13px;color:#8c4e39;background:#fcf3ea;padding:9px 12px;margin:0 0 12px;border-radius:6px}.excludes strong{margin-right:7px}.example{margin:6px 0 10px}.example img{display:block;max-width:100%;width:100%;height:auto;border-radius:5px;border:1px solid #e4e8dc}.example figcaption{color:#899389;font-size:10px;margin-top:2px}.note{font-size:12px;color:var(--muted);margin:8px 0}.source-link{font-size:12px;align-self:flex-start;margin-top:auto;padding-top:6px;text-decoration:none}.source-link:hover{text-decoration:underline}.empty{padding:60px 0;text-align:center;color:var(--muted)}[hidden]{display:none!important}.reference{margin-top:44px;padding-top:8px}.reference h2{font-size:23px;letter-spacing:2px;font-weight:550}.reference p,.reference li{font-size:14px}.alias-table{border-collapse:collapse;width:100%;font-size:14px;background:#fffefb}.alias-table th,.alias-table td{border:1px solid var(--line);padding:10px 15px;text-align:left}.alias-table th{background:#ecefe5}.source{border-top:1px solid var(--line);padding:11px 0}.source:last-child{border-bottom:1px solid var(--line)}.source summary{cursor:pointer;font-size:14px;line-height:1.8}.source-number{display:inline-block;color:#769078;width:32px;font-variant-numeric:tabular-nums}.source-filename{font-size:12px!important;color:var(--muted);overflow-wrap:anywhere}.source img{display:block;width:100%;height:auto;max-width:1140px;border-radius:6px}.source[open]{padding-bottom:20px}.footer{border-top:1px solid var(--line);padding:25px 0;margin-top:42px;color:var(--muted);font-size:12px}.footer .wrap{display:flex;justify-content:space-between;gap:20px}.backtop{white-space:nowrap}.rule:target{border-color:#789d77;box-shadow:0 0 0 3px #dce8d5}#gallery{scroll-margin-top:150px}
@media(max-width:850px){.controls{grid-template-columns:minmax(140px,1fr) 130px 140px}.controls input{grid-column:1/-1}.controls button{display:none}.wrap{padding:0 22px}html{scroll-padding-top:185px}}
@media(max-width:600px){.hero{padding-top:32px}.hero h1{font-size:34px;letter-spacing:3px}.hero p{font-size:13px}.stats{gap:22px}.stats strong{font-size:23px}.stats span{font-size:11px}.wrap{padding-left:16px;padding-right:16px}.topnav{gap:12px 19px}.topnav a{font-size:12px}.controls{grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.controls select{font-size:12px;padding:8px 5px}.grid{grid-template-columns:1fr;gap:12px}.rule{padding:20px}.rule h3{font-size:18px}.score{font-size:17px}.section-heading{gap:12px}.section-heading h2{font-size:20px}.notice{padding:14px 15px;font-size:12px}.footer .wrap{flex-direction:column}.alias-table td,.alias-table th{padding:8px}}
@media print{body{background:white;font-size:12px}.hero{background:white;color:#213b34;padding:12px 0}.hero p,.eyebrow,.stats span{color:#555}.hero h1{font-size:30px}.hero:after,.controls-shell,.topnav,.print-button,.source-link,.footer,.example figcaption{display:none}.wrap{max-width:none;padding:0}.stats{margin-top:8px}.intro{padding:12px 0}.notice{background:white}.grid{gap:10px;display:block}.rule{break-inside:avoid;margin-bottom:10px;border-radius:0;padding:12px}.rule h3{font-size:15px}.definition{font-size:12px;margin:6px 0}.score{font-size:15px}.example img{max-width:600px}.section-heading{margin:12px 0}.reference{margin-top:14px}.sources-section{display:none}.resultline{margin-top:8px}.excludes{font-size:12px}.tag{font-size:10px}a{color:inherit;text-decoration:none}}
.zoom{display:block;background:none;border:0;padding:0;width:100%;cursor:zoom-in}.lightbox{width:96vw;max-width:1600px;max-height:96vh;border:1px solid #cdd6ca;border-radius:10px;padding:14px;background:#fffefb}.lightbox::backdrop{background:#173f33bb}.lightbox img{display:block;max-width:100%;height:auto;margin-top:12px}.lightbox .close{display:block;margin-left:auto;background:#173f33;color:white;border:0;padding:7px 20px;border-radius:6px}.lightbox p{margin:6px 0;font-size:12px;color:var(--muted)}
</style></head>
<body id="top"><header class="hero"><div class="wrap"><div class="eyebrow">MAHJONG / RULE REFERENCE</div><h1>大众麻将规则</h1><p>把截图里的番型，整理成一本随手可查的规则手册。定义、番数、“不计”关系与原图示例牌，集中阅读。</p><div class="stats"><div><strong>__COUNT__</strong><span>项规则</span></div><div><strong>33</strong><span>张截图</span></div><div><strong>5</strong><span>个分组</span></div></div><nav class="topnav" aria-label="规则目录">__NAV__</nav></div></header>
<main>
<div class="controls-shell"><form class="wrap controls" id="filters" role="search"><input id="query" type="search" aria-label="搜索番型、定义或不计关系" placeholder="搜索番型、定义、不计关系…" autocomplete="off"><select id="group" aria-label="按分组筛选"><option value="">全部分组</option>__GROUP_OPTIONS__</select><select id="value" aria-label="按番数或倍率筛选"><option value="">全部番数 / 倍率</option>__VALUE_OPTIONS__</select><select id="tag" aria-label="按类型筛选"><option value="">全部类型</option>__TAG_OPTIONS__</select><button type="reset">重置</button></form></div>
<div class="wrap"><div class="resultline"><span id="result" role="status" aria-live="polite">共 __COUNT__ 项规则 · 按截图分组排列</span><button class="print-button" type="button" id="print">打印 / 保存 PDF</button></div><div id="rules">__SECTIONS__</div><p id="empty" class="empty" hidden>没有符合条件的规则。请换个关键词，或重置筛选。</p>
 </div></main>
<footer class="footer"><div class="wrap"><span>大众麻将 · 图片整理版 · 来源：pic/微信图片_20261008164747_7—39_277.jpg<br>单文件离线阅读 · 全部文字、样式与示例牌已内嵌</span><a class="backtop" href="#top">回到顶部 ↑</a></div></footer>
<dialog class="lightbox" id="lightbox" aria-label="放大规则截图"><button class="close" id="close-lightbox" type="button">关闭 ×</button><p>可使用浏览器缩放进一步放大文字；按 Esc 关闭。</p><img id="lightbox-image" alt="规则截图放大查看"></dialog>
<script type="application/json" id="extracted-rules">__DATA__</script>
<script>
(() => {
  const form = document.getElementById('filters');
  const query = document.getElementById('query');
  const group = document.getElementById('group');
  const value = document.getElementById('value');
  const tag = document.getElementById('tag');
  const cards = [...document.querySelectorAll('.rule')];
  const sections = [...document.querySelectorAll('.rule-section')];
  const normalize = s => s.toLowerCase().replace(/[\s、，,。／/（）()—−-]/g, '').replace(/發/g, '发').replace(/萬/g, '万');
  function filter() {
    const q = normalize(query.value);
    let count = 0;
    cards.forEach(card => {
      const match = (!q || normalize(card.dataset.search).includes(q)) && (!group.value || card.dataset.group === group.value) && (!value.value || card.dataset.value === value.value) && (!tag.value || card.dataset.tags.split(' ').includes(tag.value));
      card.hidden = !match;
      if (match) count++;
    });
    sections.forEach(section => { section.hidden = ![...section.querySelectorAll('.rule')].some(c => !c.hidden); });
    document.getElementById('result').textContent = `显示 ${count} / ${cards.length} 项规则`;
    document.getElementById('empty').hidden = count > 0;
  }
  form.addEventListener('submit', e => e.preventDefault());
  form.addEventListener('input', filter);
  form.addEventListener('change', filter);
  form.addEventListener('reset', () => setTimeout(filter, 0));
  document.getElementById('print').addEventListener('click', () => window.print());
  const lightbox = document.getElementById('lightbox');
  document.querySelectorAll('.zoom').forEach(button => button.addEventListener('click', () => {
    const sourceImage = button.querySelector('img');
    document.getElementById('lightbox-image').src = sourceImage.src;
    document.getElementById('lightbox-image').alt = sourceImage.alt;
    lightbox.showModal();
  }));
  document.getElementById('close-lightbox').addEventListener('click', () => lightbox.close());
  function openSource() {
    const target = document.getElementById(location.hash.slice(1));
    if (target && target.classList.contains('source')) { target.open = true; target.scrollIntoView({block:'start'}); }
  }
  document.querySelectorAll('.source-link').forEach(link => link.addEventListener('click', () => {document.getElementById(link.hash.slice(1)).open = true;}));
  window.addEventListener('hashchange', openSource);
  document.querySelectorAll('.topnav a').forEach(link => link.addEventListener('click', () => {if(link.hash.startsWith('#group-')) {form.reset(); filter();}}));
  openSource();
})();
</script></body></html>'''

tag_names = list(dict.fromkeys(t for r in rules for t in r['tags']))
values = ['1', '2', '4', '8', '12', '16', '24', '32', '36', '48', '64', '88', 'x2']
nav = ''.join(f'<a href="#group-{i}">{g}</a>' for i, g in enumerate(groups))
data = dict(sourceDirectory='pic', sourceFiles=coverage, rules=rules)
replacements = {
    '__COUNT__': str(len(rules)), '__NAV__': nav,
    '__GROUP_OPTIONS__': ''.join(f'<option>{g}</option>' for g in groups),
    '__VALUE_OPTIONS__': ''.join(f'<option value="{v}">{"×2 倍" if v=="x2" else "+"+v+" 番"}</option>' for v in values),
    '__TAG_OPTIONS__': ''.join(f'<option>{t}</option>' for t in tag_names),
    '__SECTIONS__': ''.join(sections), '__SOURCES__': ''.join(sources),
    '__DATA__': json.dumps(data, ensure_ascii=False).replace('<', '\\u003c'),
}
document = TEMPLATE
for key, value in replacements.items():
    document = document.replace(key, value)
output = ROOT / '大众麻将规则.html'
output.write_text(document, encoding='utf-8')
assert len({r['name'] for r in rules}) == len(rules)
assert set(coverage) == {str(n) for n in range(7, 40)}
assert all(coverage.values())
assert all(r['value'] in values for r in rules)

# Export the same rules for the website, with separately cacheable examples.
asset_directory = ROOT / 'public' / 'rules' / 'dazhong-mahjong'
asset_directory.mkdir(parents=True, exist_ok=True)
catalog_rules = []
for index, rule in enumerate(rules, start=1):
    item = {key: value for key, value in rule.items() if key != 'crop'}
    item['id'] = f'dazhong-{index:02d}'
    if rule['crop']:
        y1, y2 = map(int, rule['crop'].split(','))
        image_data = encoded_crop(rule['source'], (554, y1, 1424, y2), max_width=1080)
        image_name = f'example-{index:02d}.jpg'
        (asset_directory / image_name).write_bytes(base64.b64decode(image_data.split(',', 1)[1]))
        item['example'] = f'rules/dazhong-mahjong/{image_name}'
    catalog_rules.append(item)
catalog = dict(id='dazhong-mahjong', name='大众麻将', groups=[
    dict(name=name, score=score) for name, score in zip(groups, subtitles)
], rules=catalog_rules)
catalog_path = ROOT / 'src' / 'rules' / 'dazhong-catalog.json'
catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(dict(output=str(output), rules=len(rules), groups=counts, screenshots=len(sources), bytes=output.stat().st_size), ensure_ascii=False))
