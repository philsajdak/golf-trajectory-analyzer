const net = require('net');
const admin = require('firebase-admin');
const serviceAccount = require('./key.json');

// Initialize Firebase
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: '127.0.0.1' // Your firebase here
});

const server = net.createServer((socket) => {
    socket.on('connect', () => {
        console.log('client connected');
    });

    socket.on('data', (data) => {
        try {
            const parsedData = JSON.parse(data.toString());
            const db = admin.database();
            const ref = db.ref('gameData');
            ref.push(parsedData);
            console.log('Data saved to Firebase:', parsedData);
        } catch (error) {
            console.error('Error parsing data:', error);
        }
    });

    socket.on('end', () => {
        console.log('client disconnected');
    });

    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });

});

server.listen(3000, '127.0.0.1'); // Your server's IP here
