import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketServer } from 'socket.io';
import { networkInterfaces } from 'os';
import { store } from './src/lib/store';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const port = parseInt(process.env.PORT || '3000', 10);

function getLocalIP(): string {
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name] || []) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
}

app.prepare().then(() => {
    const server = createServer((req, res) => {
        const parsedUrl = parse(req.url!, true);
        handle(req, res, parsedUrl);
    });

    const io = new SocketServer(server, {
        cors: { origin: '*' },
    });

    const localIP = getLocalIP();

    // Store globals for access from API routes
    (globalThis as any).__socketIO = io;
    (globalThis as any).__localIP = localIP;
    (globalThis as any).__port = port;

    io.on('connection', (socket) => {
        console.log(`[Socket] Client connected: ${socket.id}`);

        // Send current state on connect
        socket.emit('quiz:state', store.getQuiz());
        socket.emit('server:info', { localIP, port });

        // ── Admin events ──────────────────────────────────────────────
        socket.on('admin:create', (data: { title: string }) => {
            try {
                store.createQuiz(data.title);
                io.emit('quiz:state', store.getQuiz());
            } catch (e: any) {
                socket.emit('error', { message: e.message });
            }
        });

        socket.on('admin:addPerson', (data: { name: string; caricatureUrl: string; realPhotoUrl: string }) => {
            try {
                store.addPerson(data.name, data.caricatureUrl, data.realPhotoUrl);
                io.emit('quiz:state', store.getQuiz());
            } catch (e: any) {
                socket.emit('error', { message: e.message });
            }
        });

        socket.on('admin:removePerson', (data: { personId: string }) => {
            try {
                store.removePerson(data.personId);
                io.emit('quiz:state', store.getQuiz());
            } catch (e: any) {
                socket.emit('error', { message: e.message });
            }
        });

        socket.on('admin:publish', () => {
            try {
                store.publish();
                io.emit('quiz:state', store.getQuiz());
            } catch (e: any) {
                socket.emit('error', { message: e.message });
            }
        });

        socket.on('admin:delete', () => {
            try {
                store.deleteQuiz();
                io.emit('quiz:state', store.getQuiz());
            } catch (e: any) {
                socket.emit('error', { message: e.message });
            }
        });

        // ── Player events ─────────────────────────────────────────────
        socket.on('player:join', (data: { displayName: string; quizId: string }, callback: (player: any) => void) => {
            try {
                const player = store.addPlayer(data.displayName);
                if (callback) callback(player);
                io.emit('quiz:state', store.getQuiz());
            } catch (e: any) {
                socket.emit('error', { message: e.message });
            }
        });

        socket.on('player:vote', (data: { playerId: string; guessedPersonId: string }) => {
            try {
                store.vote(data.playerId, data.guessedPersonId);
                io.emit('quiz:state', store.getQuiz());
            } catch (e: any) {
                socket.emit('error', { message: e.message });
            }
        });

        // ── Host events ───────────────────────────────────────────────
        socket.on('round:start', () => {
            try {
                const round = store.startRound(10);
                io.emit('quiz:state', store.getQuiz());

                // Auto-broadcast state when voting ends (so clients update)
                if (round.votingEndsAt) {
                    const delay = round.votingEndsAt - Date.now();
                    setTimeout(() => {
                        io.emit('quiz:state', store.getQuiz());
                    }, delay + 200); // Small buffer to ensure time has passed
                }
            } catch (e: any) {
                socket.emit('error', { message: e.message });
            }
        });

        socket.on('round:reveal', () => {
            try {
                store.reveal();
                io.emit('quiz:state', store.getQuiz());
            } catch (e: any) {
                socket.emit('error', { message: e.message });
            }
        });

        socket.on('round:next', () => {
            try {
                store.nextRound();
                io.emit('quiz:state', store.getQuiz());
            } catch (e: any) {
                socket.emit('error', { message: e.message });
            }
        });

        socket.on('quiz:finish', () => {
            try {
                store.finish();
                io.emit('quiz:state', store.getQuiz());
            } catch (e: any) {
                socket.emit('error', { message: e.message });
            }
        });

        socket.on('quiz:reset', () => {
            try {
                store.reset();
                io.emit('quiz:state', store.getQuiz());
            } catch (e: any) {
                socket.emit('error', { message: e.message });
            }
        });

        socket.on('disconnect', () => {
            console.log(`[Socket] Client disconnected: ${socket.id}`);
        });
    });

    server.listen(port, () => {
        console.log('');
        console.log('  🎉 Women\'s Day Quiz App is running!');
        console.log('');
        console.log(`  ✨ Local:    http://localhost:${port}`);
        console.log(`  🌐 Network:  http://${localIP}:${port}`);
        console.log('');
        console.log(`  👑 Admin:    http://localhost:${port}/admin`);
        console.log(`  🖥️  Host:     http://localhost:${port}/host`);
        console.log('');
    });
});
