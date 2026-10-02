import type { LegalDoc } from "@/components/legal-document";
import type { Locale } from "@/lib/i18n/messages";

const EMAIL = "proofapiofficial@gmail.com";

const en: LegalDoc = {
  title: "Terms of Use",
  updated: "Effective 2 October 2026",
  toc: "Contents",
  intro: [
    "These terms govern your use of ProofAPI: the website proofapi.vercel.app, the developer console, the API, the TypeScript SDK and the MCP server. By using ProofAPI you accept these terms. If you use it on behalf of a company, you accept them for that company.",
    "How we handle personal data is described in the Privacy Policy, which is part of these terms.",
  ],
  sections: [
    {
      id: "service",
      title: "The service",
      blocks: [
        "ProofAPI records SHA-256 fingerprints of an input, an AI result and its metadata on the Solana blockchain and issues a certificate that anyone with the link can check. The website also offers an automated AI review of uploaded documents.",
        "ProofAPI is operated by the ProofAPI team, based in Kazakhstan.",
      ],
    },
    {
      id: "beta",
      title: "Beta and test network",
      blocks: [
        "ProofAPI is in public beta. Records are written to Solana devnet, a public test network operated by third parties. Features, limits and interfaces may change, and devnet may be reset or become unavailable independently of us.",
        "Do not rely on beta certificates as your only evidence for legal, financial or regulatory purposes.",
      ],
    },
    {
      id: "proves",
      title: "What a certificate proves",
      blocks: [
        "A certificate shows that the recorded data has not changed since it was sealed, and when it was sealed according to the Solana clock.",
        {
          list: [
            "It does not prove that the AI result is correct, complete or lawful.",
            "It does not prove which AI model was actually used: the model name is declared by whoever sealed the record.",
            "It does not prove who wrote the input or that the input is true.",
            "The AI review on the website is automated and is not legal, financial or professional advice.",
          ],
        },
      ],
    },
    {
      id: "accounts",
      title: "Accounts and API keys",
      blocks: [
        "You sign in to the console with GitHub. You are responsible for activity under your account and your API keys.",
        {
          list: [
            "Keep API keys on your server. Never put them in browser code, mobile apps or public repositories.",
            "Revoke a key in the console as soon as you suspect it has leaked.",
            "Tell us at once at " + EMAIL + " if you notice unauthorised use.",
          ],
        },
      ],
    },
    {
      id: "acceptable-use",
      title: "Acceptable use",
      blocks: [
        "You must not:",
        {
          list: [
            "seal or upload content that is illegal, infringes someone's rights, or contains personal data you are not allowed to process or share;",
            "use ProofAPI to deceive people, for example by presenting a certificate as proof of something it does not prove;",
            "bypass rate limits or monthly limits, create accounts or keys to evade them, or overload the service;",
            "probe, scan or attack the service or its infrastructure, except through responsible disclosure to " + EMAIL + ";",
            "upload malware or use the service to send spam;",
            "resell or rebrand the service without our written agreement.",
          ],
        },
        "We may limit, suspend or revoke access that breaks these rules or puts the service or other users at risk.",
      ],
    },
    {
      id: "content",
      title: "Your content",
      blocks: [
        "You keep all rights to the content you seal or upload. You give us a non-exclusive, worldwide licence to store, process, display and transmit it only as needed to run ProofAPI, including showing it on the certificate and including it in the evidence file.",
        "You confirm that you have the rights and permissions needed for that content, including for any personal data in it.",
        "In text mode, anyone with the certificate link can see the AI result and download the input and output. Use hash-only mode for confidential data.",
      ],
    },
    {
      id: "blockchain",
      title: "Blockchain records are permanent",
      blocks: [
        "Fingerprints and record data written to Solana cannot be changed or deleted by us or by anyone else. We can delete the content stored in our database at your request, but the on-chain record will remain.",
        "Blockchain networks are operated by third parties. We are not responsible for their availability, fees or changes to their rules.",
      ],
    },
    {
      id: "fees",
      title: "Fees",
      blocks: [
        "ProofAPI is free during the beta, within the published limits. The plans shown on the website describe planned pricing after the beta.",
        "We will tell you at least 30 days before any paid plan applies to your account. Nothing is charged without your explicit agreement.",
      ],
    },
    {
      id: "ip",
      title: "Our software and brand",
      blocks: [
        "The ProofAPI source code is published under the MIT licence, and the SDK is distributed through npm under the same licence. The ProofAPI name and logo are not covered by that licence and may not be used to suggest that you are ProofAPI or are endorsed by us.",
      ],
    },
    {
      id: "availability",
      title: "Availability and warranty",
      blocks: [
        "We work to keep ProofAPI available and accurate, but we provide it “as is” and “as available”, without warranties of any kind, to the extent permitted by law. There is no guaranteed uptime during the beta.",
      ],
    },
    {
      id: "liability",
      title: "Limitation of liability",
      blocks: [
        "To the extent permitted by law, we are not liable for indirect or consequential losses, lost profits or lost data, or for decisions you or others make based on an AI result or a certificate.",
        "While the service is free, our total liability to you for any claim is limited to 100 US dollars. Nothing in these terms limits liability that cannot be limited by law.",
      ],
    },
    {
      id: "termination",
      title: "Ending use",
      blocks: [
        "You can stop using ProofAPI at any time and ask us to delete your account and stored content. We may stop providing the service or close an account that breaks these terms. Where we can, we will give notice and time to download your evidence files.",
      ],
    },
    {
      id: "changes",
      title: "Changes to these terms",
      blocks: [
        "We may update these terms as the service develops. The effective date at the top shows the current version. We will announce significant changes on the website before they apply. If you keep using ProofAPI after that, the new terms apply.",
      ],
    },
    {
      id: "law",
      title: "Governing law",
      blocks: [
        "These terms are governed by the laws of the Republic of Kazakhstan. We will first try to resolve any dispute by talking to you. If that fails, disputes go to the competent courts of the Republic of Kazakhstan, unless the law of your country gives you the right to another court as a consumer.",
      ],
    },
    {
      id: "contact",
      title: "Contact",
      blocks: [`Questions about these terms: ${EMAIL}.`],
    },
  ],
};

