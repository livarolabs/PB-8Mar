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
  votes: Vote[];
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
  persons: Person[];
  rounds: Round[];
  players: Player[];
}

// Socket event payloads
export interface ServerToClientEvents {
  'quiz:state': (quiz: Quiz | null) => void;
  'server:info': (info: { localIP: string; port: number }) => void;
}

export interface ClientToServerEvents {
  'admin:create': (data: { title: string }) => void;
  'admin:addPerson': (data: { name: string; caricatureUrl: string; realPhotoUrl: string }) => void;
  'admin:removePerson': (data: { personId: string }) => void;
  'admin:publish': () => void;
  'player:join': (data: { displayName: string; quizId: string }, callback: (player: Player) => void) => void;
  'player:vote': (data: { playerId: string; guessedPersonId: string }) => void;
  'round:start': () => void;
  'round:reveal': () => void;
  'round:next': () => void;
  'quiz:finish': () => void;
  'quiz:reset': () => void;
}
