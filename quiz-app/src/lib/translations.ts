export type Language = 'en' | 'hu' | 'ua' | 'ru';

export interface Translations {
    // Join Screen
    welcomeTitle: string;
    enterName: string;
    joinButton: string;
    joining: string;
    chooseLanguage: string;

    // Waiting Screen
    waitingForHost: string;
    getReady: string;
    playersJoined: string;

    // Voting Screen
    round: string;
    of: string;
    whoIsThis: string;
    voteLocked: string;
    waitingForReveal: string;
    timesUp: string;
    everyoneVoted: string;
    votePoints3: string;
    votePoints2: string;
    votePoints1: string;
    waitingForHostToStart: string;

    // Result Screen
    correct: string;
    notQuite: string;
    itWas: string;
    noVote: string;
    yourScore: string;

    // Final Screen
    quizFinished: string;
    finalScore: string;
    checkHostScreen: string;
    hi: string;
    isItWhoYouThought: string;

    // Tutorial
    tutorialTitle: string;
    tutorialStep1: string;
    tutorialStep2: string;
    tutorialStep3: string;
    tutorialStep4: string;
    tutorialStep5: string;
    tutorialStep6: string;
    tutorialStep7: string;
    tutorialNext: string;
    tutorialStart: string;
    imReady: string;
    ready: string;
    tutorialDemoOptionA: string;
    tutorialDemoOptionB: string;
    tutorialDemoCorrect: string;
    tutorialDemoWrong: string;
    tutorialComplete: string;
    tutorialCompleteDesc: string;
}

