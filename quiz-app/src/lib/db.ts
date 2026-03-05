import { db, storage, auth, googleProvider } from './firebase';
import { ref as dbRef, set, get, child, update, remove, onValue, off, DatabaseReference, DataSnapshot } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { Quiz, Person, Round, Player, Vote } from './types';
import { Language } from './translations';
import { v4 as uuidv4 } from 'uuid';

// Helper: reliable single-read that works on mobile Safari
// Firebase get() can hang on mobile browsers; onValue with onlyOnce is more reliable
function getOnce(ref: DatabaseReference, timeoutMs = 8000): Promise<DataSnapshot> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            off(ref);
            reject(new Error('Firebase read timed out'));
        }, timeoutMs);

        onValue(ref, (snapshot) => {
            clearTimeout(timer);
            resolve(snapshot);
        }, (error) => {
            clearTimeout(timer);
            reject(error);
        }, { onlyOnce: true });
    });
}

// --- Auth API ---

export function onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
}

export async function loginWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.error("Login failed:", error);
        throw error;
    }
}

export async function logout() {
    await signOut(auth);
}

// --- Database API ---

// List quizzes for a specific owner
export async function listQuizzes(ownerId?: string): Promise<Quiz[]> {
    const quizzesRef = dbRef(db, 'quizzes');
    const snapshot = await get(quizzesRef);
    if (!snapshot.exists()) return [];

    const data = snapshot.val();
    let quizzes = Object.values(data).map((q: any) => ({
        ...q,
        persons: q.persons ? Object.values(q.persons) : [],
        players: q.players ? Object.values(q.players) : [],
        rounds: q.rounds ? Object.values(q.rounds) : [],
    }));

    // Filter by owner if provided
    if (ownerId) {
        quizzes = quizzes.filter((q: any) => q.ownerId === ownerId);
    }

    return quizzes.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)) as Quiz[];
}

// Listener for a specific quiz
export function subscribeToQuiz(quizId: string, callback: (quiz: Quiz | null) => void) {
    const quizRef = dbRef(db, `quizzes/${quizId}`);
    onValue(quizRef, (snapshot) => {
        if (!snapshot.exists()) {
            callback(null);
            return;
        }

        const data = snapshot.val();

        // Convert Firebase objects to arrays for easier mapping
        const quiz: Quiz = {
            id: data.id || quizId,
            title: data.title || '',
            status: data.status || 'draft',
            currentRoundIndex: data.currentRoundIndex || 0,
            ownerId: data.ownerId || '',
            settings: data.settings || { votingDuration: 15, votingMode: 'countdown' },
            persons: data.persons ? (Object.values(data.persons) as Person[]).sort((a: any, b: any) => a.orderIndex - b.orderIndex) : [],
            players: data.players ? (Object.values(data.players) as Player[]) : [],
            rounds: data.rounds ? (Object.values(data.rounds) as Round[]) : [],
        };

        callback(quiz);
    });

    return () => off(quizRef);
}

// Admin API
export async function createQuiz(title: string, ownerId: string): Promise<string> {
    const id = uuidv4();
    const quizRef = dbRef(db, `quizzes/${id}`);
    await set(quizRef, {
        id,
        title,
        status: 'draft',
        currentRoundIndex: 0,
        ownerId,
        settings: {
            votingDuration: 15,
            votingMode: 'countdown'
        },
        createdAt: Date.now(),
        persons: {},
        players: {},
        rounds: {}
    });
    return id;
}

export async function addPerson(quizId: string, name: string, caricatureUrl1: string, caricatureUrl2: string) {
    const id = uuidv4();
    const quizRef = dbRef(db, `quizzes/${quizId}`);
    const quizSnapshot = await get(quizRef);
    if (!quizSnapshot.exists()) return;

    const quiz = quizSnapshot.val();
    const persons = quiz.persons ? Object.values(quiz.persons) : [];

    const person: Person = {
        id,
        name,
        caricatureUrl1,
        caricatureUrl2,
        orderIndex: persons.length
    };

    await set(child(quizRef, `persons/${id}`), person);
}

