const dotenv = require('dotenv').config();
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const {AUTH_TOKEN} = process.env;

let clients = [];

io.use((socket, next) => {
    if(AUTH_TOKEN === socket.handshake.auth.token) {
        next();
    } else {
        next(new Error('Unauthorized: Wrong credentials'))
    }
})

io.on('connection', (socket) => {
    clients.push(socket);
    console.info('A client connected: ', socket.handshake.query.client_id);
    console.info('Total of clients:', clients.length)
    socket.on('disconnect', () => {
        const newClients = clients.filter((client) => {
            if(client.id !== socket.id) {
                return client;
            }
        })
        clients = newClients;
        console.info('A client disconnected: ', socket.handshake.query.client_id)
        console.info('Total of clients:', clients.length)
    })
})

app.get('/clients', (req, res) => {
    const response = clients.map((client) => {
        return {
            socket_id: client.id,
            client_id: client.handshake.query.client_id
        }
    })
    res.json(response);
})

app.get('/:client_id', (req, res) => {
    const clientId = req.params.client_id;
    const clientSocket = clients.filter((client) => {
        if(clientId === client.handshake.query.client_id) {
            return client;
        }
    })[0]
    if(clientSocket){

        clientSocket.emit('execute', 'something', (response) => {
            res.json(response)
        })

    } else {
        res.json({"message": "client_id not found"})
    }
});

server.listen(3000, () => {
    console.info("Listening on http://localhost:3000");
})
