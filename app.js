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
            console.log(error);  // Use 'error' instead of 'err'
            uniquesocket.emit('error', `Invalid move: ${move}`);  // Correctly emit the error
        }
    })
    
});

server.listen(3000, ()=> {
    console.log("Server chalu aap start karo.");
    
})

