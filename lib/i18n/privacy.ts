import type { LegalDoc } from "@/components/legal-document";
import type { Locale } from "@/lib/i18n/messages";

const EMAIL = "proofapiofficial@gmail.com";

const en: LegalDoc = {
  title: "Privacy Policy",
  updated: "Effective 2 October 2026",
  toc: "Contents",
  intro: [
    "This policy explains what personal data ProofAPI collects, why, how long we keep it, who processes it for us and what rights you have. It applies to the website proofapi.vercel.app, the developer console, the ProofAPI API, the TypeScript SDK and the MCP server.",
    "ProofAPI is in public beta. Records are written to Solana devnet, a public test network.",
  ],
  sections: [
    {
      id: "controller",
      title: "Who we are",
      blocks: [
        "ProofAPI is operated by the ProofAPI team, based in Kazakhstan. We decide how and why your personal data is processed and act as its controller.",
        `Contact for any privacy question or request: ${EMAIL}.`,
      ],
    },
    {
      id: "data",
      title: "Data we collect",
      blocks: [
        "We collect only what the service needs to work.",
        {
          list: [
            "Content you seal. The input text or uploaded document text, the AI result, metadata such as the declared model name, label and agent ID, and a random salt. In hash-only mode we receive only SHA-256 fingerprints, never the content.",
            "Account data from GitHub. When you sign in with GitHub we receive and store your GitHub user ID, login, display name and avatar URL. GitHub may share your email address during sign-in; we do not store it in our database. We never receive your GitHub password.",
            "API keys. We store a key's name, a hash of the key and its last four characters, and when it was created, last used and revoked. The full key is shown once and is not stored.",
            "Usage data. Which account or key created which record and when, used for monthly limits and the usage page.",
            "Network data. To limit abuse we store your IP address only as a salted hash that cannot be reversed. Our hosting provider processes raw IP addresses in its own request logs.",
            "Demo requests. Name, email, company, message and interface language you send through the demo form, together with a hashed IP address.",
          ],
        },
      ],
    },
    {
      id: "public",
      title: "What becomes public",
      blocks: [
        "A certificate is public to anyone who has its link. In text mode, the certificate shows the AI result, and its evidence file contains the input, the output, the metadata and the salt, so that anyone can check it independently.",
        "Salted SHA-256 fingerprints, the record number, the issuer and the time are written to the Solana blockchain. Blockchain records are public and permanent: neither we nor anyone else can change or delete them. The original content cannot be rebuilt from the fingerprints.",
        "Do not seal personal or confidential information in text mode unless you are entitled to publish it to the people who will receive the link. Use hash-only mode for private data.",
      ],
    },
    {
      id: "purposes",
      title: "Why we use your data",
      blocks: [
        {
          list: [
            "To provide the service: create, store, show and verify certificates, run the console, issue API keys. Legal basis: performance of our agreement with you.",
            "To keep the service secure and fair: rate limits, abuse prevention, protecting demo controls. Legal basis: our legitimate interest.",
            "To answer demo requests and messages. Legal basis: your request and consent, which you can withdraw at any time.",
            "To meet legal obligations where they apply.",
          ],
        },
        "We do not sell personal data, do not use it for advertising and do not build marketing profiles.",
      ],
    },
    {
      id: "ai",
      title: "AI processing",
      blocks: [
        "When you upload a document for AI review on the website, its text (up to 30,000 characters) is sent to Google through the Gemini API to produce the review. Google processes it under its own API terms.",
        "The API method /api/v1/seal, the SDK and the MCP server do not send your data to any AI provider: they record the answer you already have.",
        "AI reviews can be wrong. A certificate proves that the recorded data has not changed; it does not prove that the AI result is correct.",
      ],
    },
    {
      id: "cookies",
      title: "Cookies",
      blocks: [
        "We use only cookies that the service needs. There are no analytics, advertising or tracking cookies.",
        {
          table: {
            head: ["Cookie", "Purpose", "Lifetime"],
            rows: [
              ["pa_owner", "Marks the browser that created a certificate, so it can see its own records and use the demo controls", "1 year"],
              ["lang", "Remembers the interface language", "1 year"],
              ["__Secure-next-auth.session-token", "Keeps you signed in to the console", "30 days"],
              ["__Host-next-auth.csrf-token", "Protects the sign-in form", "Browser session"],
              ["__Secure-next-auth.callback-url", "Returns you to the right page after sign-in", "Browser session"],
            ],
          },
        },
      ],
    },
    {
      id: "processors",
      title: "Service providers",
      blocks: [
        "We use these providers to run ProofAPI. Each receives only the data it needs.",
        {
          table: {
            head: ["Provider", "Role", "Data"],
            rows: [
              ["Vercel Inc.", "Website and API hosting (Frankfurt region)", "All requests, server logs"],
              ["Neon", "Database hosting", "Certificates, accounts, keys, demo requests"],
              ["Google LLC", "AI document review (Gemini API)", "Text of documents uploaded for review"],
              ["GitHub, Inc.", "Sign-in", "Sign-in requests"],
              ["Solana network", "Public blockchain", "Salted fingerprints and record data"],
            ],
          },
        },
        "These providers may process data outside Kazakhstan, including in the United States and the European Union. We rely on their contractual terms and safeguards for such transfers.",
      ],
    },
    {
      id: "retention",
      title: "How long we keep data",
      blocks: [
        {
          list: [
            "Certificates and their content: while the service runs, or until you ask us to delete them. Fingerprints on Solana cannot be deleted.",
            "Account data and API keys: until you ask us to delete your account. Revoked keys remain as a hash so that past records stay attributable.",
            "Demo requests: as long as needed to respond and follow up, and deleted on request.",
            "Hashed IP addresses: kept with the records they relate to, for limits and abuse prevention.",
            "Hosting logs: according to Vercel's retention periods.",
          ],
        },
      ],
    },
    {
      id: "security",
      title: "Security",
      blocks: [
        "All traffic uses HTTPS. API keys and IP addresses are stored only as hashes. Server keys and secrets are kept in protected environment settings, and access to the database is limited to the team.",
        `No system is completely secure. If you find a vulnerability, please write to ${EMAIL}.`,
      ],
    },
    {
      id: "rights",
      title: "Your rights",
      blocks: [
        "Depending on where you live, including under the Law of the Republic of Kazakhstan No. 94-V “On Personal Data and Their Protection” and the EU General Data Protection Regulation, you may:",
        {
          list: [
            "know what data we hold about you and get a copy;",
            "correct inaccurate data;",
            "have your data deleted;",
            "restrict or object to processing;",
            "withdraw consent at any time;",
            "complain to your data protection authority.",
          ],
        },
        `Send requests to ${EMAIL} from the address linked to your data, or mention your GitHub login. We reply within 30 days. Data already written to the blockchain cannot be deleted, but we can delete everything stored in our database, after which the fingerprints can no longer be linked to you.`,
      ],
    },
    {
      id: "children",
      title: "Children",
      blocks: ["ProofAPI is a service for businesses and developers and is not intended for children under 16. We do not knowingly collect their data."],
    },
    {
      id: "changes",
      title: "Changes to this policy",
      blocks: ["We may update this policy as the service develops. The effective date at the top always shows the current version. We will announce significant changes on the website before they apply."],
    },
    {
      id: "contact",
      title: "Contact",
      blocks: [`Questions, requests and complaints: ${EMAIL}.`],
    },
  ],
};

