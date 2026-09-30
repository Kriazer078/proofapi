# ProofAPI MVP — Design Spec (v2)

**Дата:** 2026-09-30
**Статус:** v2 — исправлены слабые места из [разбора](../../research/2026-09-30-proofapi-weaknesses.md)
**Цель MVP:** хакатон-демо с собственным осмысленным смарт-контрактом на Solana.

## 1. Суть продукта

ProofAPI — «Git history для AI»: неизменяемая, проверяемая история действий AI.

- Off-chain: исходный документ, AI-ответ, metadata, соль.
- On-chain (Solana devnet, собственная Anchor-программа): солёные SHA-256 хэши, связанные в **цепочку истории издателя** со сквозной нумерацией.
- Проверить может кто угодно, в том числе независимым верификатором, который не обращается к нашему серверу.

**Что изменилось с v1:**
- Контракт не просто хранит хэши, а обеспечивает целостность всей истории: реестр издателей, нумерация, хэш-цепочка, ротация и отзыв ключей.
- Солёные хэши.
- Evidence Pack и независимый верификатор.
- Аудит истории находит удалённые записи.
- Режим «только хэши».
- Честные формулировки гарантий.

## 2. Гарантии — что доказываем и что нет

Эти формулировки используются в UI, документации и питче без преувеличений.

**Доказываем:**
- Данные (input, output, metadata) **не менялись после записи**.
- Запись существовала **не позже** времени блокчейна (`Clock`); задним числом её не создать.
- Запись сделана **ключом зарегистрированного издателя**, активного на момент записи.
- В истории издателя **нет вставок, удалений и перестановок** задним числом: нумерация и хэш-цепочка проверяются контрактом.

**Не доказываем (и говорим об этом прямо):**
- Что издатель записал правду в момент записи. Решение в дорожной карте — zkTLS-подтверждение от провайдера AI (§14).
- Какая модель реально использовалась: поле `model` — **заявление издателя** (`model_attestation: "declared"`).
- Что издатель записал **все** действия: незаписанное действие не обнаруживается. Удаление уже записанного — обнаруживается.
- Юридическую силу в суде. Формулировка — «технически проверяемое доказательство целостности».

## 3. Позиционирование против альтернатив

| Альтернатива | Чего не даёт по сравнению с ProofAPI |
|---|---|
| Серверные логи, hash-chain библиотеки | Оператор может пересчитать всю цепочку; нет внешнего времени |
| WORM (S3 Object Lock) | Хранилище и ключи у самой компании; проверить без доверия нельзя |
| OpenTimestamps | Нет издателей, ключей, отзыва, истории и аудита пропусков |
| Квалифицированные метки eIDAS | Юридическая презумпция в ЕС, но только для отдельного документа; нет целостности всей истории; можно добавить поверх (§14) |
| Solana Attestation Service | Аттестации отдельных утверждений; нет нумерации, хэш-цепочки и аудита истории |
| Cinchor | Собственный L1, все валидаторы у основателя; у нас публичная Solana |

**Почему Solana:** правила истории (нумерация, цепочка, права издателя) исполняет контракт, а не мы; время из `Clock`; запись дешёвая и быстрая; проверка — чтение публичных аккаунтов любым RPC.

## 4. Смарт-контракт `proof_registry`

### Аккаунт `Issuer` (PDA)

Seeds: `["issuer", authority]`.

| Поле | Тип | Описание |
|---|---|---|
| `authority` | `Pubkey` | владелец издателя, управляет ключами (холодный ключ) |
| `writer` | `Pubkey` | ключ, которым подписываются proof-ы (горячий ключ сервера или агента) |
| `name` | `[u8; 32]` | имя издателя, UTF-8, дополненное нулями |
| `active` | `bool` | деактивированный издатель не может писать |
| `proof_count` | `u64` | число записей; номер следующей записи |
| `last_record_hash` | `[u8; 32]` | `record_hash` последней записи; нули, если записей нет |
| `created_at` | `i64` | время регистрации (`Clock`) |
| `bump` | `u8` | PDA bump |

