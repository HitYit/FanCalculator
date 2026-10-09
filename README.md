<div align="center">

<img src="public/icons/icon.svg" width="72" height="72" alt="牌间图标" />

# 牌间 · 麻将算番器

**随手选牌，轻松算番。**

适配手机与桌面浏览器的大众麻将算番工具 · 81 项番型配置

![React 18](https://img.shields.io/badge/React-18-149ECA?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-离线可用-13765B?style=flat-square)

**[🌐 在线使用](https://fancalculator.netlify.app/)** · 无需注册或下载

</div>

---

## 🀄 功能介绍

| 功能 | 说明 |
| :--- | :--- |
| 🧮 **选牌算番** | 输入手牌、胡牌张、花牌及吃碰杠等面子，校验牌张并判断是否胡牌。 |
| 📋 **结果明细** | 根据胡牌方式、场风、门风及特殊事件计算番数，展示番型明细与积分结算。 |
| 📖 **图鉴与记录** | 搜索、筛选番型，保存最近 30 条记录，点击记录恢复牌局。 |
| 🌓 **随时使用** | 支持浅色、深色模式及 PWA 安装，首次联网完成缓存后可离线使用。 |

> [!NOTE]
> 数据保存在当前浏览器中，不提供云端同步。部分番型为待核对的参考条目；结算按一番一单位展示，请结合实际牌局规则核对。

结算公式为 `max(1, 各番型相加) × 番型倍数 × 庄家倍数`。门风与场风相同时，赢家为庄家；庄家胡牌或点炮均乘 2。点炮时在“胡牌方式”中选择点炮方是否为庄家，只有点炮方赔付；自摸时三家分别赔付。结果顶部显示三家赔付合计，玩家 1、2、3 按赢家之后的座位顺序排列，下方显示单家赔付公式。历史记录保存同一赔付合计。

## 🌐 在线使用

> [!TIP]
> **[打开牌间 → fancalculator.netlify.app](https://fancalculator.netlify.app/)**
>
> 打开网页即可使用，也可以添加到主屏幕，随时查看与算番。

## 💬 反馈与贡献

欢迎通过 **GitHub Issues** 反馈问题，或提交 **Pull Request** 改进界面与规则。

反馈算番问题时，请附上完整牌局信息、预期结果与实际结果；如有规则依据，也请一并提供。

## 📦 第三方来源与许可

牌型识别依赖 [@masaue/jan-js-lib](https://github.com/masaue/jan-js-lib)，该库采用 **Apache-2.0** 许可证。大众麻将番型数据依据规则截图及参考定义整理。

本项目当前未指定许可证，第三方依赖遵循各自许可证。
