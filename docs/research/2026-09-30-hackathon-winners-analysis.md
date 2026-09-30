# Что побеждает на хакатонах Solana (2026-09-30)

Цель: выбрать идею с максимальными шансами **выиграть хакатон**. Источники — официальные итоги Colosseum, база Colosseum Copilot, данные о рынках.

## Что ценят судьи

Colosseum в итогах Frontier 2026 называет: **скорость исполнения, инсайт, соответствие команды рынку (founder-market fit), приоритизацию, общий уровень команды**. Итоги Frontier: [blog.colosseum.com](https://blog.colosseum.com/announcing-the-winners-of-the-solana-frontier-hackathon/).

## Тренды победителей по двум последним хакатонам

**Cypherpunk** (конец 2025, 1,576 проектов) и **Frontier** (апрель–май 2026, 2,857 проектов, итоги 26 июня 2026).

| Тема | Победители | Акселератор Colosseum (Cohort 5 — сигнал инвесторов) |
|---|---|---|
| **Рынки предсказаний** | Capitola (1-е Consumer, Cypherpunk), Fora, Pythia (University Award), Bench, Mentioned, Senthos, Memetic Machines (Frontier) | Senthos, Cesto |
| **Коллекционные карточки (TCG) и карточные игры** | JK Index, One Arena, Traded.gg, The Syndicate («provably auditable» карточная лига) (Frontier) | JK Index, One Arena, Traded.gg, The Syndicate, Fraudsworth |
| **Стейблкоин-инфраструктура для бизнеса и коридоров** | Credible (INR), Cloak, Sp3nd (Cypherpunk); DashX, Stablecorp, KinnectFi, Dropset, Zoneless (Frontier) | DashX, Stablecorp, Mana, Dropset, Zoneless |
| **Платежи и финансы AI-агентов** | MCPay, Corbits, Mercantill (Cypherpunk); Latinum (Breakout); Flovia, Clawpump, Peaks, Sudont (Frontier) | Flovia, Clawpump, Peaks |
| **RWA** | Autonom, Bore.fi, Legasi (Cypherpunk); ODL, Housd, Crafts (Frontier) | ODL, Housd |
| **DePIN и железо** | Unruggable — Grand Champion Cypherpunk (аппаратный кошелёк); CrowdBrain — Grand Champion Frontier (робототехника DePIN) | CrowdBrain |

## Масштаб рынков за трендами (контекст, не критерий)

- **Рынки предсказаний:** совокупный месячный объём Kalshi и Polymarket вырос с менее чем $5 млрд (сентябрь 2025) до $53 млрд (июль 2026) ([Pew Research](https://www.pewresearch.org/short-reads/2026/09/23/prediction-markets-trading-volume-doubled-between-may-and-july-largely-driven-by-sports/)).
- **Токенизированные карточки на Solana:** у Collector Crypt $1.6 млрд оборота за всё время; рынок gacha-паков — $230 млн за май 2026, 64% на Solana ([Solana Compass](https://solanacompass.com/news/tokenized-trading-card-market-hits-230m-in-may-as-solana-claims-64-of-gacha-volume)).

## Где пригодится наша технология доказательств

1. **Карточки и gacha: доказуемо честное открытие паков и доказательство резервов.** Обзоры отмечают, что крупные gacha-платформы дают раскрытие шансов, а не криптографическую проверяемость каждого открытия ([Shattered](https://shattered.io/is-gacha-rng-provably-fair-explained-2026/)). Gocha заявляет on-chain VRF. Bitquery проверил Collector Crypt по on-chain данным и подтвердил, что шансы соответствуют опубликованным ([Bitquery](https://bitquery.io/investigations/collector-crypt-jupiter-gacha)). The Syndicate из Cohort 5 прямо продаёт «provably auditable».
2. **Рынки предсказаний: проверяемое разрешение.** Споры на Polymarket — больше 1,150 в 2026 году (см. [исследование аудитории](2026-09-30-target-audience-research.md) и [проверку x402](2026-09-30-x402-pivot-check.md)).
3. **Платежи AI-агентов:** см. [проверку x402](2026-09-30-x402-pivot-check.md). В 2025 году это главная призовая категория, в 2026 году осталась, но в меньшем объёме (Flovia, Clawpump).

## Ограничения

База Copilot покрывает 4 хакатона до Cypherpunk; Frontier 2026 взят из блога Colosseum и Solana Compass. Из примерно 290 призёров Copilot собрано 60 (сработал лимит запросов API). Правила и критерии нашего конкретного хакатона не проверены.
