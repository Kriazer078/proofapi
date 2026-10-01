/** Copy for the commercial pages: pricing, developers, trust, contact, legal. Kept apart from product UI copy. */

export const GITHUB_URL = "https://github.com/Kriazer078/proofapi";
export const CONTACT_URL = "https://github.com/Kriazer078/proofapi/issues";

const en = {
  nav: { developers: "Developers", pricing: "Pricing" },
  seal: { genuine: "GENUINE", changed: "CHANGED", pending: "NOT SEALED", ring: "PROOFAPI · DIGITAL SEAL · SOLANA · " },
  trust: ["Open source on GitHub", "Seals recorded on Solana", "Your document is never published", "English, Russian, Kazakh"],
  scenario: {
    title: "What it looks like in practice",
    steps: [
      { who: "A lawyer", text: "runs an AI review of a client's NDA and sends the certificate link instead of a PDF." },
      { who: "The client", text: "opens the link on a phone. It says Genuine, sealed on 1 October." },
      { who: "Three months later", text: "someone shows a version with a lower risk score. Its seal doesn't match, so the dispute ends there." },
    ],
  },
  dev: {
    teaserTitle: "Built for developers too",
    teaserText: "Every certificate is one HTTP request. Keep documents on your side and send only fingerprints if you prefer.",
    teaserCta: "Read the API guide",
    title: "API for developers",
    lead: "Seal AI results from your own app. No SDK needed: plain HTTP and JSON.",
    baseUrl: "Base URL",
    limits: "Beta limits: 10 certificates per hour per address, files up to 4 MB. API keys for companies are coming.",
    sections: [
      { title: "Create a certificate from a file", text: "Send a PDF or TXT. ProofAPI runs the AI review, records the seal on Solana and returns the certificate." },
      { title: "Keep the data at home", text: "Send only SHA-256 fingerprints of the input, output and metadata. We record them on Solana and never see the content." },
      { title: "Check a certificate", text: "Returns VERIFIED, FAILED or NOT_ON_CHAIN with a result for every check." },
      { title: "Verify without us", text: "Download the evidence file and open the standalone verifier. It reads Solana directly." },
    ],
    response: "Response",
    copy: "Copy",
    copied: "Copied",
    openVerifier: "Open the standalone verifier",
    source: "Source code on GitHub",
  },
  pricing: {
    title: "Pricing",
    lead: "Everything is free during the beta. These are the plans we intend to offer after it.",
    beta: "Free in beta",
    perMonth: "/ month",
    plans: [
      { name: "Free", price: "$0", items: ["10 certificates a month", "Shareable certificate links", "Public journal"], cta: "Start free" },
      { name: "Business", price: "$19", items: ["500 certificates a month", "Your company name on certificates", "API key and evidence files"], cta: "Start free in beta" },
      { name: "Enterprise", price: "Custom", items: ["Your own Solana signing key", "Hash-only mode for private data", "History audit export"], cta: "Contact us" },
    ],
  },
  contact: { title: "Talk to us", text: "Questions, pilots or partnerships: open an issue on GitHub and we'll reply.", cta: "Write to us" },
  footer: {
    product: "Product",
    developers: "Developers",
    company: "Company",
    api: "API guide",
    github: "GitHub",
    verifier: "Standalone verifier",
    contact: "Contact",
    privacy: "Privacy",
    terms: "Terms",
    rights: "© 2026 ProofAPI · Beta",
  },
  legal: {
    privacyTitle: "Privacy",
    privacy: [
      "We store the file you upload, the AI result and a random salt in our database, so the certificate can be shown and re-checked.",
      "Only salted SHA-256 fingerprints go to the Solana blockchain. They are public, but the document can't be rebuilt from them.",
      "We keep a random token in a cookie so only your browser can use the demo controls on certificates you created.",
      "Your IP address is stored only as a salted hash, to limit uploads. We don't use analytics or advertising trackers.",
      "Anyone with a certificate link can see that certificate and download its evidence file, including the document. Share links with care.",
      "When AI review by Google Gemini is on, the document text is sent to Google. On Google's free tier, Google may use it to improve its services and people may review it.",
      "During the beta, don't upload confidential documents.",
    ],
    termsTitle: "Terms",
    terms: [
      "ProofAPI is a beta. It runs on Solana devnet, a test network, and may be reset or changed.",
      "The AI review is automated (Google Gemini or a simulation) and is not legal advice.",
      "A certificate proves that the recorded data hasn't changed since it was sealed. It doesn't prove the AI answer is correct.",
      "The service is provided as is, without warranties. The source code is available under the MIT license.",
    ],
  },
};

