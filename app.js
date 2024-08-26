const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { Chess } = require('chess.js');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const chess = new Chess();
let players = {};
let isYourTurn = true; // Initial turn is true

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.render('index', { title: "Chess Wale" });
});

io.on('connection', (uniquesocket) => {
  console.log('Player connected:', uniquesocket.id);

  // Send the initial turn state to the connected client
  uniquesocket.emit('turnUpdate', isYourTurn);

  // Handle turn change
  uniquesocket.on('changeTurn', () => {
    isYourTurn = !isYourTurn;
    io.emit('turnUpdate', isYourTurn); // Broadcast the new turn to all connected clients
  });

  if (!players.white) {
    players.white = uniquesocket.id;
    uniquesocket.emit('playerRole', 'w');
  } else if (!players.black) {
    players.black = uniquesocket.id;
    uniquesocket.emit('playerRole', 'b');
  } else {
    uniquesocket.emit('spectatorRole');
  }

  uniquesocket.on('disconnect', () => {
    console.log('Player disconnected:', uniquesocket.id);
    if (uniquesocket.id === players.white) {
      delete players.white;
    } else if (uniquesocket.id === players.black) {
      delete players.black;
    }
  });

  uniquesocket.on('move', (move) => {
    try {
      if (chess.turn() === 'w' && uniquesocket.id !== players.white) return;
      if (chess.turn() === 'b' && uniquesocket.id !== players.black) return;

      const result = chess.move(move);
      if (result) {
        io.emit('move', move);
        io.emit('boardState', chess.fen());
        io.emit('currentTurn', chess.turn()); // Notify the front end whose turn it is
      } else {
        uniquesocket.emit('invalidMove', 'Invalid move: ' + move.san);
      }
    } catch (error) {
      console.log('Error:', error.message);
      uniquesocket.emit('error', `An error occurred: ${error.message}`);
    }
  });
});

server.listen(3000, () => {
  console.log("Server started on port 3000.");
});
