const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// ============================================
// CONFIGURATION
// ============================================
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3001;
const MAX_PLAYERS = 20;
const serverStartTime = Date.now();

// Get the correct paths
const distPath = path.join(__dirname, '../../dist');
const publicPath = path.join(__dirname, '../../public');

console.log('\n=== Server Configuration ===');
console.log(`🔧 Environment: ${isProduction ? 'production' : 'development'}`);
console.log(`📁 Dist path: ${distPath}`);
console.log(`📁 Public path: ${publicPath}`);
console.log(`🌐 Port: ${PORT}`);
console.log('============================\n');

// ============================================
// CORS CONFIGURATION
// ============================================
const allowedOrigins = [
    'https://hemathchandran-portfolio.vercel.app',  // Your Vercel frontend
    'https://hemathchandran-portfolio.onrender.com', // Your Render backend
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
];

// Socket.io with CORS
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
        allowedHeaders: ['Content-Type']
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 10000,
    allowEIO3: true,
    maxHttpBufferSize: 1e6
});

// Express middleware
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// STATIC FILES SERVING
// ============================================
// Serve static files from dist (built frontend)
app.use(express.static(distPath));

// Serve public files (models, sounds, textures) if needed
app.use('/public', express.static(publicPath));

// ============================================
// DATA STORAGE (in-memory for free tier)
// ============================================
const players = new Map();           // Active players
const chatHistory = [];              // Recent chat messages (last 50)
const playerSessions = new Map();    // Session history

// Player colors pool
const colorPool = [
    0x00ffff, 0xff00ff, 0xffff00, 0xff6600, 0x00ff99, 0x9966ff,
    0xff3366, 0x33ff33, 0x3366ff, 0xff9933, 0xcc33ff, 0x33ffcc
];

// ============================================
// HELPER FUNCTIONS
// ============================================
function getRandomColor() {
    return colorPool[Math.floor(Math.random() * colorPool.length)];
}

function getPlayerName() {
    const names = ['Explorer', 'Driver', 'Visitor', 'Guest', 'Traveler', 
                   'Pioneer', 'Voyager', 'Rider', 'Wanderer', 'Racer'];
    return names[Math.floor(Math.random() * names.length)] + 
           Math.floor(Math.random() * 1000);
}

function getServerStats() {
    return {
        status: 'online',
        players: players.size,
        maxPlayers: MAX_PLAYERS,
        uptime: Math.floor((Date.now() - serverStartTime) / 1000),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
    };
}

// ============================================
// API ROUTES
// ============================================

// Health check (for Render and monitoring)
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: Date.now(),
        uptime: Math.floor((Date.now() - serverStartTime) / 1000),
        players: players.size
    });
});

// Server stats
app.get('/api/stats', (req, res) => {
    res.json(getServerStats());
});