export type Marketing = typeof en;

const ru: Marketing = {
  nav: { developers: "Разработчикам", pricing: "Цены" },
  seal: { genuine: "ПОДЛИННЫЙ", changed: "ИЗМЕНЁН", pending: "БЕЗ ПЕЧАТИ", ring: "PROOFAPI · ЦИФРОВАЯ ПЕЧАТЬ · SOLANA · " },
  trust: ["Открытый код на GitHub", "Печати записаны в Solana", "Документ не публикуется", "Русский, казахский, английский"],
  scenario: {
    title: "Как это выглядит на практике",
    steps: [
      { who: "Юрист", text: "проверяет NDA клиента с помощью ИИ и отправляет ссылку на сертификат вместо PDF." },
      { who: "Клиент", text: "открывает ссылку с телефона и видит: «Подлинный», печать от 1 октября." },
      { who: "Через три месяца", text: "кто-то показывает версию с заниженной оценкой риска. Печать не совпадает, и спор на этом заканчивается." },
    ],
  },
  dev: {
    teaserTitle: "И для разработчиков",
    teaserText: "Каждый сертификат — один HTTP-запрос. Можно не отправлять документы вовсе, а только их отпечатки.",
    teaserCta: "Читать руководство по API",
    title: "API для разработчиков",
    lead: "Ставьте печать на результаты ИИ прямо из своего приложения. SDK не нужен: обычный HTTP и JSON.",
    baseUrl: "Базовый адрес",
    limits: "Лимиты беты: 10 сертификатов в час с одного адреса, файлы до 4 МБ. Ключи API для компаний скоро.",
    sections: [
      { title: "Сертификат из файла", text: "Отправьте PDF или TXT. ProofAPI проверит его с помощью ИИ, запишет печать в Solana и вернёт сертификат." },
      { title: "Данные остаются у вас", text: "Отправьте только SHA-256 отпечатки входа, ответа и метаданных. Мы запишем их в Solana и не увидим содержимое." },
      { title: "Проверка сертификата", text: "Возвращает VERIFIED, FAILED или NOT_ON_CHAIN и результат каждой проверки." },
      { title: "Проверка без нас", text: "Скачайте файл-доказательство и откройте независимую проверку. Она читает Solana напрямую." },
    ],
    response: "Ответ",
    copy: "Копировать",
    copied: "Скопировано",
    openVerifier: "Открыть независимую проверку",
    source: "Исходный код на GitHub",
  },
  pricing: {
    title: "Цены",
    lead: "Во время беты всё бесплатно. Ниже тарифы, которые мы планируем после неё.",
    beta: "Бесплатно в бете",
    perMonth: "/ месяц",
    plans: [
      { name: "Бесплатный", price: "$0", items: ["10 сертификатов в месяц", "Ссылки на сертификаты", "Публичный журнал"], cta: "Начать бесплатно" },
      { name: "Бизнес", price: "$19", items: ["500 сертификатов в месяц", "Название вашей компании в сертификатах", "Ключ API и файлы-доказательства"], cta: "Бесплатно в бете" },
      { name: "Для компаний", price: "Договорная", items: ["Свой ключ подписи в Solana", "Режим «только отпечатки» для закрытых данных", "Выгрузка аудита журнала"], cta: "Связаться" },
    ],
  },
  contact: { title: "Связаться с нами", text: "Вопросы, пилоты и партнёрства: напишите нам на GitHub, мы ответим.", cta: "Написать нам" },
  footer: {
    product: "Продукт",
    developers: "Разработчикам",
    company: "Компания",
    api: "Руководство по API",
    github: "GitHub",
    verifier: "Независимая проверка",
    contact: "Связаться",
    privacy: "Конфиденциальность",
    terms: "Условия",
    rights: "© 2026 ProofAPI · Бета",
  },
  legal: {
    privacyTitle: "Конфиденциальность",
    privacy: [
      "Мы храним загруженный файл, ответ ИИ и случайную соль в нашей базе, чтобы показывать и перепроверять сертификат.",
      "В блокчейн Solana попадают только солёные SHA-256 отпечатки. Они публичны, но восстановить по ним документ нельзя.",
      "Мы храним случайный токен в cookie, чтобы демо-кнопки работали только в браузере, который создал сертификат.",
      "IP-адрес хранится только в виде солёного хэша, чтобы ограничить число загрузок. Аналитики и рекламных трекеров нет.",
      "Любой, у кого есть ссылка на сертификат, видит его и может скачать файл-доказательство вместе с документом. Делитесь ссылками осторожно.",
      "Когда включена проверка ИИ Google Gemini, текст документа отправляется в Google. На бесплатном тарифе Google может использовать его для улучшения своих сервисов, и его могут прочитать люди.",
      "Во время беты не загружайте конфиденциальные документы.",
    ],
    termsTitle: "Условия",
    terms: [
      "ProofAPI работает в режиме беты в тестовой сети Solana devnet. Данные могут быть сброшены или изменены.",
      "Проверка ИИ автоматическая (Google Gemini или имитация) и не является юридической консультацией.",
      "Сертификат доказывает, что записанные данные не менялись после печати. Он не доказывает, что ответ ИИ верен.",
      "Сервис предоставляется «как есть», без гарантий. Исходный код открыт по лицензии MIT.",
    ],
  },
};