Размер: 8 + 32 + 32 + 32 + 1 + 8 + 32 + 8 + 1 = 154 байта.

### Аккаунт `ProofRecord` (PDA)

Seeds: `["proof", issuer, sequence.to_le_bytes()]`. Адрес вычисляется по номеру, поэтому историю можно обойти по порядку.

| Поле | Тип | Описание |
|---|---|---|
| `issuer` | `Pubkey` | адрес PDA издателя |
| `sequence` | `u64` | номер записи у издателя, с 0 |
| `proof_id` | `[u8; 16]` | UUID v4 |
| `input_hash` | `[u8; 32]` | `SHA256(salt ‖ input_bytes)` |
| `output_hash` | `[u8; 32]` | `SHA256(salt ‖ output_json)` |
| `metadata_hash` | `[u8; 32]` | `SHA256(salt ‖ metadata_json)` |
| `prev_record_hash` | `[u8; 32]` | `last_record_hash` издателя на момент записи |
| `record_hash` | `[u8; 32]` | хэш самой записи (формула ниже), вычисляется **в контракте** |
| `timestamp` | `i64` | `Clock::get()?.unix_timestamp` |
| `bump` | `u8` | PDA bump |

Размер: 8 + 32 + 8 + 16 + 32×5 + 8 + 1 = 233 байта. Аренда: (233 + 128) × 6,960 = 2,512,560 лампортов ≈ 0.00251 SOL; 5 SOL ≈ 1,988 записей.

**Формула `record_hash`** (sha256 от конкатенации через `solana_program::hash::hashv`):

```
record_hash = SHA256( "proofapi-v1" ‖ issuer(32) ‖ sequence(u64 LE) ‖ proof_id(16)
                    ‖ input_hash ‖ output_hash ‖ metadata_hash
                    ‖ prev_record_hash ‖ timestamp(i64 LE) )
```

### Инструкции

| Инструкция | Подписант | Что делает |
|---|---|---|
| `register_issuer(name, writer)` | `authority` | создаёт `Issuer`, `active = true`, `proof_count = 0` |
| `set_writer(new_writer)` | `authority` | ротация горячего ключа (после утечки или по расписанию) |
| `set_active(active)` | `authority` | деактивация или повторная активация издателя |
| `create_proof(proof_id, input_hash, output_hash, metadata_hash)` | `writer` | проверяет `issuer.active` и подпись `writer`; создаёт `ProofRecord` с `sequence = proof_count`, `prev_record_hash = last_record_hash`, считает `record_hash`; обновляет издателя: `proof_count += 1`, `last_record_hash = record_hash`; эмитит `ProofCreated` |

Инструкций изменения и удаления записей нет. Повторная запись с тем же номером невозможна: PDA уже существует.

**Ошибки программы:** `IssuerInactive`, `UnauthorizedWriter`, `NameTooLong` (проверка в клиенте), стандартные ошибки Anchor для подписей и `init`.

### Сборка и деплой

Через Solana Playground (beta.solpg.io): на машине нет Rust, Anchor и WSL. Исходник хранится в `programs/proof_registry/src/lib.rs`. Program ID переносится в `.env`. Клиент кодирует инструкции и аккаунты вручную по формату Anchor (discriminator = первые 8 байт `sha256("global:<instruction>")` / `sha256("account:<Account>")`), без `@coral-xyz/anchor` и IDL.

## 5. Хэширование и соль

- Для каждого proof генерируется `salt` — 32 случайных байта.
- `input_hash = SHA256(salt ‖ сырые байты файла)`.
- `output_hash = SHA256(salt ‖ canonical_json(ai_result))`.
- `metadata_hash = SHA256(salt ‖ canonical_json(metadata))`.
- `canonical_json` — JSON с рекурсивно отсортированными ключами, без пробелов, без `undefined`.
- В БД `output_json` и `metadata_json` хранятся уже канонически. Verifier хэширует хранимую строку как есть.
- Соль хранится off-chain (БД, Evidence Pack) и в блокчейн не попадает. Это закрывает перебор коротких ответов и снижает риски GDPR.

## 6. Off-chain модули (`lib/`)

