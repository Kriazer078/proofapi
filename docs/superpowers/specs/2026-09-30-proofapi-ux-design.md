# ProofAPI MVP — UX Design

**Дата:** 2026-09-30
**Связано:** [спецификация v2](2026-09-30-proofapi-mvp-design.md)

## 1. Для кого и какая задача

| Персона | Контекст | Главная задача (JTBD) | Критерий успеха |
|---|---|---|---|
| **Издатель** — разработчик или продакт в AI-компании | Встраивает ProofAPI и пробует через UI | «Хочу записать результат AI так, чтобы его нельзя было незаметно изменить» | Первый proof за < 30 секунд, без документации |
| **Проверяющий** — клиент, аудитор, юрист | Получил ссылку на proof | «Этот результат AI настоящий?» | Ответ за 3 секунды, без технических знаний |
| **Судья хакатона** | 3–5 минут на проект | «Что это и работает ли?» | Понимает ценность за 60 секунд демо |

## 2. Принципы (как в больших продуктах)

1. **Сначала ответ, потом детали.** Вердикт — первое и самое крупное на экране. Хэши и транзакции спрятаны в «Technical details» (прогрессивное раскрытие).
2. **Одно главное действие на экран.** Одна тёмная (primary) кнопка, остальные вторичные.
3. **Простой язык.** «AI output was changed after it was recorded», а не «output_hash mismatch».
4. **Нулевое трение на старте.** Кнопка «Try the sample contract» — proof без своего файла.
5. **Каждое действие даёт мгновенную обратную связь:** шаги прогресса, «Copied», понятные ошибки с тем, что делать дальше.
6. **Честность — часть доверия.** Везде видно, что AI в демо — mock, модель «заявлена издателем», и что именно мы не доказываем.
7. **Режим демо отделён от продукта.** Кнопки «атаки» (подмена, удаление) в отдельной панели с пунктирной рамкой и подписью «Demo».
8. **Никогда не блокируем пользователя из-за блокчейна.** Если Solana недоступна, proof сохранён, есть статус «Not on Solana yet» и кнопка повтора.
9. **Доступность:** контраст AA, фокус с клавиатуры, `role="status"` у вердикта, цвет всегда дублируется иконкой и текстом.
10. **Адаптивность:** всё работает на ширине 375 px.

## 3. Информационная архитектура

```
Верхняя навигация:  [P] ProofAPI      Create proof   History    (●) Local simulation | Solana devnet

/                 Лендинг: ценность → как работает → гарантии и границы → CTA
/new              Создать proof: файл → анализ → запись → результат
/proof/[id]       Страница proof: вердикт → проверки → детали → панель демо
/history          История издателя: сводка → записи по номерам → проблемы
/verifier.html    Независимый верификатор (план B): файл Evidence Pack → вердикт
```

## 4. Главные сценарии

### 4.1. Первый proof (издатель)
1. `/` → «Create your first proof».
2. `/new` → «Try the sample contract» (или перетащить файл).
3. «Analyze & create proof» → шаги: Analyze with AI → Hash with a secret salt → Record on Solana.
4. Карточка результата: «Proof #3 recorded», риск 31/100, найденные проблемы, кнопки **Open proof page** (primary), Copy share link, Create another.

### 4.2. Проверка по ссылке (проверяющий)
1. Открывает `/proof/[id]`.
2. Сразу видит крупный вердикт: зелёный **Verified** или красный **Verification failed** и одно предложение о том, что это значит.
3. При желании смотрит список проверок и раскрывает технические детали.

### 4.3. Демо атаки (судья)
1. На странице proof: панель «Demo: simulate an attack» → **Change the AI output** → вердикт краснеет: «The AI output was changed after it was recorded».
2. **Restore original** → снова зелёный.
3. **Delete this record from the database** → подтверждение в самой панели → переход в `/history`, запись подсвечена: «Record #3 is on Solana, but its data was deleted from the database».

## 5. Экраны

### 5.1. Лендинг `/`
```
┌──────────────────────────────────────────────────────────┐
│  Git history for AI.                                      │
│  Record what your AI received and returned. Anyone can    │
│  verify it hasn't changed — without trusting you or us.   │
│  [Create your first proof]   [See the history]            │
├──────────────────────────────────────────────────────────┤
│  1 Upload      2 AI answers      3 Fingerprints on Solana │
├──────────────────────────────────────────────────────────┤
│  What we guarantee            │  What we don't prove      │
│  ✓ Not changed after recording│  – That the issuer told   │
│  ✓ Can't be backdated         │    the truth at recording │
│  ✓ No hidden deletions        │  – Which model really ran │
│  ✓ Signed by a known issuer   │  – Legal admissibility    │
└──────────────────────────────────────────────────────────┘
```

