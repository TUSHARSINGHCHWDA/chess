const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");
const turnIndicator = document.getElementById("turnIndicator");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

socket.on("connect", () => {
  console.log("Connected to server");
});

socket.on("turnUpdate", (isYourTurn) => {
  updateTurnIndicator(isYourTurn);
});

function updateTurnIndicator(isYourTurn) {
  const turnIndicator = document.getElementById("turnIndicator");
  turnIndicator.innerHTML = ""; // Clear previous content

  const button = document.createElement("button");
  button.className = "px-6 py-3 text-white font-semibold rounded-lg shadow-md";

  if (isYourTurn) {
    button.textContent = "Your Turn";
    button.classList.add("bg-green-500", "hover:bg-green-600");
  } else {
    button.textContent = "Others' Turn";
    button.classList.add("bg-blue-500", "hover:bg-blue-600");
  }

  button.onclick = () => {
    socket.emit("changeTurn"); // Notify server to change turn
  };

  turnIndicator.appendChild(button);
}

// Function to render the chessboard
const renderBoard = () => {
  const board = chess.board();
  boardElement.innerHTML = "";

  board.forEach((row, rowIndex) => {
    row.forEach((square, squareIndex) => {
      const squareElement = document.createElement("div");
      squareElement.classList.add(
        "square",
        (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark"
      );

      squareElement.dataset.row = rowIndex;
      squareElement.dataset.col = squareIndex;

      if (square) {
        const pieceElement = document.createElement("div");
        pieceElement.classList.add("piece");
        pieceElement.classList.add(square.color === "w" ? "white" : "black");

        pieceElement.innerText = getPieceUnicode(square);
        pieceElement.draggable = playerRole === square.color;

        pieceElement.addEventListener("dragstart", (e) => {
          if (pieceElement.draggable) {
            draggedPiece = pieceElement;
            sourceSquare = { row: rowIndex, col: squareIndex };
            e.dataTransfer.setData("text/plain", "");
          }
        });

        pieceElement.addEventListener("dragend", (e) => {
          draggedPiece = null;
          sourceSquare = null;
        });

        squareElement.appendChild(pieceElement);
      }

      squareElement.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      squareElement.addEventListener("drop", (e) => {
        e.preventDefault();
        if (draggedPiece) {
          const targetSquare = {
            row: parseInt(squareElement.dataset.row),
            col: parseInt(squareElement.dataset.col),
          };

          handleMove(sourceSquare, targetSquare);
        }
      });

      boardElement.appendChild(squareElement);
    });
  });

  if (playerRole === "b") {
    boardElement.classList.add("flipped");
  } else {
    boardElement.classList.remove("flipped");
  }
};

// Function to handle moves
const handleMove = (source, target) => {
  const move = {
    from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
    to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
    promotion: "q", // Always promote to a queen for simplicity
  };

  const result = chess.move(move);
  if (result) {
    socket.emit("move", move);
  } else {
    alert("Invalid move!"); // Alert the user of invalid move
    renderBoard();
  }
};

// Function to get the Unicode character for each chess piece
const getPieceUnicode = (piece) => {
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

  return unicodePieces[piece.type] || "";
};

// Handling different socket events
socket.on("playerRole", (role) => {
  playerRole = role;
  renderBoard();
});

socket.on("spectatorRole", () => {
  playerRole = null;
  renderBoard();
});

socket.on("boardState", (fen) => {
  chess.load(fen);
  renderBoard();
});

socket.on("move", (move) => {
  chess.move(move);
  renderBoard();
});

socket.on("currentTurn", (turn) => {
  const turnText = turn === "w" ? "White's turn" : "Black's turn";
  turnIndicator.innerText = turnText;
});

socket.on("invalidMove", (msg) => {
  alert(msg); // Show an alert for an invalid move
});

// Initial render
renderBoard();
