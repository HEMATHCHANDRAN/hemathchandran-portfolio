const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');

// Load socket.io
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Configure CORS for production
const io = new Server(server, {
    cors: {
        origin: [
            'https://your-frontend.vercel.app', // Replace with your Vercel URL
            'http://localhost:3000'
        ],
        methods: ['GET', 'POST'],
        credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling']
});

// Middleware
app.use(cors({
    origin: [
        'https://your-frontend.vercel.app', // Replace with your Vercel URL
        'http://localhost:3000'
    ],
    credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../dist')));

// Store players in memory (for free tier)
const players = new Map();
const maxPlayers = 20;
const serverStartTime = Date.now();

// Player colors pool
const colorPool = [
    0x00ffff, 0xff00ff, 0xffff00, 0xff6600, 0x00ff99, 0x9966ff
];

// Helper functions
function getRandomColor() {
    return colorPool[Math.floor(Math.random() * colorPool.length)];
}

function getPlayerName() {
    const names = ['Explorer', 'Driver', 'Visitor', 'Guest', 'Traveler', 'Pioneer', 'Voyager', 'Rider'];
    return names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 1000);
}

// Health check endpoint (for Render)
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy', 
        players: players.size,
        uptime: Math.floor((Date.now() - serverStartTime) / 1000)
    });
});

// API endpoints
app.get('/api/stats', (req, res) => {
    res.json({ 
        status: 'online', 
        players: players.size, 
        maxPlayers: maxPlayers,
        uptime: Math.floor((Date.now() - serverStartTime) / 1000),
        multiplayer: true
    });
});

app.get('/api/leaderboard', (req, res) => {
    const leaderboard = Array.from(players.entries())
        .map(([id, data]) => ({
            id: id.substring(0, 4),
            name: data.name || 'Anonymous',
            distance: Math.round(data.distance || 0),
            joinTime: data.joinTime
        }))
        .sort((a, b) => b.distance - a.distance)
        .slice(0, 10);
    
    res.json(leaderboard);
});

// Socket.io event handlers
io.on('connection', (socket) => {
    console.log(`🔌 Player connected: ${socket.id} (Total: ${players.size + 1})`);
    
    // Check if server is full
    if (players.size >= maxPlayers) {
        socket.emit('serverFull', { message: 'Server is full. Try again later.' });
        socket.disconnect(true);
        return;
    }
    
    // Create player data
    const playerData = {
        id: socket.id,
        name: getPlayerName(),
        color: getRandomColor(),
        position: { x: 0, y: 0.5, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        distance: 0,
        joinTime: Date.now(),
        lastUpdate: Date.now(),
        actions: {}
    };
    
    players.set(socket.id, playerData);
    
    // Send current players to new player
    const currentPlayers = Array.from(players.entries())
        .filter(([id]) => id !== socket.id)
        .map(([id, data]) => ({
            id,
            name: data.name,
            color: data.color,
            position: data.position,
            rotation: data.rotation
        }));
    
    socket.emit('currentPlayers', currentPlayers);
    
    // Notify others about new player
    socket.broadcast.emit('newPlayer', {
        id: socket.id,
        name: playerData.name,
        color: playerData.color,
        position: playerData.position
    });
    
    // Handle player movement
    socket.on('playerMovement', (data) => {
        const player = players.get(socket.id);
        if (!player) return;
        
        // Calculate distance traveled
        if (player.position) {
            const dx = data.position.x - player.position.x;
            const dz = data.position.z - player.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            // Only count significant movements (avoid noise)
            if (distance > 0.1) {
                player.distance = (player.distance || 0) + distance;
            }
        }
        
        // Update player data
        player.position = data.position;
        player.rotation = data.rotation;
        player.lastUpdate = Date.now();
        
        // Broadcast to others (optimize by not sending to self)
        socket.broadcast.emit('playerMoved', {
            id: socket.id,
            position: data.position,
            rotation: data.rotation,
            speed: data.speed || 0
        });
    });
    
    // Handle chat messages
    socket.on('chatMessage', (message) => {
        const player = players.get(socket.id);
        if (!player) return;
        
        // Validate and sanitize message
        if (typeof message !== 'string' || message.length > 200) return;
        
        const sanitizedMessage = message
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .substring(0, 200);
        
        io.emit('chatMessage', {
            id: socket.id,
            name: player.name,
            message: sanitizedMessage,
            timestamp: Date.now()
        });
    });
    
    // Handle player actions
    socket.on('playerAction', (action) => {
        const player = players.get(socket.id);
        if (!player) return;
        
        player.actions[action.type] = {
            timestamp: Date.now(),
            data: action.data
        };
        
        socket.broadcast.emit('playerAction', {
            id: socket.id,
            action: action.type,
            data: action.data
        });
    });
    
    // Handle name change
    socket.on('changeName', (name) => {
        const player = players.get(socket.id);
        if (!player) return;
        
        if (name && name.length > 0 && name.length < 20) {
            const oldName = player.name;
            player.name = name;
            
            io.emit('playerRenamed', {
                id: socket.id,
                oldName,
                newName: name
            });
        }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
        const player = players.get(socket.id);
        if (player) {
            console.log(`❌ Player disconnected: ${socket.id} (${player.name}) - Total: ${players.size - 1}`);
            
            // Calculate session duration
            const sessionDuration = Math.floor((Date.now() - player.joinTime) / 1000);
            console.log(`   Session: ${sessionDuration}s, Distance: ${Math.round(player.distance || 0)}m`);
        }
        
        players.delete(socket.id);
        io.emit('playerDisconnected', socket.id);
    });
});

// Clean up inactive players (no update for 30 seconds)
setInterval(() => {
    const now = Date.now();
    const timeout = 30000; // 30 seconds
    
    players.forEach((data, id) => {
        if (now - (data.lastUpdate || now) > timeout) {
            console.log(`🧹 Removing inactive player: ${id} (${data.name})`);
            players.delete(id);
            io.emit('playerDisconnected', id);
        }
    });
}, 10000);

// Broadcast server stats every minute
setInterval(() => {
    io.emit('serverStats', {
        players: players.size,
        maxPlayers: maxPlayers,
        uptime: Math.floor((Date.now() - serverStartTime) / 1000)
    });
}, 60000);

// Error handling
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection:', reason);
});

// Serve frontend for any other route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log('\n=== 🚀 Server Started ===');
    console.log(`🌐 Port: ${PORT}`);
    console.log(`📁 Static files: ${path.join(__dirname, '../../dist')}`);
    console.log(`👥 Max players: ${maxPlayers}`);
    console.log(`🎮 Mode: Multiplayer (WebSocket + Polling)`);
    console.log('==========================\n');
});