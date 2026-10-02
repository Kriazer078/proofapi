import type { Locale } from "@/lib/i18n/messages";

/** First screen of the home page and the matching header actions. */
const en = {
  title: ["Every AI answer —", "with proof"],
  sub: "One line in your code, and every model answer comes with a link. Anyone who opens it can see the answer was not changed.",
  start: "Start free",
  demo: "Book a demo",
  signIn: "Sign in",
  shot: {
    alt: "Example certificate: the AI answer is genuine and all four checks pass.",
    title: "ProofAPI certificate",
    record: "record 1042",
    verdict: "Genuine",
    verdictSub: "The answer has not changed since sealing · 1 October 2026, 12:04",
    facts: [
      ["Task", "Contract review"],
      ["Model", "gemini-flash-lite"],
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
  shot: {
    alt: "Пример сертификата: ответ AI подлинный, все четыре проверки пройдены.",
    title: "Сертификат ProofAPI",
    record: "запись 1042",
    verdict: "Подлинный",
    verdictSub: "Ответ не менялся с момента печати · 1 октября 2026, 12:04",
    facts: [
      ["Задача", "Оценка договора"],
      ["Модель", "gemini-flash-lite"],
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
  shot: {
    alt: "Сертификат мысалы: AI жауабы түпнұсқа, төрт тексеру де өтті.",
    title: "ProofAPI сертификаты",
    record: "жазба 1042",
    verdict: "Түпнұсқа",
    verdictSub: "Мөр басылғаннан бері жауап өзгермеген · 2026 жылғы 1 қазан, 12:04",
    facts: [
      ["Тапсырма", "Шартты бағалау"],
      ["Модель", "gemini-flash-lite"],
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
