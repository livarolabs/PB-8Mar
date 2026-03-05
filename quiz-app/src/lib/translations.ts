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
    correctAnswer2pts: string;
    lastChance1pt: string;
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
        correctAnswer2pts: "🎯 Correct answer: 2 Points",
        lastChance1pt: "🎯 Last chance: 1 Point",
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
        tutorialStep1: "Phase 1: First Caricature. Guess correctly for 2 Points! 🎨",
        tutorialStep2: "Phase 2: Second Caricature. Last chance to guess for 1 Point! ✨",
        tutorialStep3: "Phase 3: Name Reveal. See who it was and check your score! 🎉",
        tutorialStep4: "Let's try! Who is this? (Hint: It's a demo)",
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
        correctAnswer2pts: "🎯 Helyes válasz: 2 pont",
        lastChance1pt: "🎯 Utolsó esély: 1 pont",
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
        tutorialStep1: "1. fázis: Első karikatúra. Találd el 2 pontért! 🎨",
        tutorialStep2: "2. fázis: Második karikatúra. Utolsó esély 1 pontért! ✨",
        tutorialStep3: "3. fázis: Név felfedése. Nézd meg ki volt és mennyi pontot kaptál! 🎉",
        tutorialStep4: "Próbáljuk ki! Ki ez? (Tipp: ez csak egy demó)",
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
        correctAnswer2pts: "🎯 Правильна відповідь: 2 бали",
        lastChance1pt: "🎯 Останній шанс: 1 бал",
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
        tutorialStep1: "Фаза 1: Перша карикатура. Вгадайте правильно за 2 бали! 🎨",
        tutorialStep2: "Фаза 2: Друга карикатура. Остання можливість вгадати за 1 бал! ✨",
        tutorialStep3: "Фаза 3: Розкриття імені. Дізнайтеся, хто це, та перевірте рахунок! 🎉",
        tutorialStep4: "Спробуймо! Хто це? (Підказка: це демо)",
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
        correctAnswer2pts: "🎯 Правильный ответ: 2 балла",
        lastChance1pt: "🎯 Последний шанс: 1 балл",
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
        tutorialStep1: "Фаза 1: Первая карикатура. Угадайте правильно за 2 балла! 🎨",
        tutorialStep2: "Фаза 2: Вторая карикатура. Последний шанс угадать за 1 балл! ✨",
        tutorialStep3: "Фаза 3: Раскрытие имени. Узнайте, кто это, и проверьте счет! 🎉",
        tutorialStep4: "Давайте попробуем! Кто это? (Подсказка: это демо)",
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
