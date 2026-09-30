# ProofAPI MVP — Design Spec

**Дата:** 2026-09-30
**Статус:** утверждён
**Цель MVP:** хакатон-демо. Приоритеты — наглядность, надёжность на показе, наличие собственного смарт-контракта на Solana.

## 1. Суть продукта

ProofAPI — «нотариус» для действий AI. Он не хранит данные в блокчейне и не анализирует их сам — он фиксирует факт «AI получил input X, вернул output Y, в момент T, с такой-то моделью», так что последующая подмена данных обнаруживается.

- Off-chain (наша БД): исходный документ, AI-ответ, metadata.
- On-chain (Solana devnet, собственная программа): только SHA-256 хэши, proof_id, issuer, timestamp.
- Верификация: пересчитать хэши из off-chain данных и сравнить с on-chain записью.

## 2. Scope

**В MVP:**
- Загрузка документа (PDF или TXT), извлечение текста.
- AI-анализ через интерфейс `AIProvider`; в MVP — детерминированный mock.
- Создание proof: 3 хэша → запись в собственную Anchor-программу на devnet → сохранение в БД.
- Страница верификации `/proof/[id]` с разбивкой по полям и ссылкой на Solana Explorer.
- Tampering demo: подмена AI-ответа в БД → VERIFICATION FAILED → восстановление.
- Список proof-ов.
- Agent-поля в модели данных и API (без отдельного UI).

**Вне MVP:** реальный AI-провайдер (подключается позже через `AIProvider`), авторизация и API-ключи, мульти-тенантность, UI для agent-цепочек, mainnet, подключение Phantom в приложении.

## 3. Стек

| Слой | Технология |
|---|---|
| Web + API | Next.js 15 (App Router), TypeScript |
| UI | Tailwind CSS |
| БД | SQLite через Prisma |
| Смарт-контракт | Rust + Anchor, сборка и деплой через Solana Playground (beta.solpg.io) |
| Solana-клиент | `@solana/web3.js`, `@coral-xyz/anchor` |
| PDF | `pdf-parse` |
| Тесты | Vitest |

Причина Playground: на машине нет Rust, Solana CLI, Anchor и WSL; локальная установка на Windows рискованна для хакатона. Исходник программы хранится в репозитории.

Язык UI — английский.

## 4. Смарт-контракт `proof_registry`

### Аккаунт `ProofRecord` (PDA)

Seeds: `["proof", issuer_pubkey, proof_id]`.

| Поле | Тип | Описание |
|---|---|---|
| `proof_id` | `[u8; 16]` | UUID v4 в байтах |
| `input_hash` | `[u8; 32]` | SHA-256 input |
| `output_hash` | `[u8; 32]` | SHA-256 output |
| `metadata_hash` | `[u8; 32]` | SHA-256 канонического JSON metadata |
| `previous_proof_hash` | `[u8; 32]` | хэш предыдущего proof в agent-цепочке; все нули, если нет |
| `issuer` | `Pubkey` | подписант транзакции |
| `timestamp` | `i64` | `Clock::get()?.unix_timestamp` — время блокчейна |
| `bump` | `u8` | PDA bump |

Размер: 8 (discriminator) + 16 + 32×4 + 32 + 8 + 1 = 193 байта. Аренда ≈ 0.0022 SOL.

### Инструкция `create_proof(proof_id, input_hash, output_hash, metadata_hash, previous_proof_hash)`

- `issuer` — `Signer`, платит за аккаунт.
- Аккаунт создаётся через `init` → повторный вызов с тем же `proof_id` падает.
- `timestamp` записывается из `Clock`, клиент его не передаёт.
- Эмитит событие `ProofCreated { proof_id, issuer, timestamp }`.

Инструкций update/delete нет. Неизменяемость обеспечена кодом программы.

### Деплой

1. Кошелёк Playground пополняется через faucet.solana.com (GitHub-логин, 5 SOL).
2. Build + Deploy в Playground на devnet.
3. Program ID и IDL (`idl.json`) переносятся в репозиторий.