const ru: LegalDoc = {
  title: "Политика конфиденциальности",
  updated: "Действует с 2 октября 2026 года",
  toc: "Содержание",
  intro: [
    "Эта политика объясняет, какие персональные данные собирает ProofAPI, зачем, сколько их хранит, кто обрабатывает их по нашему поручению и какие у вас есть права. Она действует для сайта proofapi.vercel.app, кабинета разработчика, API ProofAPI, TypeScript SDK и MCP-сервера.",
    "ProofAPI находится в открытой бете. Записи сохраняются в Solana devnet — публичной тестовой сети.",
  ],
  sections: [
    {
      id: "controller",
      title: "Кто мы",
      blocks: [
        "ProofAPI управляет команда ProofAPI из Казахстана. Мы определяем цели и способы обработки ваших персональных данных и выступаем их оператором.",
        `По любым вопросам и запросам о персональных данных пишите на ${EMAIL}.`,
      ],
    },
    {
      id: "data",
      title: "Какие данные мы собираем",
      blocks: [
        "Мы собираем только то, что нужно для работы сервиса.",
        {
          list: [
            "Содержимое, которое вы запечатываете. Входной текст или текст загруженного документа, результат ИИ, метаданные (заявленное название модели, метка, ID агента) и случайная соль. В режиме «только отпечатки» мы получаем только SHA-256 отпечатки, без содержимого.",
            "Данные аккаунта GitHub. При входе через GitHub мы получаем и храним ID пользователя GitHub, логин, отображаемое имя и ссылку на аватар. GitHub может передать адрес почты при входе, в нашей базе мы его не сохраняем. Пароль от GitHub мы не получаем никогда.",
            "API-ключи. Мы храним название ключа, его хэш и последние четыре символа, а также даты создания, последнего использования и отзыва. Полный ключ показывается один раз и не хранится.",
            "Данные об использовании. Какой аккаунт или ключ создал запись и когда — для месячных лимитов и страницы расхода.",
            "Сетевые данные. Для защиты от злоупотреблений мы храним IP-адрес только в виде солёного хэша, который нельзя обратить. Хостинг-провайдер обрабатывает исходные IP-адреса в своих журналах запросов.",
            "Заявки на демо. Имя, почта, компания, сообщение и язык интерфейса, которые вы отправляете через форму, а также хэш IP-адреса.",
          ],
        },
      ],
    },
    {
      id: "public",
      title: "Что становится публичным",
      blocks: [
        "Сертификат доступен любому, у кого есть ссылка. В текстовом режиме сертификат показывает результат ИИ, а файл доказательств содержит вход, ответ, метаданные и соль, чтобы любой мог проверить запись самостоятельно.",
        "В блокчейн Solana записываются солёные SHA-256 отпечатки, номер записи, издатель и время. Записи в блокчейне публичны и постоянны: ни мы, ни кто-либо другой не может их изменить или удалить. Восстановить исходное содержимое по отпечаткам нельзя.",
        "Не запечатывайте персональные или конфиденциальные данные в текстовом режиме, если вы не вправе показать их получателям ссылки. Для закрытых данных используйте режим «только отпечатки».",
      ],
    },
    {
      id: "purposes",
      title: "Зачем мы используем данные",
      blocks: [
        {
          list: [
            "Чтобы оказывать услугу: создавать, хранить, показывать и проверять сертификаты, работать кабинету, выдавать API-ключи. Основание: исполнение соглашения с вами.",
            "Чтобы сервис был безопасным и честным: лимиты, защита от злоупотреблений, защита демо-управления. Основание: наш законный интерес.",
            "Чтобы отвечать на заявки на демо и сообщения. Основание: ваш запрос и согласие, которое можно отозвать в любой момент.",
            "Чтобы выполнять требования закона, когда они применимы.",
          ],
        },
        "Мы не продаём персональные данные, не используем их для рекламы и не строим маркетинговые профили.",
      ],
    },
    {
      id: "ai",
      title: "Обработка искусственным интеллектом",
      blocks: [
        "Когда вы загружаете документ для ИИ-разбора на сайте, его текст (до 30 000 символов) передаётся Google через Gemini API, чтобы получить разбор. Google обрабатывает его по собственным условиям API.",
        "Метод API /api/v1/seal, SDK и MCP-сервер не отправляют ваши данные ни одному ИИ-провайдеру: они фиксируют ответ, который у вас уже есть.",
        "ИИ может ошибаться. Сертификат подтверждает, что записанные данные не менялись, но не подтверждает, что результат ИИ верен.",
      ],
    },
    {
      id: "cookies",
      title: "Файлы cookie",
      blocks: [
        "Мы используем только cookie, без которых сервис не работает. Аналитических, рекламных и отслеживающих cookie нет.",
        {
          table: {
            head: ["Cookie", "Назначение", "Срок"],
            rows: [
              ["pa_owner", "Отмечает браузер, создавший сертификат, чтобы он видел свои записи и мог пользоваться демо-управлением", "1 год"],
              ["lang", "Запоминает язык интерфейса", "1 год"],
              ["__Secure-next-auth.session-token", "Сохраняет вход в кабинет", "30 дней"],
              ["__Host-next-auth.csrf-token", "Защищает форму входа", "До закрытия браузера"],
              ["__Secure-next-auth.callback-url", "Возвращает на нужную страницу после входа", "До закрытия браузера"],
            ],
          },
        },
      ],
    },
    {
      id: "processors",
      title: "Сторонние сервисы",
      blocks: [
        "Для работы ProofAPI мы используем следующих поставщиков. Каждый получает только необходимые ему данные.",
        {
          table: {
            head: ["Поставщик", "Роль", "Данные"],
            rows: [
              ["Vercel Inc.", "Хостинг сайта и API (регион Франкфурт)", "Все запросы, журналы сервера"],
              ["Neon", "Хостинг базы данных", "Сертификаты, аккаунты, ключи, заявки на демо"],
              ["Google LLC", "ИИ-разбор документов (Gemini API)", "Текст документов, загруженных на разбор"],
              ["GitHub, Inc.", "Вход в аккаунт", "Запросы на вход"],
              ["Сеть Solana", "Публичный блокчейн", "Солёные отпечатки и данные записи"],
            ],
          },
        },
        "Эти поставщики могут обрабатывать данные за пределами Казахстана, в том числе в США и Европейском союзе. Для такой передачи мы полагаемся на их договорные условия и меры защиты.",
      ],
    },
    {
      id: "retention",
      title: "Сколько мы храним данные",
      blocks: [
        {
          list: [
            "Сертификаты и их содержимое: пока работает сервис или пока вы не попросите их удалить. Отпечатки в Solana удалить нельзя.",
            "Данные аккаунта и API-ключи: пока вы не попросите удалить аккаунт. Отозванные ключи остаются в виде хэша, чтобы прошлые записи оставались привязаны к источнику.",
            "Заявки на демо: сколько нужно, чтобы ответить и продолжить общение; удаляем по запросу.",
            "Хэши IP-адресов: хранятся вместе с записями, к которым относятся, для лимитов и защиты от злоупотреблений.",
            "Журналы хостинга: по срокам хранения Vercel.",
          ],
        },
      ],
    },
    {
      id: "security",
      title: "Безопасность",
      blocks: [
        "Все соединения идут по HTTPS. API-ключи и IP-адреса хранятся только в виде хэшей. Ключи и секреты сервера хранятся в защищённых настройках окружения, доступ к базе данных есть только у команды.",
        `Полностью защищённых систем не бывает. Если вы нашли уязвимость, напишите на ${EMAIL}.`,
      ],
    },
    {
      id: "rights",
      title: "Ваши права",
      blocks: [
        "В зависимости от места проживания, в том числе по Закону Республики Казахстан № 94-V «О персональных данных и их защите» и Общему регламенту ЕС по защите данных (GDPR), вы можете:",
        {
          list: [
            "узнать, какие данные о вас мы храним, и получить их копию;",
            "исправить неточные данные;",
            "удалить свои данные;",
            "ограничить обработку или возразить против неё;",
            "в любой момент отозвать согласие;",
            "подать жалобу в уполномоченный орган по защите персональных данных.",
          ],
        },
        `Отправляйте запросы на ${EMAIL} с адреса, связанного с вашими данными, или укажите ваш логин GitHub. Мы отвечаем в течение 30 дней. Данные, уже записанные в блокчейн, удалить нельзя, но мы удалим всё, что хранится в нашей базе, после чего отпечатки больше нельзя будет связать с вами.`,
      ],
    },
    {
      id: "children",
      title: "Дети",
      blocks: ["ProofAPI — сервис для компаний и разработчиков, он не предназначен для детей младше 16 лет. Мы сознательно не собираем их данные."],
    },
    {
      id: "changes",
      title: "Изменения политики",
      blocks: ["Мы можем обновлять эту политику по мере развития сервиса. Дата вверху страницы всегда указывает действующую редакцию. О существенных изменениях мы заранее сообщим на сайте."],
    },
    {
      id: "contact",
      title: "Контакты",
      blocks: [`Вопросы, запросы и жалобы: ${EMAIL}.`],
    },
  ],
};

