// Shared types for the quiz app

export interface Person {
  id: string;
  name: string;
  caricatureUrl: string;
  realPhotoUrl: string;
  orderIndex: number;
}

export interface Vote {
  playerId: string;
  guessedPersonId: string;
  timestamp: number;
}

export interface Round {
  personId: string;
  status: 'pending' | 'voting' | 'revealed';
  votingEndsAt: number | null;
  votes: Record<string, Vote> | null;
}

export interface Player {
  id: string;
  displayName: string;
  score: number;
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
