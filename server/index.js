const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:4200', // Add the origin of your Angular app
    methods: ['GET', 'POST'],
  },
});

// Connect to MongoDB Atlas
const mongoURI = 'dummyUrl';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

// Define MongoDB Schema and Model for Game
const gameSchema = new mongoose.Schema({
  board: {
    type: [[String]],
    default: [['', '', ''], ['', '', ''], ['', '', '']],
  },
  currentPlayer: {
    type: String,
    default: 'X',
  },
});

const Game = mongoose.model('Game', gameSchema);

// Socket.io handling
io.on('connection', (socket) => {
  // Handle game events
  socket.on('joinGame', async () => {
    // Retrieve or create a new game
    const game = await Game.findOne({}).exec();
    if (!game) {
      const newGame = new Game();
      await newGame.save();
      io.emit('updateBoard', { board: newGame.board, currentPlayer: 'X' });
    } else {
      // Assign 'O' to the second player
      const currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';
      io.emit('updateBoard', { board: game.board, currentPlayer });
    }
  });

  socket.on('makeMove', async (data) => {
    const { row, col } = data;
    // Update the game board and currentPlayer in MongoDB
    const newPlayer = data.player === 'X' ? 'O' : 'X';
    const game = await Game.findOneAndUpdate(
      {},
      { $set: { [`board.${row}.${col}`]: data.player, currentPlayer: newPlayer } },
      { new: true }
    ).exec();
    io.emit('updateBoard', { board: game.board, currentPlayer: game.currentPlayer });
  });

  socket.on('resetGame', async () => {
    // Reset the game board and currentPlayer in MongoDB
    const game = await Game.findOneAndUpdate(
      {},
      { $set: { board: [['', '', ''], ['', '', ''], ['', '', '']], currentPlayer: 'X' } },
      { new: true }
    ).exec();
    io.emit('updateBoard', { board: game.board, currentPlayer: game.currentPlayer });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