const kk: Marketing = {
  nav: { developers: "Әзірлеушілерге", pricing: "Бағалар" },
  seal: { genuine: "ТҮПНҰСҚА", changed: "ӨЗГЕРТІЛГЕН", pending: "МӨРСІЗ", ring: "PROOFAPI · ЦИФРЛЫҚ МӨР · SOLANA · " },
  trust: ["GitHub-та ашық код", "Мөрлер Solana-да жазылған", "Құжат жарияланбайды", "Қазақша, орысша, ағылшынша"],
  scenario: {
    title: "Іс жүзінде бұл қалай көрінеді",
    steps: [
      { who: "Заңгер", text: "клиенттің NDA шартын ЖИ арқылы тексеріп, PDF орнына сертификат сілтемесін жібереді." },
      { who: "Клиент", text: "сілтемені телефоннан ашып, «Түпнұсқа», 1 қазандағы мөр деген жазуды көреді." },
      { who: "Үш айдан кейін", text: "біреу тәуекел бағасы төмендетілген нұсқаны көрсетеді. Мөр сәйкес келмейді, дау сонымен бітеді." },
    ],
  },
  dev: {
    teaserTitle: "Әзірлеушілерге де ыңғайлы",
    teaserText: "Әр сертификат — бір HTTP сұрау. Құжаттарды жібермей, тек олардың іздерін жіберуге болады.",
    teaserCta: "API нұсқаулығын оқу",
    title: "Әзірлеушілерге арналған API",
    lead: "ЖИ нәтижелерін өз қосымшаңыздан мөрлеңіз. SDK қажет емес: қарапайым HTTP және JSON.",
    baseUrl: "Негізгі мекенжай",
    limits: "Бета шектеулері: бір мекенжайдан сағатына 10 сертификат, 4 МБ-қа дейінгі файлдар. Компанияларға API кілттері жақында.",
    sections: [
      { title: "Файлдан сертификат", text: "PDF немесе TXT жіберіңіз. ProofAPI оны ЖИ арқылы тексеріп, мөрді Solana-ға жазады және сертификат қайтарады." },
      { title: "Деректер сізде қалады", text: "Кіріс, жауап және метадеректердің SHA-256 іздерін ғана жіберіңіз. Біз оларды Solana-ға жазамыз, мазмұнын көрмейміз." },
      { title: "Сертификатты тексеру", text: "VERIFIED, FAILED немесе NOT_ON_CHAIN және әр тексерудің нәтижесін қайтарады." },
      { title: "Бізсіз тексеру", text: "Дәлел файлын жүктеп, тәуелсіз тексеруді ашыңыз. Ол Solana-ны тікелей оқиды." },
    ],
    response: "Жауап",
    copy: "Көшіру",
    copied: "Көшірілді",
    openVerifier: "Тәуелсіз тексеруді ашу",
    source: "GitHub-тағы бастапқы код",
  },
  pricing: {
    title: "Бағалар",
    lead: "Бета кезінде бәрі тегін. Төменде бетадан кейін жоспарланған тарифтер.",
    beta: "Бетада тегін",
    perMonth: "/ ай",
    plans: [
      { name: "Тегін", price: "$0", items: ["Айына 10 сертификат", "Сертификат сілтемелері", "Ашық журнал"], cta: "Тегін бастау" },
      { name: "Бизнес", price: "$19", items: ["Айына 500 сертификат", "Сертификаттарда компанияңыздың атауы", "API кілті және дәлел файлдары"], cta: "Бетада тегін" },
      { name: "Компанияларға", price: "Келісім бойынша", items: ["Solana-дағы өз қолтаңба кілтіңіз", "Жабық деректерге «тек іздер» режимі", "Журнал аудитін жүктеу"], cta: "Хабарласу" },
    ],
  },
  contact: { title: "Бізбен байланыс", text: "Сұрақтар, пилоттар және серіктестік: GitHub-та жазыңыз, біз жауап береміз.", cta: "Бізге жазу" },
  footer: {
    product: "Өнім",
    developers: "Әзірлеушілерге",
    company: "Компания",
    api: "API нұсқаулығы",
    github: "GitHub",
    verifier: "Тәуелсіз тексеру",
    contact: "Байланыс",
    privacy: "Құпиялылық",
    terms: "Шарттар",
    rights: "© 2026 ProofAPI · Бета",
  },
  legal: {
    privacyTitle: "Құпиялылық",
    privacy: [
      "Сертификатты көрсету және қайта тексеру үшін жүктелген файлды, ЖИ жауабын және кездейсоқ тұзды дерекқорымызда сақтаймыз.",
      "Solana блокчейніне тек тұздалған SHA-256 іздері түседі. Олар ашық, бірақ олардан құжатты қалпына келтіру мүмкін емес.",
      "Демо батырмалары тек сертификатты жасаған браузерде жұмыс істеуі үшін cookie ішінде кездейсоқ токен сақтаймыз.",
      "Жүктеулер санын шектеу үшін IP мекенжайы тек тұздалған хэш түрінде сақталады. Аналитика мен жарнамалық трекерлер жоқ.",
      "Сертификат сілтемесі бар кез келген адам оны көріп, дәлел файлын құжатпен бірге жүктей алады. Сілтемелерді абайлап бөлісіңіз.",
      "Google Gemini ЖИ тексеруі қосулы болғанда, құжат мәтіні Google-ға жіберіледі. Тегін тарифте Google оны өз қызметтерін жақсарту үшін пайдалануы мүмкін және оны адамдар оқуы мүмкін.",
      "Бета кезінде құпия құжаттарды жүктемеңіз.",
    ],
    termsTitle: "Шарттар",
    terms: [
      "ProofAPI бета режимінде Solana devnet сынақ желісінде жұмыс істейді. Деректер қалпына келтірілуі немесе өзгертілуі мүмкін.",
      "ЖИ тексеруі автоматты (Google Gemini немесе имитация) және заң кеңесі емес.",
      "Сертификат жазылған деректердің мөрден кейін өзгермегенін дәлелдейді. Ол ЖИ жауабының дұрыс екенін дәлелдемейді.",
      "Қызмет «сол күйінде», кепілдіксіз ұсынылады. Бастапқы код MIT лицензиясымен ашық.",
    ],
  },
};

export const MARKETING = { en, ru, kk };