// Leaderboard
app.get('/api/leaderboard', (req, res) => {
    try {
        const leaderboard = Array.from(players.entries())
            .map(([id, data]) => ({
                id: id.substring(0, 4),
                name: data.name || 'Anonymous',
                distance: Math.round(data.distance || 0),
                color: data.color,
                joinTime: data.joinTime
            }))
            .sort((a, b) => b.distance - a.distance)
            .slice(0, 10);
        
        res.json({
            success: true,
            leaderboard,
            totalPlayers: players.size
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Chat history
app.get('/api/chat', (req, res) => {
    res.json({
        success: true,
        messages: chatHistory.slice(-50)
    });
});

// Active players list
app.get('/api/players', (req, res) => {
    const playersList = Array.from(players.entries()).map(([id, data]) => ({
        id: id.substring(0, 4),
        name: data.name,
        color: data.color,
        distance: Math.round(data.distance || 0),
        joinTime: data.joinTime
    }));
    
    res.json({
        success: true,
        players: playersList,
        count: players.size
    });
});

// ============================================
// SOCKET.IO EVENT HANDLERS
// ============================================

io.on('connection', (socket) => {
    console.log(`🔌 Player connected: ${socket.id} (Total: ${players.size + 1})`);
    
    // Check if server is full
    if (players.size >= MAX_PLAYERS) {
        console.log(`❌ Server full, rejecting ${socket.id}`);
        socket.emit('serverFull', { 
            message: 'Server is full. Please try again later.' 
        });
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
        actions: {},
        ip: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent']
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
    
    // Send recent chat history
    socket.emit('chatHistory', chatHistory.slice(-20));
    
    // Notify others about new player
    socket.broadcast.emit('newPlayer', {
        id: socket.id,
        name: playerData.name,
        color: playerData.color,
        position: playerData.position
    });
    
    // Broadcast updated player count
    io.emit('playerCount', players.size);
    
    // ========================================
    // Player movement
    // ========================================
    socket.on('playerMovement', (data) => {
        const player = players.get(socket.id);
        if (!player) return;
        
        try {
            // Validate data
            if (!data.position || !data.rotation) return;
            
            // Calculate distance traveled
            if (player.position) {
                const dx = data.position.x - player.position.x;
                const dz = data.position.z - player.position.z;
                const distance = Math.sqrt(dx * dx + dz * dz);
                
                // Only count significant movements (avoid noise)
                if (distance > 0.1 && distance < 10) {
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
        } catch (error) {
            console.error('Error in playerMovement:', error);
        }
    });
    
    // ========================================
    // Chat messages
    // ========================================
    socket.on('chatMessage', (message) => {
        const player = players.get(socket.id);
        if (!player) return;
        
        try {
            // Validate and sanitize message
            if (typeof message !== 'string' || message.length > 200) return;
            
            const sanitizedMessage = message
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .substring(0, 200);
            
            const chatMessage = {
                id: socket.id,
                name: player.name,
                message: sanitizedMessage,
                timestamp: Date.now(),
                color: player.color
            };
            
            // Store in history
            chatHistory.push(chatMessage);
            if (chatHistory.length > 100) chatHistory.shift();
            
            // Broadcast to all
            io.emit('chatMessage', chatMessage);
        } catch (error) {
            console.error('Error in chatMessage:', error);
        }
    });
    
    // ========================================
    // Player actions (honk, lights, etc.)
    // ========================================
    socket.on('playerAction', (action) => {
        const player = players.get(socket.id);
        if (!player) return;
        
        try {
            if (!action || !action.type) return;
            
            player.actions[action.type] = {
                timestamp: Date.now(),
                data: action.data
            };
            
            socket.broadcast.emit('playerAction', {
                id: socket.id,
                action: action.type,
                data: action.data
            });
        } catch (error) {
            console.error('Error in playerAction:', error);
        }
    });
    
    // ========================================
    // Name change
    // ========================================
    socket.on('changeName', (name) => {
        const player = players.get(socket.id);
        if (!player) return;
        
        try {
            if (name && typeof name === 'string' && 
                name.length > 0 && name.length < 20) {
                
                // Sanitize name
                const sanitizedName = name
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .substring(0, 20);
                
                const oldName = player.name;
                player.name = sanitizedName;
                
                io.emit('playerRenamed', {
                    id: socket.id,
                    oldName,
                    newName: sanitizedName
                });
            }
        } catch (error) {
            console.error('Error in changeName:', error);
        }
    });
    
    // ========================================
    // Disconnection
    // ========================================
    socket.on('disconnect', () => {
        const player = players.get(socket.id);
        
        if (player) {
            // Calculate session stats
            const sessionDuration = Math.floor((Date.now() - player.joinTime) / 1000);
            const distanceTraveled = Math.round(player.distance || 0);
            
            console.log(`❌ Player disconnected: ${socket.id} (${player.name})`);
            console.log(`   Session: ${sessionDuration}s, Distance: ${distanceTraveled}m`);
            
            // Store session
            playerSessions.set(socket.id, {
                name: player.name,
                duration: sessionDuration,
                distance: distanceTraveled,
                endTime: Date.now()
            });
            
            // Clean up old sessions (keep last 100)
            if (playerSessions.size > 100) {
                const oldestKey = Array.from(playerSessions.keys())[0];
                playerSessions.delete(oldestKey);
            }
        }
        
        players.delete(socket.id);
        io.emit('playerDisconnected', socket.id);
        io.emit('playerCount', players.size);
    });
    
    // ========================================
    // Error handling
    // ========================================
    socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
    });
});

// ============================================
// CLEANUP TASKS
// ============================================

// Clean up inactive players (no update for 30 seconds)
setInterval(() => {
    const now = Date.now();
    const timeout = 30000; // 30 seconds
    let removed = 0;
    
    players.forEach((data, id) => {
        if (now - (data.lastUpdate || now) > timeout) {
            console.log(`🧹 Removing inactive player: ${id} (${data.name})`);
            players.delete(id);
            io.emit('playerDisconnected', id);
            removed++;
        }
    });
    
    if (removed > 0) {
        io.emit('playerCount', players.size);
    }
}, 10000);

// Broadcast server stats every minute
setInterval(() => {
    io.emit('serverStats', {
        players: players.size,
        maxPlayers: MAX_PLAYERS,
        uptime: Math.floor((Date.now() - serverStartTime) / 1000),
        timestamp: Date.now()
    });
}, 60000);

// ============================================
// ERROR HANDLING
// ============================================
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    console.error(error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise);
    console.error('   reason:', reason);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('📴 SIGTERM received, shutting down gracefully...');
    
    // Notify all players
    io.emit('serverShutdown', { 
        message: 'Server is restarting. Please reconnect in a moment.' 
    });
    
    // Close all connections
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

// ============================================
// CATCH-ALL ROUTE - SERVE FRONTEND
// ============================================
app.get('*', (req, res) => {
    const indexPath = path.join(distPath, 'index.html');
    
    // Check if file exists
    try {
        res.sendFile(indexPath);
    } catch (error) {
        console.error('Error serving index.html:', error);
        res.status(500).send(`
            <html>
                <head><title>Error</title></head>
                <body>
                    <h1>Server Error</h1>
                    <p>Could not load frontend. Please check server logs.</p>
                    <p>Path: ${indexPath}</p>
                </body>
            </html>
        `);
    }
});

// ============================================
// START SERVER
// ============================================
server.listen(PORT, '0.0.0.0', () => {
    console.log('\n' + '='.repeat(50));
    console.log('🚀 SERVER STARTED SUCCESSFULLY');
    console.log('='.repeat(50));
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`📁 Static files: ${distPath}`);
    console.log(`👥 Max players: ${MAX_PLAYERS}`);
    console.log(`🎮 Mode: Multiplayer (WebSocket + Polling)`);
    console.log(`⏱️  Started: ${new Date().toLocaleString()}`);
    console.log('='.repeat(50) + '\n');
});