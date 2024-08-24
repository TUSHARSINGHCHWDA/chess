below is the code for my chess game but its not running find out the bug and explain
and given all three files and chess.js ejs express nodemon socket.io are five dependencies

app.js code below

const express = require('express');
const http = require('http')
const socket = require('socket.io')
const {Chess} = require('chess.js')
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};
let currentPlayer = 'W';

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index', {title : "Chess Wale"});
})

io.on('connection', (uniquesocket) => {
    console.log('connected');

    // uniquesocket.on('churan', ()=> {
    //     console.log('churan received');
    //     io.emit('churan paapdi');
    // })

    // uniquesocket.on('disconnect', ()=>{
    //     console.log('disconnected');  
    // })

    if(!players.white){
        players.white = uniquesocket.id;
        uniquesocket.emit('playerRole', 'w');
    }else if(!players.black){
        players.black = uniquesocket.id;
        uniquesocket.emit('playerRole', 'b')
    }else {
        uniquesocket.emit('spectatorRole')
    }

    uniquesocket.on('disconnect', ()=>{
        if(uniquesocket.id === players.white){
            delete players.white;
        }else if( uniquesocket.id === players.black){
            delete players.black;
        }
    })

    uniquesocket.on('move', (move) => {
        try {
            if (chess.turn() === 'w' && uniquesocket.id !== players.white) return;
            if(chess.turn() === 'b' && uniquesocket.id !== players.black) return;

            const result = chess.move(move);
            if(result){
                currentPlayer = chess.move(move);
                io.emit('move', move);
                io.emit('boardState', chess.fen());
            }else {
                console.log('Invalid move : ', move);
                uniquesocket.emit('invalidMove', move);
            }
        } catch (error) {
            console.log(err);
            uniquesocket.emit('Invalid move : ', move) 
        }
    })
    
});

server.listen(3000, ()=> {
    console.log("Server chalu aap start karo.");
    
})

index.ejs code below

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title><%= title %></title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      .chessboard {
        display: grid;
        grid-template-columns: repeat(8, minmax(0, 1fr));
        grid-template-rows: repeat(8, minmax(0, 1fr));
        width: 400px;
        height: 400px;
        transform: rotate(0deg);
      }

      .piece.white {
        color: white;
        filter : drop-shadow(0 0 2px rgba(0, 0, 0, 1));
      }

      .piece.black {
        color: black;
      }

      .flipped {
        transform: rotate(180deg);
      }

      .square {
        display : flex;
        align-items : center;
        justify-content: center;
      }

      .square.light{
        background-color: #f0d9b5;
      }

      .square.dark {
        background-color: #b58863;
      }

      .piece {
        font-size : 36px;
        cursor: p
      }

      .piece.draggable {
        cursor: grab;
      }

      .dragging {
        opacity: 0.5;
      }

      /* Rotate pieces for black player */
      .flipped .piece {
        transform: rotate(180deg);
      }
    </style>

  </head>
  <body>
    <h1>Chaliye firse shuru karte hai</h1>
    <div class="w-full h-screen flex items-center justify-center bg-zinc-900">
      <div class="chessboard w-96 h-96 bg-red-800">

      </div>
    </div>

    <script
      src="https://cdn.socket.io/4.7.5/socket.io.min.js"
      integrity="sha384-2huaZvOR9iDzHqslqwpR87isEmrfxqyWOF7hr7BY6KG0+hVKLoEXMPUJw3ynWuhO"
      crossorigin="anonymous"
    ></script>
    <script
      src="https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js"
      integrity="sha512-xRllwz2gdZciIB+AkEbeq+gVhX8VB8XsfqeFbUh+SzHlN96dEduwtTuVuc2u9EROlmW9+yhRlxjif66ORpsgVA=="
      crossorigin="anonymous"
      referrerpolicy="no-referrer"
    ></script>
    <script src="../scripts/chessgame.js"></script>
  </body>
</html>


chessgame.js code below

