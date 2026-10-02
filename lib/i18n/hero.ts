import type { Locale } from "@/lib/i18n/messages";

/** First screen of the home page and the matching header actions. */
const en = {
  title: ["Every AI answer —", "with proof"],
  sub: "One line in your code, and every model answer comes with a link. Anyone who opens it can see the answer was not changed.",
  start: "Start free",
  demo: "Book a demo",
  signIn: "Sign in",
  tamper: {
    title: "Try to fake it",
    text: "Change the AI answer after it was sealed. The record on Solana stays the same, so the certificate shows the change at once.",
    button: "Change 72 to 12",
    restore: "Put it back",
    hint: "Runs in your browser. Nothing is written.",
    changed: "Changed",
    changedSub: "The answer was edited after sealing",
    rows: [
      ["Input", "matches", "matches"],
      ["AI answer", "unchanged", "changed"],
      ["Record on Solana", "in place", "in place"],
    ],
    answerBefore: "Risk:",
    answerAfter: "of 100. Clause 4.2 lets the supplier change the price unilaterally.",
  },
  chain: {
    title: "Records form a chain",
    text: "Each record stores the fingerprint of the one before it. Quietly deleting or replacing a record breaks the chain, and the history check shows where.",
    example: "Example, not live data",
    pause: "Pause",
    resume: "Resume",
  },
  shot: {
    alt: "Example certificate: the AI answer is genuine and all four checks pass.",
    title: "ProofAPI certificate",
    record: "record 1042",
    verdict: "Genuine",
    verdictSub: "The answer has not changed since sealing · 1 October 2026, 12:04",
    facts: [
      ["Task", "Contract review"],
      ["Fingerprint", "b7d2…19fa"],
      ["Network", "Solana devnet"],
      ["Issued by", "ProofAPI"],
    ],
    checks: [
      "Input matches the record",
      "Answer matches the record",
      "Record found on Solana",
      "Record chain is unbroken",
    ],
    answerLabel: "Model answer",
    answer:
      "Risk: 72 of 100. Clause 4.2 lets the supplier change the price unilaterally. Recommendation: do not sign until this clause is amended.",
  },
};

export type HeroCopy = typeof en;

const ru: HeroCopy = {
  title: ["Каждый ответ AI —", "с доказательством"],
  sub: "Одна строка в вашем коде, и к ответу модели прилагается ссылка. По ней любой увидит, что ответ не меняли.",
  start: "Начать бесплатно",
  demo: "Записаться на демо",
  signIn: "Войти",
  tamper: {
    title: "Попробуйте подделать",
    text: "Измените ответ AI после печати. Запись в Solana остаётся прежней, поэтому сертификат сразу показывает подмену.",
    button: "Заменить 72 на 12",
    restore: "Вернуть как было",
    hint: "Работает в браузере, ничего не записывается.",
    changed: "Изменён",
    changedSub: "Ответ изменили после печати",
    rows: [
      ["Вход", "совпадает", "совпадает"],
      ["Ответ AI", "не изменён", "изменён"],
      ["Запись в Solana", "на месте", "на месте"],
    ],
    answerBefore: "Риск:",
    answerAfter: "из 100. Пункт 4.2 позволяет поставщику менять цену в одностороннем порядке.",
  },
  chain: {
    title: "Записи связаны в цепочку",
    text: "Каждая запись хранит отпечаток предыдущей. Тихо удалить или подменить одну не получится: цепочка разорвётся, и проверка истории покажет, где.",
    example: "Пример, данные не настоящие",
    pause: "Пауза",
    resume: "Продолжить",
  },
  shot: {
    alt: "Пример сертификата: ответ AI подлинный, все четыре проверки пройдены.",
    title: "Сертификат ProofAPI",
    record: "запись 1042",
    verdict: "Подлинный",
    verdictSub: "Ответ не менялся с момента печати · 1 октября 2026, 12:04",
    facts: [
      ["Задача", "Оценка договора"],
      ["Отпечаток", "b7d2…19fa"],
      ["Сеть", "Solana devnet"],
      ["Выдал", "ProofAPI"],
    ],
    checks: [
      "Вход совпадает с записью",
      "Ответ совпадает с записью",
      "Запись найдена в Solana",
      "Цепочка записей не разорвана",
    ],
    answerLabel: "Ответ модели",
    answer:
      "Риск: 72 из 100. Пункт 4.2 позволяет поставщику менять цену в одностороннем порядке. Рекомендация: не подписывать без правки этого пункта.",
  },
};

const kk: HeroCopy = {
  title: ["AI-дың әр жауабы —", "дәлелімен"],
  sub: "Кодыңызда бір жол, және модельдің әр жауабына сілтеме қоса беріледі. Оны ашқан кез келген адам жауаптың өзгермегенін көреді.",
  start: "Тегін бастау",
  demo: "Демоға жазылу",
  signIn: "Кіру",
  tamper: {
    title: "Жалған жасап көріңіз",
    text: "Мөрден кейін AI жауабын өзгертіңіз. Solana-дағы жазба өзгермейді, сондықтан сертификат өзгерісті бірден көрсетеді.",
    button: "72-ні 12-ге ауыстыру",
    restore: "Қайтару",
    hint: "Браузерде жұмыс істейді, ештеңе жазылмайды.",
    changed: "Өзгертілген",
    changedSub: "Жауап мөрден кейін өзгертілді",
    rows: [
      ["Кіріс", "сәйкес", "сәйкес"],
      ["AI жауабы", "өзгермеген", "өзгертілген"],
      ["Solana-дағы жазба", "орнында", "орнында"],
    ],
    answerBefore: "Тәуекел:",
    answerAfter: "/ 100. 4.2-тармақ жеткізушіге бағаны біржақты өзгертуге мүмкіндік береді.",
  },
  chain: {
    title: "Жазбалар тізбекке байланған",
    text: "Әр жазба алдыңғысының ізін сақтайды. Бір жазбаны білдірмей өшіру не ауыстыру мүмкін емес: тізбек үзіледі, ал тарих тексеруі қай жерде екенін көрсетеді.",
    example: "Мысал, нақты деректер емес",
    pause: "Кідірту",
    resume: "Жалғастыру",
  },
  shot: {
    alt: "Сертификат мысалы: AI жауабы түпнұсқа, төрт тексеру де өтті.",
    title: "ProofAPI сертификаты",
    record: "жазба 1042",
    verdict: "Түпнұсқа",
    verdictSub: "Мөр басылғаннан бері жауап өзгермеген · 2026 жылғы 1 қазан, 12:04",
    facts: [
      ["Тапсырма", "Шартты бағалау"],
      ["Хэш", "b7d2…19fa"],
      ["Желі", "Solana devnet"],
      ["Берген", "ProofAPI"],
    ],
    checks: [
      "Кіріс жазбамен сәйкес",
      "Жауап жазбамен сәйкес",
      "Жазба Solana-да табылды",
      "Жазбалар тізбегі үзілмеген",
    ],
    answerLabel: "Модель жауабы",
    answer:
      "Тәуекел: 100-ден 72. 4.2-тармақ жеткізушіге бағаны біржақты өзгертуге мүмкіндік береді. Ұсыныс: бұл тармақ түзетілмейінше қол қоймаңыз.",
  },
};

export const HERO: Record<Locale, HeroCopy> = { en, ru, kk };