## 5. Off-chain модули

Каждый модуль — отдельный файл в `lib/` с одной ответственностью.

### `lib/hashing.ts`
- `sha256Hex(data: string | Buffer): string`
- `canonicalJson(obj): string` — JSON с рекурсивно отсортированными ключами, без пробелов.
- `hashMetadata(meta): string` = `sha256Hex(canonicalJson(meta))`.
- Input хэшируется по **сырым байтам загруженного файла**. Output хэшируется как `canonicalJson(aiResult)`.
- В БД `outputJson` и `metadataJson` хранятся уже в каноническом виде; verifier хэширует хранимую строку как есть (без повторного парсинга), поэтому любое изменение строки ловится.

### `lib/ai-provider.ts`
```ts
interface AIProvider {
  name: string;   // "mock"
  model: string;  // "proofapi-mock-v1"
  analyze(text: string): Promise<AnalysisResult>;
}
interface AnalysisResult {
  riskScore: number;        // 0..100
  issues: string[];
  summary: string;
}
```
Mock: ищет ключевые слова (termination, liability, penalty, payment, indemnif…) и детерминированно считает riskScore из найденных совпадений и длины текста. Один и тот же текст → один и тот же результат.

### `lib/solana/`
```ts
interface ChainClient {
  anchorProof(p: ChainProofInput): Promise<{ signature: string; pda: string }>;
  readProof(proofId: string, issuer: string): Promise<ChainProofRecord | null>;
  issuerPubkey(): string;
}
```
- `AnchorChainClient` — реальная программа на devnet.
- `InMemoryChainClient` — для тестов и локальной разработки до деплоя контракта.
- Выбор по env: `CHAIN_MODE=anchor|memory`.

### `lib/proof-service.ts`
`createProof(file, agentFields?)`:
1. Извлечь текст → `AIProvider.analyze`.
2. Собрать metadata: `{ provider, model, created_at, file_name, agent_id?, tool_name?, action_type?, external_api? }`.
3. Посчитать 3 хэша, сгенерировать `proof_id` (UUID v4).
4. Сохранить в БД со статусом `PENDING_CHAIN`.
5. `ChainClient.anchorProof` → статус `ANCHORED`, сохранить `solana_transaction`, `pda`, on-chain `timestamp`.
6. При ошибке сети — статус остаётся `PENDING_CHAIN`, ошибка возвращается в UI; `retryAnchoring(proofId)` повторяет шаг 5.

### `lib/verifier.ts`
`verifyProof(proofId): VerificationResult`
1. Загрузить off-chain данные из БД.
2. Пересчитать хэши из хранимых input/output/metadata.
3. Вычислить PDA из `proof_id` и ожидаемого issuer (из env, не из БД) и прочитать аккаунт из Solana.
4. Сравнить каждое поле.

```ts
interface VerificationResult {
  status: "VERIFIED" | "FAILED" | "NOT_ON_CHAIN";
  checks: {
    input:    { ok: boolean; stored: string; current: string };
    output:   { ok: boolean; stored: string; current: string };
    metadata: { ok: boolean; stored: string; current: string };
    issuer:   { ok: boolean; expected: string; onChain: string };
  };
  onChainTimestamp: number | null;
  explorerUrl: string | null;
}
```
`stored` — значение из блокчейна, `current` — пересчитанное. `VERIFIED` только если все четыре проверки `ok`.

## 6. Модель данных (Prisma, SQLite)

`Proof`:
`id` (UUID, = proof_id), `inputBlob` (Bytes), `inputFileName`, `inputText`, `outputJson` (String), `metadataJson` (String), `inputHash`, `outputHash`, `metadataHash`, `provider`, `model`, `creatorWallet` (issuer pubkey), `status` (`PENDING_CHAIN` | `ANCHORED`), `solanaTransaction?`, `pda?`, `chainTimestamp?`, `agentId?`, `toolName?`, `actionType?`, `externalApi?`, `previousProofHash?`, `tamperedBackupJson?`, `createdAt`.