const kk: LegalDoc = {
  title: "Құпиялылық саясаты",
  updated: "2026 жылғы 2 қазаннан бастап күшінде",
  toc: "Мазмұны",
  intro: [
    "Бұл саясат ProofAPI қандай дербес деректерді не үшін жинайтынын, оларды қанша уақыт сақтайтынын, біздің тапсырмамыз бойынша оларды кім өңдейтінін және сіздің құқықтарыңызды түсіндіреді. Ол proofapi.vercel.app сайтына, әзірлеуші кабинетіне, ProofAPI API-іне, TypeScript SDK-ға және MCP серверіне қолданылады.",
    "ProofAPI ашық бета-нұсқада жұмыс істейді. Жазбалар Solana devnet ашық тестілік желісіне сақталады.",
  ],
  sections: [
    {
      id: "controller",
      title: "Біз кімбіз",
      blocks: [
        "ProofAPI-ды Қазақстандағы ProofAPI командасы басқарады. Дербес деректеріңізді өңдеудің мақсаттары мен тәсілдерін біз анықтаймыз және олардың операторы болып табыламыз.",
        `Дербес деректерге қатысты кез келген сұрақ пен өтініш: ${EMAIL}.`,
      ],
    },
    {
      id: "data",
      title: "Қандай деректерді жинаймыз",
      blocks: [
        "Біз тек сервистің жұмысына қажетті деректерді жинаймыз.",
        {
          list: [
            "Мөр басатын мазмұн. Кіріс мәтін немесе жүктелген құжат мәтіні, ЖИ нәтижесі, метадеректер (мәлімделген модель атауы, белгі, агент ID) және кездейсоқ тұз. «Тек іздер» режимінде біз мазмұнсыз тек SHA-256 іздерін аламыз.",
            "GitHub аккаунт деректері. GitHub арқылы кіргенде біз GitHub пайдаланушы ID, логин, көрсетілетін атау және аватар сілтемесін аламыз және сақтаймыз. GitHub кіру кезінде поштаңызды бере алады, біз оны дерекқорымызда сақтамаймыз. GitHub құпиясөзін ешқашан алмаймыз.",
            "API кілттері. Кілттің атауын, хэшін және соңғы төрт таңбасын, сондай-ақ жасалған, соңғы рет қолданылған және кері қайтарылған уақытын сақтаймыз. Толық кілт бір рет көрсетіледі және сақталмайды.",
            "Пайдалану деректері. Қай аккаунт немесе кілт қай жазбаны қашан жасағаны — айлық лимиттер мен шығын беті үшін.",
            "Желілік деректер. Теріс пайдаланудан қорғау үшін IP мекенжайын тек кері қайтарылмайтын тұздалған хэш түрінде сақтаймыз. Хостинг провайдері бастапқы IP мекенжайларын өз сұраныс журналдарында өңдейді.",
            "Демо өтінімдері. Форма арқылы жіберген атыңыз, поштаңыз, компанияңыз, хабарламаңыз және интерфейс тілі, сондай-ақ IP мекенжайының хэші.",
          ],
        },
      ],
    },
    {
      id: "public",
      title: "Не ашық болады",
      blocks: [
        "Сертификат сілтемесі бар кез келген адамға қолжетімді. Мәтін режимінде сертификат ЖИ нәтижесін көрсетеді, ал дәлелдер файлында кіріс, жауап, метадеректер және тұз болады, сондықтан кез келген адам жазбаны өзі тексере алады.",
        "Solana блокчейніне тұздалған SHA-256 іздері, жазба нөмірі, шығарушы және уақыт жазылады. Блокчейндегі жазбалар ашық әрі тұрақты: оларды біз де, басқа ешкім де өзгерте немесе жоя алмайды. Іздер бойынша бастапқы мазмұнды қалпына келтіру мүмкін емес.",
        "Сілтемені алатын адамдарға көрсетуге құқығыңыз болмаса, дербес немесе құпия деректерге мәтін режимінде мөр баспаңыз. Жабық деректер үшін «тек іздер» режимін қолданыңыз.",
      ],
    },
    {
      id: "purposes",
      title: "Деректерді не үшін қолданамыз",
      blocks: [
        {
          list: [
            "Қызмет көрсету үшін: сертификаттарды жасау, сақтау, көрсету және тексеру, кабинеттің жұмысы, API кілттерін беру. Негіз: сізбен келісімді орындау.",
            "Сервистің қауіпсіз және әділ болуы үшін: лимиттер, теріс пайдаланудан қорғау, демо басқаруды қорғау. Негіз: біздің заңды мүддеміз.",
            "Демо өтінімдері мен хабарламаларға жауап беру үшін. Негіз: сіздің сұрауыңыз бен келісіміңіз, оны кез келген уақытта қайтарып алуға болады.",
            "Заң талаптары қолданылатын жағдайда оларды орындау үшін.",
          ],
        },
        "Біз дербес деректерді сатпаймыз, жарнамаға қолданбаймыз және маркетингтік профильдер құрмаймыз.",
      ],
    },
    {
      id: "ai",
      title: "Жасанды интеллектпен өңдеу",
      blocks: [
        "Сайтта құжатты ЖИ талдауына жүктегенде, оның мәтіні (30 000 таңбаға дейін) талдау алу үшін Gemini API арқылы Google-ға жіберіледі. Google оны өзінің API шарттары бойынша өңдейді.",
        "API /api/v1/seal әдісі, SDK және MCP сервері деректеріңізді ешбір ЖИ провайдеріне жібермейді: олар сізде бар жауапты тіркейді.",
        "ЖИ қателесуі мүмкін. Сертификат жазылған деректердің өзгермегенін растайды, бірақ ЖИ нәтижесінің дұрыстығын растамайды.",
      ],
    },
    {
      id: "cookies",
      title: "Cookie файлдары",
      blocks: [
        "Біз тек сервиске қажетті cookie файлдарын қолданамыз. Аналитикалық, жарнамалық және бақылау cookie файлдары жоқ.",
        {
          table: {
            head: ["Cookie", "Мақсаты", "Мерзімі"],
            rows: [
              ["pa_owner", "Сертификатты жасаған браузерді белгілейді: ол өз жазбаларын көріп, демо басқаруды қолдана алады", "1 жыл"],
              ["lang", "Интерфейс тілін есте сақтайды", "1 жыл"],
              ["__Secure-next-auth.session-token", "Кабинетке кіруді сақтайды", "30 күн"],
              ["__Host-next-auth.csrf-token", "Кіру формасын қорғайды", "Браузер жабылғанша"],
              ["__Secure-next-auth.callback-url", "Кіргеннен кейін қажетті бетке қайтарады", "Браузер жабылғанша"],
            ],
          },
        },
      ],
    },
    {
      id: "processors",
      title: "Үшінші тарап сервистері",
      blocks: [
        "ProofAPI жұмысы үшін келесі жеткізушілерді қолданамыз. Әрқайсысы тек өзіне қажетті деректерді алады.",
        {
          table: {
            head: ["Жеткізуші", "Рөлі", "Деректер"],
            rows: [
              ["Vercel Inc.", "Сайт пен API хостингі (Франкфурт аймағы)", "Барлық сұраныстар, сервер журналдары"],
              ["Neon", "Дерекқор хостингі", "Сертификаттар, аккаунттар, кілттер, демо өтінімдері"],
              ["Google LLC", "Құжаттарды ЖИ талдау (Gemini API)", "Талдауға жүктелген құжаттардың мәтіні"],
              ["GitHub, Inc.", "Аккаунтқа кіру", "Кіру сұраныстары"],
              ["Solana желісі", "Ашық блокчейн", "Тұздалған іздер және жазба деректері"],
            ],
          },
        },
        "Бұл жеткізушілер деректерді Қазақстаннан тыс жерде, соның ішінде АҚШ пен Еуропалық одақта өңдеуі мүмкін. Мұндай беру үшін біз олардың шарттық талаптары мен қорғау шараларына сүйенеміз.",
      ],
    },
    {
      id: "retention",
      title: "Деректерді қанша сақтаймыз",
      blocks: [
        {
          list: [
            "Сертификаттар мен олардың мазмұны: сервис жұмыс істеп тұрғанша немесе сіз жоюды сұрағанша. Solana-дағы іздерді жою мүмкін емес.",
            "Аккаунт деректері мен API кілттері: сіз аккаунтты жоюды сұрағанша. Кері қайтарылған кілттер бұрынғы жазбалар дереккөзіне байланысты қалуы үшін хэш түрінде сақталады.",
            "Демо өтінімдері: жауап беру және байланысты жалғастыру үшін қажет мерзімге дейін; сұрау бойынша жоямыз.",
            "IP мекенжайларының хэштері: лимиттер мен қорғау үшін тиісті жазбалармен бірге сақталады.",
            "Хостинг журналдары: Vercel сақтау мерзімдері бойынша.",
          ],
        },
      ],
    },
    {
      id: "security",
      title: "Қауіпсіздік",
      blocks: [
        "Барлық байланыс HTTPS арқылы жүреді. API кілттері мен IP мекенжайлары тек хэш түрінде сақталады. Сервер кілттері мен құпиялары қорғалған орта баптауларында сақталады, дерекқорға тек команданың қолжетімділігі бар.",
        `Толық қорғалған жүйе болмайды. Осалдық тапсаңыз, ${EMAIL} поштасына жазыңыз.`,
      ],
    },
    {
      id: "rights",
      title: "Сіздің құқықтарыңыз",
      blocks: [
        "Тұратын жеріңізге байланысты, соның ішінде Қазақстан Республикасының «Дербес деректер және оларды қорғау туралы» № 94-V Заңы мен ЕО-ның Деректерді қорғаудың жалпы регламенті (GDPR) бойынша сіз:",
        {
          list: [
            "біз сіз туралы қандай деректер сақтайтынымызды біліп, олардың көшірмесін ала аласыз;",
            "дұрыс емес деректерді түзете аласыз;",
            "деректеріңізді жоя аласыз;",
            "өңдеуді шектей немесе оған қарсылық білдіре аласыз;",
            "келісімді кез келген уақытта қайтарып ала аласыз;",
            "дербес деректерді қорғау жөніндегі уәкілетті органға шағым бере аласыз.",
          ],
        },
        `Сұрауларды деректеріңізге байланысты мекенжайдан ${EMAIL} поштасына жіберіңіз немесе GitHub логиніңізді көрсетіңіз. Біз 30 күн ішінде жауап береміз. Блокчейнге жазылған деректерді жою мүмкін емес, бірақ біз өз дерекқорымыздағының бәрін жоямыз, содан кейін іздерді сізбен байланыстыру мүмкін болмайды.`,
      ],
    },
    {
      id: "children",
      title: "Балалар",
      blocks: ["ProofAPI — компаниялар мен әзірлеушілерге арналған сервис, ол 16 жасқа толмаған балаларға арналмаған. Біз олардың деректерін әдейі жинамаймыз."],
    },
    {
      id: "changes",
      title: "Саясаттың өзгеруі",
      blocks: ["Сервис дамыған сайын бұл саясатты жаңартуымыз мүмкін. Беттің жоғарғы жағындағы күн әрқашан қолданыстағы нұсқаны көрсетеді. Елеулі өзгерістер туралы сайтта алдын ала хабарлаймыз."],
    },
    {
      id: "contact",
      title: "Байланыс",
      blocks: [`Сұрақтар, өтініштер және шағымдар: ${EMAIL}.`],
    },
  ],
};

export const PRIVACY: Record<Locale, LegalDoc> = { en, ru, kk };
