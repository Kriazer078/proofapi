import type { Locale } from "@/lib/i18n/messages";

/** Copy for the "Book a demo" form. */
const en = {
  title: "Book a demo",
  lead: "Tell us a little about your team. We'll reply by email to arrange a 20-minute call.",
  name: "Your name",
  email: "Work email",
  company: "Company",
  optional: "optional",
  message: "What do you want to prove?",
  messagePlaceholder: "For example: our support agent approves refunds and clients dispute them.",
  submit: "Send request",
  sending: "Sending…",
  privacy: "We use these details only to reply to you.",
  privacyLink: "Privacy",
  doneTitle: "Request sent",
  doneText: "Thank you. We'll write to {email} soon.",
  close: "Close",
  errors: {
    demo_name: "Enter your name.",
    demo_email: "Enter a valid email address.",
    demo_rate_limited: "Too many requests from this address. Try again in an hour.",
    generic: "Couldn't send the request. Try again, or email proofapiofficial@gmail.com.",
  },
};

export type DemoCopy = typeof en;

const ru: DemoCopy = {
  title: "Записаться на демо",
  lead: "Расскажите немного о команде. Мы ответим на почту и договоримся о звонке на 20 минут.",
  name: "Ваше имя",
  email: "Рабочая почта",
  company: "Компания",
  optional: "необязательно",
  message: "Что вы хотите доказывать?",
  messagePlaceholder: "Например: наш агент поддержки одобряет возвраты, а клиенты их оспаривают.",
  submit: "Отправить заявку",
  sending: "Отправляем…",
  privacy: "Эти данные нужны только для ответа вам.",
  privacyLink: "Конфиденциальность",
  doneTitle: "Заявка отправлена",
  doneText: "Спасибо. Скоро напишем на {email}.",
  close: "Закрыть",
  errors: {
    demo_name: "Введите имя.",
    demo_email: "Введите корректную почту.",
    demo_rate_limited: "Слишком много заявок с этого адреса. Попробуйте через час.",
    generic: "Не удалось отправить. Попробуйте ещё раз или напишите на proofapiofficial@gmail.com.",
  },
};

const kk: DemoCopy = {
  title: "Демоға жазылу",
  lead: "Командаңыз туралы қысқаша айтыңыз. Біз поштаға жауап беріп, 20 минуттық қоңырауды келісеміз.",
  name: "Атыңыз",
  email: "Жұмыс поштасы",
  company: "Компания",
  optional: "міндетті емес",
  message: "Нені дәлелдегіңіз келеді?",
  messagePlaceholder: "Мысалы: қолдау агентіміз қайтаруларды мақұлдайды, ал клиенттер оларға дау айтады.",
  submit: "Өтінім жіберу",
  sending: "Жіберілуде…",
  privacy: "Бұл деректер тек сізге жауап беру үшін қажет.",
  privacyLink: "Құпиялылық",
  doneTitle: "Өтінім жіберілді",
  doneText: "Рахмет. Жақында {email} поштасына жазамыз.",
  close: "Жабу",
  errors: {
    demo_name: "Атыңызды енгізіңіз.",
    demo_email: "Дұрыс пошта енгізіңіз.",
    demo_rate_limited: "Бұл мекенжайдан өтінім тым көп. Бір сағаттан кейін қайталаңыз.",
    generic: "Жіберу мүмкін болмады. Қайталап көріңіз немесе proofapiofficial@gmail.com поштасына жазыңыз.",
  },
};

export const DEMO: Record<Locale, DemoCopy> = { en, ru, kk };