## 7. API

| Метод | Путь | Описание |
|---|---|---|
| POST | `/api/proofs` | multipart: `file` + опциональные agent-поля → создаёт proof |
| GET | `/api/proofs` | список |
| GET | `/api/proofs/[id]` | данные proof |
| GET | `/api/proofs/[id]/verify` | `VerificationResult` |
| POST | `/api/proofs/[id]/retry` | повтор записи в Solana |
| POST | `/api/proofs/[id]/tamper` | demo: подменить output |
| POST | `/api/proofs/[id]/restore` | demo: вернуть оригинал |

## 8. UI

- `/` — лендинг: «Immutable audit trail for AI», схема пайплайна, кнопка «Try the demo».
- `/new` — загрузка файла (есть кнопка «Use sample contract»), анимированные шаги: Analyzing → Hashing → Anchoring on Solana → Done. Показ AI-результата и хэшей, переход на proof.
- `/proof/[id]` — большой статус-баннер (зелёный VERIFIED / красный VERIFICATION FAILED с указанием поля, например «OUTPUT HAS BEEN MODIFIED»), таблица проверок со stored vs current хэшами (различие подсвечено), AI-результат, metadata, ссылка на Explorer, кнопки «Re-verify», «Simulate tampering», «Restore original».
- `/proofs` — таблица proof-ов со статусами.

## 9. Tampering demo

- `tamper`: сохраняет оригинальный `outputJson` в `tamperedBackupJson`, записывает изменённый результат (`riskScore` → 5, issues очищены). Хэши в БД и блокчейне не трогаются.
- Повторная верификация: `output.current ≠ output.stored` → `FAILED`, баннер «OUTPUT HAS BEEN MODIFIED», показаны оба хэша.
- `restore`: возвращает оригинал из бэкапа → снова `VERIFIED`.
- Страница явно помечает, что это симуляция атаки на off-chain хранилище.

## 10. Ошибки

- Solana недоступна / нет SOL → proof в `PENDING_CHAIN`, понятное сообщение, кнопка «Retry anchoring».
- Аккаунт в блокчейне не найден → `NOT_ON_CHAIN`.
- Неподдерживаемый файл или >5 МБ → 400 с сообщением.
- PDF без извлекаемого текста → 400 «No text found in document».

## 11. Настройка окружения

- `npm run setup`: генерирует серверный issuer-кошелёк в `.keys/issuer.json` (в `.gitignore`), печатает pubkey и инструкцию пополнить его через faucet.solana.com.
- `.env`: `CHAIN_MODE`, `SOLANA_RPC_URL` (devnet), `PROGRAM_ID`, `ISSUER_KEYPAIR_PATH`, `DATABASE_URL`.

## 12. Тесты

- `hashing`: детерминизм, изменение одного байта меняет хэш, canonicalJson не зависит от порядка ключей.
- `ai-provider` (mock): детерминизм, диапазон 0..100.
- `verifier` с `InMemoryChainClient`: VERIFIED для чистого proof; FAILED с правильным полем при подмене input, output, metadata; FAILED по issuer при чужом подписанте; NOT_ON_CHAIN.
- `proof-service`: успешный путь, `PENDING_CHAIN` при ошибке chain-клиента, retry.
- Контракт: тест в Playground — create_proof успешен, повторный create_proof с тем же id падает.
- Ручной end-to-end на devnet.

## 13. Порядок работ

1. Next.js-каркас, hashing, mock-AI, БД, proof-service, verifier на `InMemoryChainClient`.
2. UI: `/new`, `/proof/[id]`, tampering demo, `/proofs`, лендинг.
3. Контракт в Playground: написать, протестировать, задеплоить; перенести Program ID и IDL.
4. `AnchorChainClient`, переключение на `CHAIN_MODE=anchor`, end-to-end на devnet.

Демо работает после шага 2 (в memory-режиме), так что задержка с контрактом не блокирует показ.