const ru: LegalDoc = {
  title: "Условия использования",
  updated: "Действуют с 2 октября 2026 года",
  toc: "Содержание",
  intro: [
    "Эти условия регулируют использование ProofAPI: сайта proofapi.vercel.app, кабинета разработчика, API, TypeScript SDK и MCP-сервера. Пользуясь ProofAPI, вы принимаете эти условия. Если вы пользуетесь сервисом от имени компании, вы принимаете их за эту компанию.",
    "Как мы обращаемся с персональными данными, описано в Политике конфиденциальности, которая является частью этих условий.",
  ],
  sections: [
    {
      id: "service",
      title: "Сервис",
      blocks: [
        "ProofAPI записывает в блокчейн Solana SHA-256 отпечатки входа, результата ИИ и метаданных и выдаёт сертификат, который может проверить любой, у кого есть ссылка. Сайт также предлагает автоматический ИИ-разбор загруженных документов.",
        "ProofAPI управляет команда ProofAPI из Казахстана.",
      ],
    },
    {
      id: "beta",
      title: "Бета и тестовая сеть",
      blocks: [
        "ProofAPI находится в открытой бете. Записи сохраняются в Solana devnet — публичной тестовой сети, которой управляют третьи лица. Функции, лимиты и интерфейсы могут меняться, а devnet может быть сброшена или стать недоступной независимо от нас.",
        "Не используйте сертификаты беты как единственное доказательство для юридических, финансовых или регуляторных целей.",
      ],
    },
    {
      id: "proves",
      title: "Что доказывает сертификат",
      blocks: [
        "Сертификат показывает, что записанные данные не менялись с момента печати, и когда печать была поставлена по часам Solana.",
        {
          list: [
            "Он не доказывает, что результат ИИ верный, полный или законный.",
            "Он не доказывает, какая модель ИИ использовалась на самом деле: название модели заявляет тот, кто запечатал запись.",
            "Он не доказывает, кто написал входные данные и что они правдивы.",
            "ИИ-разбор на сайте выполняется автоматически и не является юридической, финансовой или иной профессиональной консультацией.",
          ],
        },
      ],
    },
    {
      id: "accounts",
      title: "Аккаунты и API-ключи",
      blocks: [
        "Вход в кабинет выполняется через GitHub. Вы отвечаете за действия в своём аккаунте и с вашими API-ключами.",
        {
          list: [
            "Храните API-ключи на своём сервере. Никогда не размещайте их в коде для браузера, мобильных приложениях или публичных репозиториях.",
            "Отзовите ключ в кабинете, как только заподозрите утечку.",
            "Сразу сообщите нам на " + EMAIL + ", если заметите несанкционированное использование.",
          ],
        },
      ],
    },
    {
      id: "acceptable-use",
      title: "Допустимое использование",
      blocks: [
        "Запрещается:",
        {
          list: [
            "запечатывать или загружать незаконное содержимое, содержимое, нарушающее чьи-либо права, или персональные данные, которые вы не вправе обрабатывать или передавать;",
            "использовать ProofAPI для обмана, например выдавать сертификат за доказательство того, чего он не доказывает;",
            "обходить лимиты в час или месяц, создавать аккаунты или ключи, чтобы их обойти, или перегружать сервис;",
            "исследовать, сканировать или атаковать сервис и его инфраструктуру, кроме ответственного раскрытия уязвимостей через " + EMAIL + ";",
            "загружать вредоносные программы или использовать сервис для рассылки спама;",
            "перепродавать сервис или выдавать его под своим брендом без нашего письменного согласия.",
          ],
        },
        "Мы можем ограничить, приостановить или отозвать доступ, который нарушает эти правила или создаёт риск для сервиса или других пользователей.",
      ],
    },
    {
      id: "content",
      title: "Ваше содержимое",
      blocks: [
        "Все права на содержимое, которое вы запечатываете или загружаете, остаются за вами. Вы предоставляете нам неисключительную всемирную лицензию хранить, обрабатывать, показывать и передавать его только в той мере, в какой это нужно для работы ProofAPI, включая показ на сертификате и включение в файл доказательств.",
        "Вы подтверждаете, что у вас есть права и разрешения на это содержимое, в том числе на содержащиеся в нём персональные данные.",
        "В текстовом режиме любой, у кого есть ссылка на сертификат, видит результат ИИ и может скачать вход и ответ. Для конфиденциальных данных используйте режим «только отпечатки».",
      ],
    },
    {
      id: "blockchain",
      title: "Записи в блокчейне постоянны",
      blocks: [
        "Отпечатки и данные записи в Solana не могут быть изменены или удалены ни нами, ни кем-либо другим. По вашему запросу мы удалим содержимое из нашей базы данных, но запись в блокчейне останется.",
        "Блокчейн-сетями управляют третьи лица. Мы не отвечаем за их доступность, комиссии и изменения их правил.",
      ],
    },
    {
      id: "fees",
      title: "Оплата",
      blocks: [
        "Во время беты ProofAPI бесплатен в пределах опубликованных лимитов. Тарифы на сайте описывают планируемые цены после беты.",
        "Мы сообщим как минимум за 30 дней до того, как к вашему аккаунту начнёт применяться платный тариф. Без вашего явного согласия ничего не списывается.",
      ],
    },
    {
      id: "ip",
      title: "Наше ПО и бренд",
      blocks: [
        "Исходный код ProofAPI опубликован под лицензией MIT, SDK распространяется через npm под той же лицензией. Название и логотип ProofAPI под эту лицензию не подпадают, и их нельзя использовать так, будто вы являетесь ProofAPI или мы вас одобряем.",
      ],
    },
    {
      id: "availability",
      title: "Доступность и гарантии",
      blocks: [
        "Мы стараемся, чтобы ProofAPI был доступен и работал точно, но предоставляем его «как есть» и «по мере доступности», без каких-либо гарантий, насколько это допускает закон. Во время беты время бесперебойной работы не гарантируется.",
      ],
    },
    {
      id: "liability",
      title: "Ограничение ответственности",
      blocks: [
        "Насколько это допускает закон, мы не отвечаем за косвенные убытки, упущенную выгоду или потерю данных, а также за решения, которые вы или другие люди принимают на основе результата ИИ или сертификата.",
        "Пока сервис бесплатный, наша общая ответственность перед вами по любым требованиям ограничена суммой 100 долларов США. Ничто в этих условиях не ограничивает ответственность, которую нельзя ограничить по закону.",
      ],
    },
    {
      id: "termination",
      title: "Прекращение использования",
      blocks: [
        "Вы можете в любой момент перестать пользоваться ProofAPI и попросить удалить аккаунт и сохранённое содержимое. Мы можем прекратить работу сервиса или закрыть аккаунт, нарушающий эти условия. Когда это возможно, мы заранее предупредим и дадим время скачать файлы доказательств.",
      ],
    },
    {
      id: "changes",
      title: "Изменение условий",
      blocks: [
        "Мы можем обновлять эти условия по мере развития сервиса. Дата вверху страницы указывает действующую редакцию. О существенных изменениях мы заранее сообщим на сайте. Если вы продолжите пользоваться ProofAPI после этого, действуют новые условия.",
      ],
    },
    {
      id: "law",
      title: "Применимое право",
      blocks: [
        "Эти условия регулируются законодательством Республики Казахстан. Любой спор мы сначала постараемся решить в переговорах с вами. Если это не удастся, спор рассматривается компетентными судами Республики Казахстан, если закон вашей страны не даёт вам как потребителю права на другой суд.",
      ],
    },
    {
      id: "contact",
      title: "Контакты",
      blocks: [`Вопросы об этих условиях: ${EMAIL}.`],
    },
  ],
};

