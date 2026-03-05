// In-memory quiz store (singleton via globalThis for hot-reload persistence)

import { v4 as uuidv4 } from 'uuid';
import { Quiz, Person, Round, Vote, Player } from './types';

class QuizStore {
    private quiz: Quiz | null = null;

    createQuiz(title: string): Quiz {
        this.quiz = {
            id: uuidv4(),
            title,
            status: 'draft',
            currentRoundIndex: 0,
            persons: [],
            rounds: [],
            players: [],
        };
        return this.quiz;
    }

    getQuiz(): Quiz | null {
        return this.quiz;
    }

    addPerson(name: string, caricatureUrl: string, realPhotoUrl: string): Person {
        if (!this.quiz) throw new Error('No quiz created');
        const person: Person = {
            id: uuidv4(),
            name,
            caricatureUrl,
            realPhotoUrl,
            orderIndex: this.quiz.persons.length,
        };
        this.quiz.persons.push(person);
        return person;
    }

    removePerson(personId: string): void {
        if (!this.quiz) throw new Error('No quiz');
        this.quiz.persons = this.quiz.persons.filter(p => p.id !== personId);
        this.quiz.persons.forEach((p, i) => (p.orderIndex = i));
    }

    reorderPersons(personIds: string[]): void {
        if (!this.quiz) throw new Error('No quiz');
        const reordered = personIds
            .map(id => this.quiz!.persons.find(p => p.id === id))
            .filter(Boolean) as Person[];
        reordered.forEach((p, i) => (p.orderIndex = i));
        this.quiz.persons = reordered;
    }

    publish(): Quiz {
        if (!this.quiz) throw new Error('No quiz');
        if (this.quiz.persons.length === 0) throw new Error('No persons added');

        // Create rounds from persons (in order)
        this.quiz.rounds = this.quiz.persons.map(p => ({
            personId: p.id,
            status: 'pending' as const,
            votingEndsAt: null,
            votes: [],
        }));

        this.quiz.status = 'live';
        this.quiz.currentRoundIndex = 0;
        return this.quiz;
    }

    addPlayer(displayName: string): Player {
        if (!this.quiz) throw new Error('No quiz');

        // Check for duplicate name
        const existing = this.quiz.players.find(
            p => p.displayName.toLowerCase() === displayName.toLowerCase()
        );
        if (existing) return existing;

        const player: Player = {
            id: uuidv4(),
            displayName,
            score: 0,
        };
        this.quiz.players.push(player);
        return player;
    }

    startRound(votingDurationSeconds: number = 10): Round {
        if (!this.quiz) throw new Error('No quiz');
        const round = this.quiz.rounds[this.quiz.currentRoundIndex];
        if (!round) throw new Error('No more rounds');

        round.status = 'voting';
        round.votingEndsAt = Date.now() + votingDurationSeconds * 1000;
        round.votes = [];
        return round;
    }

    vote(playerId: string, guessedPersonId: string): Vote | null {
        if (!this.quiz) return null;
        const round = this.quiz.rounds[this.quiz.currentRoundIndex];
        if (!round || round.status !== 'voting') return null;

        // Check if voting time has expired
        if (round.votingEndsAt && Date.now() > round.votingEndsAt) return null;

        // Check if player already voted this round
        if (round.votes.find(v => v.playerId === playerId)) return null;

        const vote: Vote = {
            playerId,
            guessedPersonId,
            timestamp: Date.now(),
        };
        round.votes.push(vote);
        return vote;
    }

    reveal(): Round | null {
        if (!this.quiz) return null;
        const round = this.quiz.rounds[this.quiz.currentRoundIndex];
        if (!round) return null;

        round.status = 'revealed';

        // Calculate scores for this round
        const correctPersonId = round.personId;
        round.votes.forEach(vote => {
            if (vote.guessedPersonId === correctPersonId) {
                const player = this.quiz!.players.find(p => p.id === vote.playerId);
                if (player) player.score += 1;
            }
        });

        return round;
    }

    nextRound(): number {
        if (!this.quiz) return -1;
        this.quiz.currentRoundIndex += 1;
        return this.quiz.currentRoundIndex;
    }

    finish(): void {
        if (!this.quiz) return;
        this.quiz.status = 'finished';
    }

    reset(): void {
        if (!this.quiz) return;
        this.quiz.currentRoundIndex = 0;
        this.quiz.status = 'live';
        this.quiz.players.forEach(p => (p.score = 0));
        this.quiz.rounds.forEach(r => {
            r.status = 'pending';
            r.votes = [];
            r.votingEndsAt = null;
        });
    }

    deleteQuiz(): void {
        this.quiz = null;
    }
}

// Singleton using globalThis for Next.js hot-reload persistence
const globalStore = globalThis as unknown as { __quizStore: QuizStore };
if (!globalStore.__quizStore) {
    globalStore.__quizStore = new QuizStore();
}

export const store = globalStore.__quizStore;