const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
  const board = chess.board();
  boardElement.innerHTML = "";
  board.forEach((row, rowIndex) => {
    row.forEach((square, squareIndex) => {
      const squareElement = document.createElement("dive");
      squareElement.classList.add(
        "square",
        (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark"
      );

      squareElement.dataset.row = rowIndex;
      squareElement.dataset.col = squareIndex;

      if (square) {
        const pieceElement = document.createElement("div");
        pieceElement.classList.add(
          "piece",
          square.color === "w" ? "white" : "black"
        );

        pieceElement.innerText = getPieceUnicode(square);
        pieceElement.draggable = playerRole === square.color;

        pieceElement.addEventListner("dragstart", (e) => {
          if (pieceElement.draggable) {
            draggedPiece = pieceElement;
            sourceSquare = { row: rowIndex, col: squareIndex };
            e.dataTransfer.setData("text/plain", "");
          }
        });

        pieceElement.addEventListner("dragend", (e) => {
          draggedPiece = null;
          sourceSquare = null;
        });

        squareElement.appendChild(pieceElement);
      }

      squareElement.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      squareElement.addEventListner("drop", (e) => {
        e.preventDefault();
        if (draggedPiece) {
          const targetSource = {
            row: parseInt(squareElement.dataset.row),
            col: parseInt(squareElement.dataset.col),
          };

          handleMove(sourceSquare, targetSource);
        }
      });
      boardElement.appendChild(squareElement);
    }); // row
  }); // board

  if(playerRole === 'b'){
    boardElement.classList.add('flipped');
  } else {
    boardElement.classList.remove('flipped');
  }
}; // end

const handleMove = () => {
    const move = {
        from: `${String.fromCharCode(97+source.col)}${8- source.row}`,
        to:`${String.fromCharCode(97+target.col)}${8- target.row}`,
        promotion: 'q'
    };

    socket.emit('move', move);
};

const getPieceUnicode = () => {
  const unicodePieces = {
    p: "♟",
    r: "♜",
    n: "♞",
    b: "♝",
    q: "♛",
    k: "♚",
    P: "♙",
    R: "♖",
    N: "♘",
    B: "♗",
    Q: "♕",
    K: "♔",
  };

  return unicodePieces;
//   return unicodePieces[ p.type ] || '';

  // const unicodePieces = {
  //     const chessUnicodeSymbols = {
  //         pieces: {
  //           white: {
  //             king: { symbol: '♔', unicode: 'U+2654' },
  //             queen: { symbol: '♕', unicode: 'U+2655' },
  //             rook: { symbol: '♖', unicode: 'U+2656' },
  //             bishop: { symbol: '♗', unicode: 'U+2657' },
  //             knight: { symbol: '♘', unicode: 'U+2658' },
  //             pawn: { symbol: '♙', unicode: 'U+2659' }
  //           },
  //           black: {
  //             king: { symbol: '♚', unicode: 'U+265A' },
  //             queen: { symbol: '♛', unicode: 'U+265B' },
  //             rook: { symbol: '♜', unicode: 'U+265C' },
  //             bishop: { symbol: '♝', unicode: 'U+265D' },
  //             knight: { symbol: '♞', unicode: 'U+265E' },
  //             pawn: { symbol: '♟', unicode: 'U+265F' }
  //           }
  //         },
  //         additionalSymbols: {
  //           chessboard: {
  //             emptySquare: { symbol: '⬜', unicode: 'U+2B1C' },
  //             filledSquare: { symbol: '⬛', unicode: 'U+2B1B' }
  //           }
  //         }
  //       };

  //       console.log(chessUnicodeSymbols);
  // }
};

socket.on('playerRole', (role) => {
    playerRole = role;
    renderBoard();
})

socket.on('spectatorRole', ()=> {
    playerRole = null;
    renderBoard();
})

socket.on('boardState', (fen) => {
    chess.load(fen);
    renderBoard();
})

socket.on('move', (move) => {
    chess.move(move);
    renderBoard();
})

renderBoard();

// socket.emit('churan');

// socket.on('churan paapdi', ()=> {
//     console.log('churan pappdi received');
// })
