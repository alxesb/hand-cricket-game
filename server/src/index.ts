import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { createGame, joinGame, makeMove, handleDisconnect } from './game';

const app = express();
app.use(cors());

const server = http.createServer(app);

const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';

const io = new Server(server, {
  cors: {
    origin: clientURL,
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on('createGame', (playerName: string) => {
    createGame(io, socket, playerName);
  });

  socket.on('joinGame', (data: { gameCode: string, playerName: string }) => {
    joinGame(io, socket, data);
  });

  socket.on('makeMove', ({ gameCode, move }: { gameCode: string, move: number }) => {
    makeMove(io, socket, gameCode, move);
  });

  socket.on('disconnect', () => {
    console.log('User Disconnected', socket.id);
    handleDisconnect(io, socket);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
