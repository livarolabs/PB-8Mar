// Shared types for the quiz app

export interface Person {
  id: string;
  name: string;
  caricatureUrl1: string;
  caricatureUrl2: string;
  words: Record<Language, string[]>;
  orderIndex: number;
}

export interface Vote {
  playerId: string;
  guessedPersonId: string;
  timestamp: number;
  points: number;
}

export interface Round {
  personId: string;
  status: 'pending' | 'voting_words' | 'voting_1' | 'voting_2' | 'revealed';
  votingEndsAt: number | null;
  revealingEndsAt?: number | null; // Keep for backward compatibility if needed, but we'll use votingEndsAt for all phases
  votes: Record<string, Vote> | null;
}

import { Language } from './translations';

export interface Player {
  id: string;
  displayName: string;
  score: number;
  joinedAt: number;
  language?: Language;
  isReady?: boolean;
  isTutorialFinished?: boolean;
}

export interface Quiz {
  id: string;
  title: string;
  status: 'draft' | 'live' | 'finished';
  currentRoundIndex: number;
  ownerId: string;
  settings: {
    votingDuration: number; // in seconds
    votingMode: 'countdown' | 'all_voted';
  };
  persons: Person[];
  rounds: Round[];
  players: Player[];
}