export const translations: Record<Language, Translations> = {
    en: {
        welcomeTitle: "Welcome to the Quiz!",
        enterName: "Enter your name",
        joinButton: "Join Quiz 🚀",
        joining: "Joining...",
        chooseLanguage: "Choose Language",
        waitingForHost: "Waiting for Host...",
        getReady: "The quiz will start soon. Get ready!",
        playersJoined: "players joined",
        round: "Round",
        of: "of",
        whoIsThis: "Who is this? 🤔",
        voteLocked: "Vote locked!",
        waitingForReveal: "Waiting for reveal...",
        timesUp: "Time's up!",
        everyoneVoted: "Everyone has voted!",
        votePoints3: "🎯 3 Points if correct now!",
        votePoints2: "🎯 2 Points if correct now!",
        votePoints1: "🎯 1 Point if correct now!",
        waitingForHostToStart: "Waiting for the host to start...",
        correct: "Correct! 🎉",
        notQuite: "Not quite! 😅",
        itWas: "It was",
        noVote: "No vote 😶",
        yourScore: "Your Score",
        quizFinished: "Quiz Finished! 🏆",
        finalScore: "Your Final Score",
        checkHostScreen: "Check the host screen for the winners!",
        hi: "Hi",
        isItWhoYouThought: "Is it who you thought? 🧐",
        tutorialTitle: "How to Play",
        tutorialStep1: "Happy International Women's Day! 🌺 This quiz was specially designed for the awesome women we appreciate so much. You make this office a better place every day!",
        tutorialStep2: "Here is how we made it: We (the men) secretly assigned an 'Individual Trait', an 'Associated Item', and an adjective to each of you.",
        tutorialStep3: "Then, we used an AI image generator to create sympathetic caricatures based on those words! Your job is to try and guess who from you is on those images.",
        tutorialStep4: "Phase 1: You'll see the describing words on the TV. Guess correctly on your phone for 3 Points!",
        tutorialStep5: "Phase 2: If you didn't get it, the 1st caricature is revealed on the TV. Lock in your guess for 2 Points!",
        tutorialStep6: "Phase 3: Still not sure? The 2nd caricature is revealed. Guess correctly here for 1 Point! The best guesser with the most points at the end WINS! 🏆",
        tutorialStep7: "Let's try a demo! Who is this?",
        tutorialNext: "Next",
        tutorialStart: "Start Tutorial",
        imReady: "I'm Ready! 🚀",
        ready: "Ready",
        tutorialDemoOptionA: "Person A",
        tutorialDemoOptionB: "Person B",
        tutorialDemoCorrect: "Correct! +2 Pts 🎉",
        tutorialDemoWrong: "Not quite! 😅",
        tutorialComplete: "Great job!",
        tutorialCompleteDesc: "You're all set to play the real game.",
    },
    hu: {
        welcomeTitle: "Üdvözöljük a kvízben!",
        enterName: "Add meg a neved",
        joinButton: "Csatlakozás 🚀",
        joining: "Csatlakozás...",
        chooseLanguage: "Nyelv választása",
        waitingForHost: "Várakozás a házigazdára...",
        getReady: "A kvíz hamarosan kezdődik. Készülj fel!",
        playersJoined: "játékos csatlakozott",
        round: "Forduló",
        of: "/",
        whoIsThis: "Ki ez? 🤔",
        voteLocked: "Szavazat rögzítve!",
        waitingForReveal: "Várakozás a felfedésre...",
        timesUp: "Lejárt az idő!",
        everyoneVoted: "Mindenki szavazott!",
        votePoints3: "🎯 3 pont, ha most kitalálod!",
        votePoints2: "🎯 2 pont, ha most kitalálod!",
        votePoints1: "🎯 1 pont, ha most kitalálod!",
        waitingForHostToStart: "Várakozás a házigazdára...",
        correct: "Helyes! 🎉",
        notQuite: "Nem egészen! 😅",
        itWas: "Ez",
        noVote: "Nincs szavazat 😶",
        yourScore: "Pontszámod",
        quizFinished: "Kvíz vége! 🏆",
        finalScore: "Végső pontszámod",
        checkHostScreen: "Nézd a főképernyőt a győztesekért!",
        hi: "Szia",
        isItWhoYouThought: "Ez az akire gondoltál? 🧐",
        tutorialTitle: "Hogyan játssz",
        tutorialStep1: "Boldog Nemzetközi Nőnapot! 🌺 Ezt a kvízt kifejezetten a mi csodálatos női kollégáinknak készítettük. Ti teszitek szebbé ezt az irodát minden nap!",
        tutorialStep2: "Így készült: Mi (férfiak) titokban mindenkihez rendeltünk egy 'Személyes tulajdonságot', egy 'Tárgyat' és egy jelzőt.",
        tutorialStep3: "Majd ezekből a szavakból egy AI segítségével jópofa karikatúrákat generáltunk! A feladatod az, hogy kitaláld, ki van a képeken.",
        tutorialStep4: "1. fázis: A TV-n látni fogod a leíró szavakat. Ha eltalálod a telefonodon, 3 pont a jutalmad!",
        tutorialStep5: "2. fázis: Ha nem tudtad, felfedjük az 1. karikatúrát. Ha itt találod el, az 2 pontot ér!",
        tutorialStep6: "3. fázis: Még mindig nem tudod? Jön a 2. karikatúra. Helyes válasz esetén 1 pont jár! A legtöbb pontot gyűjtő tippelő NYER! 🏆",
        tutorialStep7: "Kezdjük egy demóval! Szerinted ki ez?",
        tutorialNext: "Tovább",
        tutorialStart: "Tanfolyam indítása",
        imReady: "Készen állok! 🚀",
        ready: "Kész",
        tutorialDemoOptionA: "Személy A",
        tutorialDemoOptionB: "Személy B",
        tutorialDemoCorrect: "Helyes! +2 pont 🎉",
        tutorialDemoWrong: "Nem egészen! 😅",
        tutorialComplete: "Szuper!",
        tutorialCompleteDesc: "Készen állsz a játékra.",
    },
    ua: {
        welcomeTitle: "Ласкаво просимо до квізу!",
        enterName: "Введіть ваше ім'я",
        joinButton: "Приєднатися 🚀",
        joining: "Приєднання...",
        chooseLanguage: "Виберіть мову",
        waitingForHost: "Чекаємо на ведучого...",
        getReady: "Квіз скоро почнеться. Готуйтеся!",
        playersJoined: "гравців приєдналося",
        round: "Раунд",
        of: "з",
        whoIsThis: "Хто це? 🤔",
        voteLocked: "Голос прийнято!",
        waitingForReveal: "Чекаємо на розкриття...",
        timesUp: "Час вийшов!",
        everyoneVoted: "Всі проголосували!",
        votePoints3: "🎯 3 бали за правильну відповідь зараз!",
        votePoints2: "🎯 2 бали за правильну відповідь зараз!",
        votePoints1: "🎯 1 бал за правильну відповідь зараз!",
        waitingForHostToStart: "Чекаємо на ведучого...",
        correct: "Правильно! 🎉",
        notQuite: "Не зовсім! 😅",
        itWas: "Це був",
        noVote: "Немає голосу 😶",
        yourScore: "Ваш рахунок",
        quizFinished: "Квіз завершено! 🏆",
        finalScore: "Ваш фінальний рахунок",
        checkHostScreen: "Дивіться на екран ведучого для визначення переможців!",
        hi: "Привіт",
        isItWhoYouThought: "Це той, хто ви думали? 🧐",
        tutorialTitle: "Як грати",
        tutorialStep1: "З Міжнародним жіночим днем! 🌺 Цей квіз був спеціально створений для наших чудових жінок. Ви робите наш офіс кращим щодня!",
        tutorialStep2: "Ось як ми це зробили: Ми (чоловіки) таємно призначили 'Особисту рису', 'Пов'язаний предмет' та прикметник кожній з вас.",
        tutorialStep3: "Потім за допомогою штучного інтелекту ми створили симпатичні карикатури з цих слів! Ваше завдання - відгадати, хто зображений на цих зображеннях.",
        tutorialStep4: "Фаза 1: Ви побачите слова-описи на телевізорі. Відгадайте правильно на телефоні та отримайте 3 бали!",
        tutorialStep5: "Фаза 2: Якщо не вийшло, з'явиться 1-ша карикатура. Ваша правильна відповідь тут принесе 2 бали!",
        tutorialStep6: "Фаза 3: Все ще не впевнені? З'являється 2-га карикатура. За правильну здогадку тут ви отримаєте 1 бал! Перемагає той, хто набере найбільше балів! 🏆",
        tutorialStep7: "Давайте спробуємо демо! Як ви думаєте, хто це?",
        tutorialNext: "Далі",
        tutorialStart: "Почати навчання",
        imReady: "Я готовий(а)! 🚀",
        ready: "Готовий(а)",
        tutorialDemoOptionA: "Особа A",
        tutorialDemoOptionB: "Особа B",
        tutorialDemoCorrect: "Правильно! +2 бали 🎉",
        tutorialDemoWrong: "Не зовсім! 😅",
        tutorialComplete: "Чудово!",
        tutorialCompleteDesc: "Ви готові до гри.",
    },
    ru: {
        welcomeTitle: "Добро пожаловать в квиз!",
        enterName: "Введите ваше имя",
        joinButton: "Присоединиться 🚀",
        joining: "Присоединение...",
        chooseLanguage: "Выберите язык",
        waitingForHost: "Ожидание ведущего...",
        getReady: "Квиз скоро начнется. Приготовьтесь!",
        playersJoined: "игроков присоединилось",
        round: "Раунд",
        of: "из",
        whoIsThis: "Кто это? 🤔",
        voteLocked: "Голос принят!",
        waitingForReveal: "Ожидание раскрытия...",
        timesUp: "Время вышло!",
        everyoneVoted: "Все проголосовали!",
        votePoints3: "🎯 3 балла за правильный ответ сейчас!",
        votePoints2: "🎯 2 балла за правильный ответ сейчас!",
        votePoints1: "🎯 1 балл за правильный ответ сейчас!",
        waitingForHostToStart: "Ожидание ведущего...",
        correct: "Правильно! 🎉",
        notQuite: "Не совсем! 😅",
        itWas: "Это был",
        noVote: "Нет голоса 😶",
        yourScore: "Ваш счет",
        quizFinished: "Квиз завершен! 🏆",
        finalScore: "Ваш финальный счет",
        checkHostScreen: "Смотрите на экран ведущего для определения победителей!",
        hi: "Привет",
        isItWhoYouThought: "Это тот, кто вы думали? 🧐",
        tutorialTitle: "Как играть",
        tutorialStep1: "С Международным женским днем! 🌺 Этот квиз был специально создан для наших замечательных женщин. Вы делаете наш офис лучше каждый день!",
        tutorialStep2: "Вот как это было: Мы (мужчины) тайно присвоили каждой из вас 'Индивидуальную черту', 'Связанный предмет' и прилагательное.",
        tutorialStep3: "Затем с помощью ИИ мы создали симпатичные карикатуры по этим словам! Ваша задача - угадать, кто на этих изображениях.",
        tutorialStep4: "Фаза 1: Вы увидите слова-описания на телевизоре. Правильный ответ на телефоне принесет вам 3 балла!",
        tutorialStep5: "Фаза 2: Если не получилось, появится 1-я карикатура. Правильный ответ здесь стоит 2 балла!",
        tutorialStep6: "Фаза 3: Все еще не уверены? Появляется 2-я карикатура. За правильную догадку здесь вы получите 1 балл! Победит набравший наибольшее количество баллов! 🏆",
        tutorialStep7: "Давайте проведем демо! Как вы думаете, кто это?",
        tutorialNext: "Далее",
        tutorialStart: "Начать обучение",
        imReady: "Я готов(а)! 🚀",
        ready: "Готов(а)",
        tutorialDemoOptionA: "Человек A",
        tutorialDemoOptionB: "Человек B",
        tutorialDemoCorrect: "Правильно! +2 балла 🎉",
        tutorialDemoWrong: "Не совсем! 😅",
        tutorialComplete: "Отлично!",
        tutorialCompleteDesc: "Вы готовы к игре.",
    },
};
