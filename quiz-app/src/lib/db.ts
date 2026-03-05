import { db, storage } from './firebase';
import { ref as dbRef, set, get, child, update, remove, onValue, off } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Quiz, Person, Round, Player, Vote } from './types';
import { v4 as uuidv4 } from 'uuid';

const QUIZ_ID = 'main-quiz';
const quizRef = dbRef(db, `quizzes/${QUIZ_ID}`);

// Listener
export function subscribeToQuiz(callback: (quiz: Quiz | null) => void) {
    onValue(quizRef, (snapshot) => {
        if (!snapshot.exists()) {
            callback(null);
            return;
        }

        const data = snapshot.val();

        // Convert Firebase objects to arrays for easier mapping
        const quiz: Quiz = {
            id: data.id || QUIZ_ID,
            title: data.title || '',
            status: data.status || 'draft',
            currentRoundIndex: data.currentRoundIndex || 0,
            persons: data.persons ? (Object.values(data.persons) as Person[]).sort((a: any, b: any) => a.orderIndex - b.orderIndex) : [],
            players: data.players ? (Object.values(data.players) as Player[]) : [],
            rounds: data.rounds ? (Object.values(data.rounds) as Round[]) : [],
        };

        callback(quiz);
    });

    return () => off(quizRef);
}

// Admin API
export async function createQuiz(title: string) {
    await set(quizRef, {
        id: QUIZ_ID,
        title,
        status: 'draft',
        currentRoundIndex: 0,
        persons: {},
        players: {},
        rounds: {}
    });
}

export async function addPerson(name: string, caricatureUrl: string, realPhotoUrl: string) {
    const quizSnapshot = await get(quizRef);
    if (!quizSnapshot.exists()) return;

    const quiz = quizSnapshot.val();
    const persons = quiz.persons ? Object.values(quiz.persons) : [];

    const id = uuidv4();
    const person: Person = {
        id,
        name,
        caricatureUrl,
        realPhotoUrl,
        orderIndex: persons.length
    };

    await set(child(quizRef, `persons/${id}`), person);
}

export async function removePerson(personId: string) {
    await remove(child(quizRef, `persons/${personId}`));

    // Reorder remaining
    const quizSnapshot = await get(quizRef);
    if (!quizSnapshot.exists()) return;

    const persons = quizSnapshot.val().persons;
    if (!persons) return;

    const updates: Record<string, any> = {};
    Object.values(persons)
        .sort((a: any, b: any) => a.orderIndex - b.orderIndex)
        .forEach((p: any, i) => {
            updates[`persons/${p.id}/orderIndex`] = i;
        });

    await update(quizRef, updates);
}

export async function publishQuiz() {
    const quizSnapshot = await get(quizRef);
    if (!quizSnapshot.exists()) return;

    const quiz = quizSnapshot.val();
    const persons: Person[] = quiz.persons ? Object.values(quiz.persons) : [];

    persons.sort((a, b) => a.orderIndex - b.orderIndex);

    const rounds: Record<string, any> = {};
    persons.forEach((p, index) => {
        rounds[index.toString()] = {
            personId: p.id,
            status: 'pending',
            votingEndsAt: null,
            votes: {}
        };
    });

    await update(quizRef, {
        status: 'live',
        currentRoundIndex: 0,
        rounds
    });
}

export async function deleteQuiz() {
    await remove(quizRef);
}

// Host API
export async function startRound() {
    const quizSnapshot = await get(quizRef);
    if (!quizSnapshot.exists()) return;

    const quiz = quizSnapshot.val();
    const idx = quiz.currentRoundIndex || 0;

    await update(child(quizRef, `rounds/${idx}`), {
        status: 'voting',
        votingEndsAt: Date.now() + 10000,
        votes: {}
    });
}

export async function revealRound() {
    const quizSnapshot = await get(quizRef);
    if (!quizSnapshot.exists()) return;

    const quiz = quizSnapshot.val();
    const idx = quiz.currentRoundIndex || 0;

    await update(child(quizRef, `rounds/${idx}`), {
        status: 'revealed'
    });

    // Calculate scores
    const round = quiz.rounds[idx];
    if (!round || !round.votes) return;

    const correctPersonId = round.personId;
    const updates: Record<string, any> = {};

    Object.values(round.votes).forEach((vote: any) => {
        if (vote.guessedPersonId === correctPersonId) {
            const player = quiz.players && quiz.players[vote.playerId];
            if (player) {
                updates[`players/${vote.playerId}/score`] = (player.score || 0) + 1;
            }
        }
    });

    if (Object.keys(updates).length > 0) {
        await update(quizRef, updates);
    }
}

export async function nextRound() {
    const quizSnapshot = await get(quizRef);
    if (!quizSnapshot.exists()) return;

    const quiz = quizSnapshot.val();
    const currentIdx = quiz.currentRoundIndex || 0;

    await update(quizRef, {
        currentRoundIndex: currentIdx + 1
    });
}

export async function finishQuiz() {
    await update(quizRef, { status: 'finished' });
}

export async function resetQuiz() {
    const quizSnapshot = await get(quizRef);
    if (!quizSnapshot.exists()) return;

    const quiz = quizSnapshot.val();
    const updates: Record<string, any> = {
        status: 'live',
        currentRoundIndex: 0
    };

    if (quiz.players) {
        Object.keys(quiz.players).forEach(pId => {
            updates[`players/${pId}/score`] = 0;
        });
    }

    if (quiz.rounds) {
        Object.keys(quiz.rounds).forEach(rIdx => {
            updates[`rounds/${rIdx}/status`] = 'pending';
            updates[`rounds/${rIdx}/votingEndsAt`] = null;
            updates[`rounds/${rIdx}/votes`] = null;
        });
    }

    await update(quizRef, updates);
}

// Player API
export async function joinQuiz(displayName: string, quizId: string): Promise<Player | null> {
    const qs = await get(quizRef);
    if (!qs.exists()) return null;

    const quiz = qs.val();

    // Check if player exists
    if (quiz.players) {
        const existing = Object.values(quiz.players).find((p: any) => p.displayName.toLowerCase() === displayName.toLowerCase());
        if (existing) return existing as Player;
    }

    const id = uuidv4();
    const player: Player = {
        id,
        displayName,
        score: 0
    };

    await set(child(quizRef, `players/${id}`), player);
    return player;
}

export async function submitVote(playerId: string, guessedPersonId: string) {
    const qs = await get(quizRef);
    if (!qs.exists()) return;

    const quiz = qs.val();
    const idx = quiz.currentRoundIndex || 0;
    const round = quiz.rounds && quiz.rounds[idx];

    if (!round || round.status !== 'voting') return;
    if (round.votingEndsAt && Date.now() > round.votingEndsAt) return;

    // Check if already voted
    if (round.votes && round.votes[playerId]) return;

    const vote: Vote = {
        playerId,
        guessedPersonId,
        timestamp: Date.now()
    };

    await set(child(quizRef, `rounds/${idx}/votes/${playerId}`), vote);
}

// Storage API
export async function uploadImage(file: File): Promise<string> {
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${uuidv4()}.${ext}`;
    const fileRef = storageRef(storage, `uploads/${filename}`);

    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
}