| Модуль | Ответственность |
|---|---|
| `hashing.ts` | `sha256Hex`, `canonicalJson`, `saltedHash(salt, data)`, `newSalt()` |
| `ai-provider.ts` | интерфейс `AIProvider`; `MockAIProvider` (детерминированный, `name: "mock"`, `model: "proofapi-mock-v1"`) |
| `extract-text.ts` | текст из PDF и TXT, лимит 5 МБ, ошибки валидации |
| `solana/encoding.ts` | discriminators, кодирование инструкций, декодирование `Issuer` и `ProofRecord`, PDA, `computeRecordHash` (зеркало формулы из контракта) |
| `solana/memory-client.ts` | `InMemoryChainClient` — та же логика, что у контракта (нумерация, цепочка, активность, writer), для тестов и разработки |
| `solana/anchor-client.ts` | `AnchorChainClient` — реальная программа на devnet |
| `solana/index.ts` | выбор клиента по `CHAIN_MODE=memory\|anchor` |
| `proof-repo.ts` | интерфейс хранилища + реализация на Prisma; `proof-repo-memory.ts` для тестов |
| `proof-service.ts` | создание proof, режим «только хэши», повтор записи в цепь, demo-подмена, восстановление и удаление |
| `verifier.ts` | проверка одного proof: хэши, `record_hash`, связь с предыдущей записью, издатель |
| `history-audit.ts` | аудит истории издателя: обход цепочки в Solana и сравнение с БД |
| `evidence-pack.ts` | сборка Evidence Pack |

### Интерфейс `ChainClient`

```ts
interface ChainClient {
  issuerAddress(): string;                        // PDA издателя
  ensureIssuer(name: string): Promise<IssuerState>; // memory: регистрирует сам; anchor: читает, ошибка если издатель не зарегистрирован
  anchorProof(p: { proofId; inputHash; outputHash; metadataHash }):
    Promise<{ signature: string; account: string; sequence: number;
              recordHash: string; prevRecordHash: string; timestamp: number }>;
  readIssuer(issuer: string): Promise<IssuerState | null>;
  readProofBySequence(issuer: string, sequence: number): Promise<ChainProofRecord | null>;
  readProofAccount(account: string): Promise<ChainProofRecord | null>;
  explorerUrl(signature: string): string | null;
}
```

## 7. Проверки

### `verifyProof(proofId)` → `VerificationResult`

1. Загрузить из БД данные, соль, адрес аккаунта и номер.
2. Пересчитать три солёных хэша.
3. Прочитать `ProofRecord` из Solana. Для реального клиента проверить, что владелец аккаунта — наша программа и discriminator совпадает.
4. Проверки:
   - `input`, `output`, `metadata`: пересчитанный хэш равен on-chain;
   - `record`: `computeRecordHash(on-chain поля)` равен on-chain `record_hash`;
   - `chain`: для `sequence > 0` `prev_record_hash` равен `record_hash` записи `sequence − 1`; для `sequence = 0` — нули;
   - `issuer`: on-chain `issuer` равен ожидаемому издателю (из env, не из БД).
5. `VERIFIED`, только если все проверки прошли; `NOT_ON_CHAIN`, если записи нет.

```ts
interface VerificationResult {
  status: "VERIFIED" | "FAILED" | "NOT_ON_CHAIN";
  checks: {
    input: HashCheck; output: HashCheck; metadata: HashCheck;
    record: { ok: boolean };
    chain: { ok: boolean; sequence: number };
    issuer: { ok: boolean; expected: string; onChain: string };
  };
  onChainTimestamp: number | null;
  explorerUrl: string | null;
}
interface HashCheck { ok: boolean; stored: string; current: string } // stored = on-chain
```

### `auditHistory()` → `HistoryAudit`

Обходит записи издателя `0 … proof_count − 1` в Solana и для каждой проверяет:
- запись есть в БД (иначе `MISSING_IN_DATABASE` — запись удалили у себя);
- данные в БД дают те же хэши (иначе `DATA_MODIFIED`);
- цепочка не разорвана (иначе `CHAIN_BROKEN`).