const kk: LegalDoc = {
  title: "Пайдалану шарттары",
  updated: "2026 жылғы 2 қазаннан бастап күшінде",
  toc: "Мазмұны",
  intro: [
    "Бұл шарттар ProofAPI-ды пайдалануды реттейді: proofapi.vercel.app сайты, әзірлеуші кабинеті, API, TypeScript SDK және MCP сервері. ProofAPI-ды пайдалана отырып, сіз осы шарттарды қабылдайсыз. Сервисті компания атынан пайдалансаңыз, оларды сол компания үшін қабылдайсыз.",
    "Дербес деректермен қалай жұмыс істейтініміз осы шарттардың бөлігі болып табылатын Құпиялылық саясатында сипатталған.",
  ],
  sections: [
    {
      id: "service",
      title: "Сервис",
      blocks: [
        "ProofAPI кірістің, ЖИ нәтижесінің және метадеректердің SHA-256 іздерін Solana блокчейніне жазады және сілтемесі бар кез келген адам тексере алатын сертификат береді. Сайт сондай-ақ жүктелген құжаттарды автоматты ЖИ талдауын ұсынады.",
        "ProofAPI-ды Қазақстандағы ProofAPI командасы басқарады.",
      ],
    },
    {
      id: "beta",
      title: "Бета және тестілік желі",
      blocks: [
        "ProofAPI ашық бета-нұсқада. Жазбалар үшінші тұлғалар басқаратын Solana devnet ашық тестілік желісіне сақталады. Функциялар, лимиттер мен интерфейстер өзгеруі мүмкін, ал devnet бізге байланыссыз қалпына келтірілуі немесе қолжетімсіз болуы мүмкін.",
        "Бета сертификаттарын заңдық, қаржылық немесе реттеушілік мақсаттар үшін жалғыз дәлел ретінде пайдаланбаңыз.",
      ],
    },
    {
      id: "proves",
      title: "Сертификат нені дәлелдейді",
      blocks: [
        "Сертификат жазылған деректердің мөр басылғаннан бері өзгермегенін және мөрдің Solana сағаты бойынша қашан басылғанын көрсетеді.",
        {
          list: [
            "Ол ЖИ нәтижесінің дұрыс, толық немесе заңды екенін дәлелдемейді.",
            "Ол шын мәнінде қай ЖИ моделі қолданылғанын дәлелдемейді: модель атауын жазбаға мөр басқан адам мәлімдейді.",
            "Ол кіріс деректерді кім жазғанын және олардың шындығын дәлелдемейді.",
            "Сайттағы ЖИ талдауы автоматты түрде жасалады және заңдық, қаржылық немесе басқа кәсіби кеңес болып табылмайды.",
          ],
        },
      ],
    },
    {
      id: "accounts",
      title: "Аккаунттар және API кілттері",
      blocks: [
        "Кабинетке GitHub арқылы кіресіз. Аккаунтыңыздағы және API кілттеріңізбен жасалған әрекеттерге сіз жауап бересіз.",
        {
          list: [
            "API кілттерін өз серверіңізде сақтаңыз. Оларды ешқашан браузер кодына, мобильді қолданбаларға немесе ашық репозиторийлерге орналастырмаңыз.",
            "Кілт жария болды деп күдіктенсеңіз, оны кабинетте бірден кері қайтарыңыз.",
            "Рұқсатсыз пайдалануды байқасаңыз, бізге бірден " + EMAIL + " поштасына хабарлаңыз.",
          ],
        },
      ],
    },
    {
      id: "acceptable-use",
      title: "Рұқсат етілген пайдалану",
      blocks: [
        "Тыйым салынады:",
        {
          list: [
            "заңсыз мазмұнға, біреудің құқығын бұзатын мазмұнға немесе өңдеуге не беруге құқығыңыз жоқ дербес деректерге мөр басу немесе оларды жүктеу;",
            "ProofAPI-ды алдау үшін пайдалану, мысалы сертификатты ол дәлелдемейтін нәрсенің дәлелі ретінде көрсету;",
            "сағаттық немесе айлық лимиттерді айналып өту, оларды айналып өту үшін аккаунттар немесе кілттер жасау, сервисті шамадан тыс жүктеу;",
            "сервисті және оның инфрақұрылымын зерттеу, сканерлеу немесе оған шабуыл жасау, " + EMAIL + " арқылы осалдықты жауапкершілікпен ашудан басқа;",
            "зиянды бағдарламаларды жүктеу немесе сервисті спам жіберу үшін пайдалану;",
            "біздің жазбаша келісімімізсіз сервисті қайта сату немесе өз брендіңізбен ұсыну.",
          ],
        },
        "Осы ережелерді бұзатын немесе сервиске не басқа пайдаланушыларға қауіп төндіретін қолжетімділікті шектеуге, тоқтатуға немесе кері қайтаруға құқылымыз.",
      ],
    },
    {
      id: "content",
      title: "Сіздің мазмұныңыз",
      blocks: [
        "Мөр басатын немесе жүктейтін мазмұнға барлық құқықтар сізде қалады. Сіз бізге оны тек ProofAPI жұмысына қажетті көлемде, соның ішінде сертификатта көрсету және дәлелдер файлына қосу үшін сақтауға, өңдеуге, көрсетуге және беруге айрықша емес бүкіләлемдік лицензия бересіз.",
        "Сіз осы мазмұнға, соның ішінде ондағы дербес деректерге қажетті құқықтар мен рұқсаттарыңыз бар екенін растайсыз.",
        "Мәтін режимінде сертификат сілтемесі бар кез келген адам ЖИ нәтижесін көріп, кіріс пен жауапты жүктей алады. Құпия деректер үшін «тек іздер» режимін қолданыңыз.",
      ],
    },
    {
      id: "blockchain",
      title: "Блокчейндегі жазбалар тұрақты",
      blocks: [
        "Solana-ға жазылған іздер мен жазба деректерін біз де, басқа ешкім де өзгерте немесе жоя алмайды. Сұрауыңыз бойынша дерекқорымыздағы мазмұнды жоямыз, бірақ блокчейндегі жазба қалады.",
        "Блокчейн желілерін үшінші тұлғалар басқарады. Біз олардың қолжетімділігіне, комиссияларына және ережелерінің өзгеруіне жауап бермейміз.",
      ],
    },
    {
      id: "fees",
      title: "Төлем",
      blocks: [
        "Бета кезінде ProofAPI жарияланған лимиттер шегінде тегін. Сайттағы тарифтер бетадан кейінгі жоспарланған бағаларды сипаттайды.",
        "Аккаунтыңызға ақылы тариф қолданылмас бұрын кемінде 30 күн бұрын хабарлаймыз. Сіздің нақты келісіміңізсіз ештеңе алынбайды.",
      ],
    },
    {
      id: "ip",
      title: "Біздің бағдарламалық қамтама мен бренд",
      blocks: [
        "ProofAPI бастапқы коды MIT лицензиясымен жарияланған, SDK npm арқылы сол лицензиямен таратылады. ProofAPI атауы мен логотипі бұл лицензияға кірмейді және оларды өзіңізді ProofAPI ретінде немесе біз қолдайтындай етіп көрсету үшін пайдалануға болмайды.",
      ],
    },
    {
      id: "availability",
      title: "Қолжетімділік және кепілдіктер",
      blocks: [
        "Біз ProofAPI-дың қолжетімді әрі дәл жұмыс істеуіне тырысамыз, бірақ оны заң рұқсат еткен шекте ешқандай кепілдіксіз «сол күйінде» және «қолжетімді болғанда» ұсынамыз. Бета кезінде үздіксіз жұмыс уақытына кепілдік берілмейді.",
      ],
    },
    {
      id: "liability",
      title: "Жауапкершілікті шектеу",
      blocks: [
        "Заң рұқсат еткен шекте біз жанама шығындарға, жіберіп алынған пайдаға немесе деректердің жоғалуына, сондай-ақ сіз немесе басқалар ЖИ нәтижесі не сертификат негізінде қабылдаған шешімдерге жауап бермейміз.",
        "Сервис тегін болған кезде кез келген талап бойынша сіздің алдыңыздағы жалпы жауапкершілігіміз 100 АҚШ долларымен шектеледі. Бұл шарттардағы ешнәрсе заң бойынша шектеуге болмайтын жауапкершілікті шектемейді.",
      ],
    },
    {
      id: "termination",
      title: "Пайдалануды тоқтату",
      blocks: [
        "Сіз ProofAPI-ды кез келген уақытта пайдалануды тоқтатып, аккаунт пен сақталған мазмұнды жоюды сұрай аласыз. Біз сервистің жұмысын тоқтата аламыз немесе осы шарттарды бұзатын аккаунтты жаба аламыз. Мүмкін болғанда алдын ала ескертіп, дәлелдер файлдарын жүктеуге уақыт береміз.",
      ],
    },
    {
      id: "changes",
      title: "Шарттардың өзгеруі",
      blocks: [
        "Сервис дамыған сайын бұл шарттарды жаңартуымыз мүмкін. Беттің жоғарғы жағындағы күн қолданыстағы нұсқаны көрсетеді. Елеулі өзгерістер туралы сайтта алдын ала хабарлаймыз. Одан кейін ProofAPI-ды пайдалануды жалғастырсаңыз, жаңа шарттар қолданылады.",
      ],
    },
    {
      id: "law",
      title: "Қолданылатын құқық",
      blocks: [
        "Бұл шарттар Қазақстан Республикасының заңнамасымен реттеледі. Кез келген дауды алдымен сізбен келіссөз арқылы шешуге тырысамыз. Бұл мүмкін болмаса, елiңiздiң заңы тұтынушы ретінде басқа сотқа құқық бермесе, дау Қазақстан Республикасының құзыретті соттарында қаралады.",
      ],
    },
    {
      id: "contact",
      title: "Байланыс",
      blocks: [`Осы шарттар туралы сұрақтар: ${EMAIL}.`],
    },
  ],
};

export const TERMS: Record<Locale, LegalDoc> = { en, ru, kk };
