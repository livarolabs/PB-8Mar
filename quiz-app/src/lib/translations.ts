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
        correct: "Correct! 🎉",
        notQuite: "Not quite! 😅",
        itWas: "It was",
        noVote: "No vote 😶",
        yourScore: "Your Score",
        quizFinished: "Quiz Finished! 🏆",
        finalScore: "Your Final Score",
        checkHostScreen: "Check the host screen for the winners!",
        hi: "Hi",
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
        correct: "Helyes! 🎉",
        notQuite: "Nem egészen! 😅",
        itWas: "Ez",
        noVote: "Nincs szavazat 😶",
        yourScore: "Pontszámod",
        quizFinished: "Kvíz vége! 🏆",
        finalScore: "Végső pontszámod",
        checkHostScreen: "Nézd a főképernyőt a győztesekért!",
        hi: "Szia",
    },
    ua: {
        welcomeTitle: "Welcome to the quiz!",
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
        correct: "Правильно! 🎉",
        notQuite: "Не зовсім! 😅",
        itWas: "Це був",
        noVote: "Немає голосу 😶",
        yourScore: "Ваш рахунок",
        quizFinished: "Квіз завершено! 🏆",
        finalScore: "Ваш фінальний рахунок",
        checkHostScreen: "Дивіться на екран ведучого для визначення переможців!",
        hi: "Привіт",
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
        correct: "Правильно! 🎉",
        notQuite: "Не совсем! 😅",
        itWas: "Это был",
        noVote: "Нет голоса 😶",
        yourScore: "Ваш счет",
        quizFinished: "Квиз завершен! 🏆",
        finalScore: "Ваш финальный счет",
        checkHostScreen: "Смотрите на экран ведущего для определения победителей!",
        hi: "Привет",
    }
};