Записи, созданные в режиме «только хэши», получают статус `HASH_ONLY`: содержимого у нас нет, проверяется только наличие и цепочка.

Возвращает список записей со статусами и сводку: сколько всего, сколько в порядке, какие номера проблемные.

## 8. API

| Метод | Путь | Описание |
|---|---|---|
| POST | `/api/proofs` | multipart: `file` + опционально `agent_id`, `tool_name`, `action_type`, `external_api`, `parent_proof_id` → анализ, proof, запись в цепь |
| POST | `/api/proofs/hashes` | JSON `{ input_hash, output_hash, metadata_hash }` — режим «только хэши»: данные остаются у клиента, мы только записываем в цепь |
| GET | `/api/proofs` | список |
| GET | `/api/proofs/[id]` | данные proof |
| GET | `/api/proofs/[id]/verify` | `VerificationResult` |
| GET | `/api/proofs/[id]/evidence` | скачать Evidence Pack (JSON) |
| POST | `/api/proofs/[id]/retry` | повтор записи в цепь |
| POST | `/api/proofs/[id]/tamper` | demo: подменить output |
| POST | `/api/proofs/[id]/restore` | demo: вернуть оригинал |
| POST | `/api/proofs/[id]/delete` | demo: удалить запись из БД (имитация «спрятать неудобное») |
| GET | `/api/history/audit` | `HistoryAudit` |

Metadata proof-а: `{ provider, model, model_attestation: "declared", created_at, file_name, agent_id?, tool_name?, action_type?, external_api?, parent_proof_id? }`.

## 9. Evidence Pack и независимый верификатор

### Evidence Pack (`proofapi-evidence-v1`)

```json
{
  "version": "proofapi-evidence-v1",
  "cluster": "devnet",
  "rpc_url": "https://api.devnet.solana.com",
  "program_id": "<program id>",
  "issuer": "<issuer PDA>",
  "proof_account": "<ProofRecord address>",
  "sequence": 5,
  "proof_id": "<uuid>",
  "salt": "<hex>",
  "input": { "file_name": "contract.pdf", "content_base64": "..." },
  "output_json": "<canonical json string>",
  "metadata_json": "<canonical json string>"
}
```

### Независимый верификатор

Один файл `public/verifier.html` без зависимостей и без обращений к нашему API. Его можно скачать и открыть откуда угодно.

1. Пользователь загружает Evidence Pack.
2. Страница считает солёные хэши через WebCrypto.
3. Запрашивает `getAccountInfo(proof_account)` напрямую у публичного RPC Solana.
4. Проверяет, что владелец аккаунта — `program_id`, discriminator равен `sha256("account:ProofRecord")[0..8]`, поля `issuer` и `sequence` совпадают с пакетом.
5. Сравнивает хэши, пересчитывает `record_hash` и показывает VERIFIED или FAILED по каждому полю.

PDA в браузере не вычисляется: аккаунт, принадлежащий программе, с верным discriminator и полями может создать только наша программа.

Верификатор работает только с записями в реальной сети (`CHAIN_MODE=anchor`). В memory-режиме кнопка его открытия скрыта.

## 10. UI

- `/` — лендинг: «Git history для AI», три гарантии, честный блок «что мы не доказываем», кнопка «Try the demo».
- `/new` — загрузка файла или «Use sample contract»; шаги Analyzing → Hashing → Anchoring → Done; метка **«Demo AI (mock)»**.
- `/proof/[id]` — баннер VERIFIED / FAILED с указанием поля; таблица проверок (input, output, metadata, record, chain, issuer); номер в истории и ссылка на предыдущую запись; модель с пометкой «заявлена издателем»; кнопки Re-verify, Simulate tampering, Restore, Download Evidence Pack, Open independent verifier.
- `/history` — вся история издателя по номерам со статусами аудита; кнопка demo «Delete record from database»; удалённая запись подсвечивается: «Запись №5 есть в Solana, но удалена из базы».
- `/verifier.html` — независимый верификатор.

## 11. Сценарий демо