export async function updatePerson(quizId: string, personId: string, updates: Partial<Person>) {
    const personRef = dbRef(db, `quizzes/${quizId}/persons/${personId}`);
    await update(personRef, updates);
}

export async function removePerson(quizId: string, personId: string) {
    const quizRef = dbRef(db, `quizzes/${quizId}`);
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

export async function publishQuiz(quizId: string) {
    const quizRef = dbRef(db, `quizzes/${quizId}`);
    const quizSnapshot = await get(quizRef);
    if (!quizSnapshot.exists()) return;

    const quiz = quizSnapshot.val();
    const persons: Person[] = quiz.persons ? Object.values(quiz.persons) : [];

    // Randomize the order of persons for the rounds
    const shuffledPersons = [...persons].sort(() => Math.random() - 0.5);

    const rounds: Record<string, any> = {};
    shuffledPersons.forEach((p, index) => {
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

export async function deleteQuiz(quizId: string) {
    const quizRef = dbRef(db, `quizzes/${quizId}`);
    await remove(quizRef);
}

// Host API
export async function startRound(quizId: string) {
    const quizRef = dbRef(db, `quizzes/${quizId}`);
    const quizSnapshot = await get(quizRef);
    if (!quizSnapshot.exists()) return;

    const quiz = quizSnapshot.val();
    const idx = quiz.currentRoundIndex || 0;
    const isWaitForAll = quiz.settings?.votingMode === 'all_voted';
    const duration = (quiz.settings?.votingDuration || 15) * 1000;

    await update(child(quizRef, `rounds/${idx}`), {
        status: 'voting',
        votingEndsAt: isWaitForAll ? null : Date.now() + duration,
        votes: {}
    });
}

export async function updateQuizSettings(quizId: string, settings: Quiz['settings']) {
    const quizRef = dbRef(db, `quizzes/${quizId}`);
    await update(quizRef, { settings });
}

export async function revealCaricature(quizId: string) {
    const quizRef = dbRef(db, `quizzes/${quizId}`);
    const quizSnapshot = await get(quizRef);
    if (!quizSnapshot.exists()) return;

    const quiz = quizSnapshot.val();
    const idx = quiz.currentRoundIndex || 0;

    await update(child(quizRef, `rounds/${idx}`), {
        status: 'revealing'
    });
}

export async function revealName(quizId: string) {
    const quizRef = dbRef(db, `quizzes/${quizId}`);
    const quizSnapshot = await get(quizRef);
    if (!quizSnapshot.exists()) return;

    const quiz = quizSnapshot.val();
    const idx = quiz.currentRoundIndex || 0;
    const round = quiz.rounds[idx];

    await update(child(quizRef, `rounds/${idx}`), {
        status: 'revealed'
    });

    // Calculate scores for ALL correct votes in this round
    if (!round || !round.votes) return;

    const correctPersonId = round.personId;
    const updates: Record<string, any> = {};

    Object.values(round.votes).forEach((vote: any) => {
        if (vote.guessedPersonId === correctPersonId) {
            const player = quiz.players && quiz.players[vote.playerId];
            if (player) {
                const currentScore = player.score || 0;
                const pointsToAdd = vote.points || 0;
                updates[`players/${vote.playerId}/score`] = currentScore + pointsToAdd;
            }
        }
    });

    if (Object.keys(updates).length > 0) {
        await update(quizRef, updates);
    }
}

export async function nextRound(quizId: string) {
    const quizRef = dbRef(db, `quizzes/${quizId}`);
    const quizSnapshot = await get(quizRef);
    if (!quizSnapshot.exists()) return;

    const quiz = quizSnapshot.val();
    const currentIdx = quiz.currentRoundIndex || 0;

    await update(quizRef, {
        currentRoundIndex: currentIdx + 1
    });
}

export async function finishQuiz(quizId: string) {
    const quizRef = dbRef(db, `quizzes/${quizId}`);
    await update(quizRef, { status: 'finished' });
}

export async function resetQuiz(quizId: string) {
    const quizRef = dbRef(db, `quizzes/${quizId}`);
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
export async function joinQuiz(displayName: string, quizId: string, language: Language = 'en'): Promise<Player | null> {
    console.log('[joinQuiz] Starting...', { displayName, quizId, language });
    const quizRef = dbRef(db, `quizzes/${quizId}`);
    try {
        console.log('[joinQuiz] Fetching quiz data...');
        const qs = await getOnce(quizRef);
        console.log('[joinQuiz] Got quiz snapshot, exists:', qs.exists());
        if (!qs.exists()) {
            console.error('[joinQuiz] quiz not found', quizId);
            return null;
        }

        const quiz = qs.val();
        console.log('[joinQuiz] Players count:', quiz.players ? Object.keys(quiz.players).length : 0);

        // Check if player already exists
        if (quiz.players) {
            const existingEntry = Object.entries(quiz.players).find(
                ([, p]: [string, any]) => p.displayName?.toLowerCase() === displayName.toLowerCase()
            );
            if (existingEntry) {
                const [existingId, existingData] = existingEntry as [string, any];
                console.log('[joinQuiz] Found existing player:', existingId);
                // Update language if changed, and backfill missing fields
                const updates: Record<string, any> = {};
                if (existingData.language !== language) updates.language = language;
                if (existingData.isReady === undefined) updates.isReady = false;
                if (existingData.isTutorialFinished === undefined) updates.isTutorialFinished = false;

                if (Object.keys(updates).length > 0) {
                    console.log('[joinQuiz] Updating existing player fields:', updates);
                    await update(child(quizRef, `players/${existingId}`), updates);
                    console.log('[joinQuiz] Updated existing player');
                }

                return {
                    ...existingData,
                    id: existingId,
                    language,
                    isReady: existingData.isReady ?? false,
                    isTutorialFinished: existingData.isTutorialFinished ?? false,
                } as Player;
            }
        }

        const id = uuidv4();
        const player: Player = {
            id,
            displayName,
            score: 0,
            joinedAt: Date.now(),
            language,
            isReady: false,
            isTutorialFinished: false,
        };

        console.log('[joinQuiz] Creating new player:', id);
        await set(child(quizRef, `players/${id}`), player);
        console.log('[joinQuiz] Player created successfully');
        return player;
    } catch (error) {
        console.error('[joinQuiz] ERROR:', error);
        throw error;
    }
}

export async function submitVote(quizId: string, playerId: string, guessedPersonId: string) {
    const quizRef = dbRef(db, `quizzes/${quizId}`);
    const qs = await getOnce(quizRef);
    if (!qs.exists()) return;

    const quiz = qs.val();
    const idx = quiz.currentRoundIndex || 0;
    const round = quiz.rounds && quiz.rounds[idx];

    if (!round) return;
    if (round.status !== 'voting' && round.status !== 'revealing') return;
    if (round.status === 'voting' && round.votingEndsAt && Date.now() > round.votingEndsAt) return;

    // Check if already voted
    if (round.votes && round.votes[playerId]) return;

    const points = round.status === 'voting' ? 2 : 1;

    const vote: Vote = {
        playerId,
        guessedPersonId,
        timestamp: Date.now(),
        points
    };

    await set(child(quizRef, `rounds/${idx}/votes/${playerId}`), vote);
}

export async function setPlayerReady(quizId: string, playerId: string, isReady: boolean) {
    const playerRef = dbRef(db, `quizzes/${quizId}/players/${playerId}`);
    await update(playerRef, { isReady });
}

export async function setTutorialFinished(quizId: string, playerId: string) {
    const playerRef = dbRef(db, `quizzes/${quizId}/players/${playerId}`);
    await update(playerRef, { isTutorialFinished: true });
}

// Storage API
export async function uploadImage(file: File): Promise<string> {
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${uuidv4()}.${ext}`;
    const fileRef = storageRef(storage, `uploads/${filename}`);

    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
}