### 5.2. Создание `/new`
```
Create a proof                                   [Demo AI (mock)]
Upload a document. We'll analyze it and record a tamper-evident proof.

┌──────────── 3/5 ────────────┐  ┌──────── 2/5 ────────┐
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │  │ What happens        │
│    Drop a PDF or TXT here    │  │ ① Analyze with AI   │
│  │ or click to choose      │  │  │ ② Hash with salt    │
│    Up to 5 MB                │  │ ③ Record on Solana  │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │  └─────────────────────┘
│  No file? [Try the sample contract]
│  [Analyze & create proof]    │
└──────────────────────────────┘
```
Состояния: пусто → файл выбран (имя, размер, «Remove») → в работе (шаги оживают, кнопка заблокирована) → успех (карточка результата) → ошибка (красный блок с текстом ошибки, кнопка «Try again»).

### 5.3. Страница proof `/proof/[id]`
```
History › Proof #3
┌──────────────────────────────────────────────────────────┐
│ ✓  Verified                                               │
│    This AI result hasn't changed since it was recorded    │
│    on 30 Sep 2026, 14:03 UTC.                             │
└──────────────────────────────────────────────────────────┘
[Copy share link] [Download evidence] [Open independent verifier] [Re-verify]

┌──── Checks (2/3) ─────────────────┐ ┌── Details (1/3) ──────┐
│ ✓ Document        Unchanged       │ │ Record     #3          │
│ ✓ AI output       Unchanged       │ │ Recorded   30 Sep 14:03│
│ ✓ Metadata        Unchanged       │ │ Issuer     7xKq…9fA   │
│ ✓ Record integrity Consistent     │ │ Model      proofapi-…  │
│ ✓ History         Linked to #2    │ │            declared    │
│ ✓ Issuer          Expected issuer │ │ Transaction ↗          │
│ ▸ Technical details               │ └────────────────────────┘
└───────────────────────────────────┘
┌──── AI result ────────────────────┐
│ 31 / 100 risk  ███░░░░░░          │
│ Termination clause · Liability …  │
└───────────────────────────────────┘
┌ ─ ─ Demo: simulate an attack ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
  [Change the AI output] [Restore original] [Delete record…]
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

### 5.4. История `/history`
```
History
Every proof your issuer has recorded, in order. Gaps and edits show up here.
┌──────────────────────────────────────────────────────────┐
│ ✕ 1 problem found in 4 records          Issuer 7xKq…9fA ⧉ │
└──────────────────────────────────────────────────────────┘
 #0  sample-contract.txt        30 Sep 14:01   ✓ Intact     View
 #1  sample-contract.txt        30 Sep 14:02   ✕ Data changed View
     The stored data no longer matches the fingerprint on Solana.
 #2  — deleted —                30 Sep 14:02   ✕ Deleted
     This record is on Solana, but its data was deleted from the database.
 #3  Hash-only proof            30 Sep 14:03   ● Hash only   View
```
Пустое состояние: «No proofs yet — Create your first proof» с primary-кнопкой.

## 6. Тексты интерфейса (главные)

| Место | Текст |
|---|---|
| Verified | **Verified** — This AI result hasn't changed since it was recorded on {date}. |
| Failed (output) | **Verification failed** — The AI output was changed after it was recorded. |
| Failed (несколько) | **Verification failed** — The document and the AI output were changed after they were recorded. |
| Failed (chain) | **Verification failed** — This record doesn't link correctly to the previous one in the history. |
| Failed (issuer) | **Verification failed** — This record was written by an unexpected issuer. |
| Not on chain | **Not on Solana yet** — We saved this proof but couldn't record it on Solana. Retry to finish. |
| Модель | {model} · *declared by the issuer* |
| Mock AI | Demo AI (mock) |
| Ошибка сети | Couldn't reach the server. Check your connection and try again. |

## 7. Визуальное направление

- Спокойный «финтех» (как Stripe, Linear): нейтральные серые (zinc), белые карточки, тонкие границы, мягкая тень.
- Смысловые цвета только для статусов: emerald — verified, red — failed, amber — pending. Бренд-акцент — почти чёрный zinc-900.
- Системный шрифт (без загрузки из сети); моноширинный — только для хэшей и адресов.
- Без градиентов, неоновых эффектов и декоративных иллюстраций.
- Отступы щедрые, максимальная ширина контента — 1024 px.

## 8. Проверка UX перед сдачей

- Первый proof с нуля за < 30 секунд, без подсказок.
- Вердикт понятен без раскрытия деталей.
- Весь демо-сценарий 4.3 проходит за < 60 секунд.
- Tab проходит по всем кнопкам, фокус виден.
- На 375 px нет горизонтальной прокрутки.
- Каждое состояние (пусто, загрузка, ошибка, успех, pending) выглядит намеренно.