1. Загрузить документ → AI отвечает → proof №N в Solana, ссылка в Explorer.
2. Simulate tampering → **VERIFICATION FAILED — OUTPUT HAS BEEN MODIFIED**.
3. Delete record → на `/history`: **«Запись №N удалена из базы — в Solana она есть»**.
4. Download Evidence Pack → открыть `verifier.html` → проверка напрямую через Solana, без нашего сервера.

## 12. Ошибки

- Solana недоступна или нет SOL → proof в `PENDING_CHAIN`, кнопка «Retry anchoring».
- Издатель деактивирован → запись отклоняется с понятным сообщением.
- Файл не того типа или больше 5 МБ → 400. PDF без текста → 400 «No text found in document».
- Невалидные хэши в режиме «только хэши» → 400.

## 12a. Настройка окружения и ключи

- `npm run setup` создаёт две пары ключей в `.keys/` (папка в `.gitignore`): `authority.json` — управление издателем, и `writer.json` — подпись proof-ов. Печатает адреса и инструкцию пополнить их через faucet.solana.com.
- `npm run register-issuer` (подпись `authority`) регистрирует издателя с `writer`. Сервер при работе использует только `writer`.
- `.env`: `CHAIN_MODE`, `SOLANA_RPC_URL`, `PROGRAM_ID`, `AUTHORITY_PUBKEY`, `WRITER_KEYPAIR_PATH`, `ISSUER_NAME`, `DATABASE_URL`.

## 13. Тесты

- `hashing`: известный вектор SHA-256, детерминизм `canonicalJson`, солёный хэш меняется при другой соли.
- `ai-provider` (mock): детерминизм, образец договора даёт 31.
- `solana/encoding`: discriminators, кодирование инструкций, декодирование обоих аккаунтов, `computeRecordHash` на фиксированном векторе.
- `memory-client`: нумерация, цепочка, отказ неактивному издателю и чужому writer.
- `proof-service`: успешный путь, `PENDING_CHAIN` и retry, режим «только хэши», подмена, восстановление, удаление.
- `verifier`: VERIFIED; FAILED по input, output, metadata; FAILED по chain при подмене `prev`; NOT_ON_CHAIN.
- `history-audit`: удалённая из БД запись → `MISSING_IN_DATABASE`; изменённая → `DATA_MODIFIED`.
- Контракт: тесты в Playground — регистрация, запись с верной нумерацией и цепочкой, отказ чужому writer, отказ после деактивации.
- Ручной end-to-end на devnet, включая `verifier.html`.

## 14. После MVP (backlog)

- **zkTLS-подтверждение ответа провайдера AI** (TLSNotary, Reclaim, Opacity): доказать, что output пришёл с `api.openai.com` / `api.anthropic.com`. Закрывает слабости «целостность ≠ правдивость» и «модель — заявление».
- **Квалифицированная метка eIDAS** поверх `record_hash` для юридической силы в ЕС.
- **Батчинг:** один on-chain аккаунт на пачку proof-ов (Merkle-корень) с той же нумерацией и цепочкой батчей.
- **SDK** (TypeScript, Python) с хэшированием на стороне клиента.
- **Реальный AI-провайдер** с оптимизацией токенов: кэш по `input_hash`, дешёвая модель, лимит `max_tokens`, prompt caching.

## 15. Стек

Next.js 15 (App Router, TypeScript), Tailwind, SQLite через Prisma 6, `@solana/web3.js` v1, `pdf-parse`, Vitest; контракт — Rust и Anchor через Solana Playground. Язык UI — английский.

## 16. Порядок работ

1. Каркас Next.js; hashing, mock-AI, извлечение текста; encoding и `InMemoryChainClient` с полной логикой цепочки; repo, proof-service, verifier, history-audit, evidence-pack.
2. API и UI: `/new`, `/proof/[id]`, `/history`, лендинг, `verifier.html`.
3. Контракт в Playground: написать, протестировать, задеплоить.
4. `AnchorChainClient`, переключение на `CHAIN_MODE=anchor`, end-to-end на devnet.

Демо работает в memory-режиме уже после шага 2.
