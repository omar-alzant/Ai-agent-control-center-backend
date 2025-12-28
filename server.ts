import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { initSocket } from './socket.ts';


// Route Imports
import agentRoutes from './routes/agentRoutes.ts';
import chatRoutes from './routes/chatRoutes.ts';
import messageRoutes from './routes/messageRoutes.ts';
import statsRoutes from './routes/statsRoutes.ts';
import authRoutes from './routes/authRoutes.ts';

dotenv.config();

const app = express();
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

const httpServer = createServer(app);
const io = initSocket(httpServer);

app.use((req:any, res, next) => {
  req.io = io;
  next();
});
app.use('/api/agents', agentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/auth', authRoutes);

// Socket Broadcast remains here as it's a global background task
setInterval(() => {
  const timestamp = new Date().toLocaleTimeString();
  
  // 1. Get all room names that are currently active
  const activeRooms = io.sockets.adapter.rooms;

  activeRooms.forEach((_, roomId) => {
    // 2. Filter out the default socket rooms (which are just the socket IDs)
    // and target your specific agentId rooms
    if (roomId.length > 20) { // Or use a specific prefix check if your IDs have one
      io.to(roomId).emit('telemetry_update', {
        type: 'latency',
        value: Math.floor(Math.random() * 150) + 50,
        timestamp
      });

      io.to(roomId).emit('telemetry_update', {
        type: 'tokens',
        value: Math.floor(Math.random() * 50) + 20,
        timestamp
      });
    }
  });
}, 2000);
httpServer.listen(4000, () => console.log('🚀 Backend running at :4000'));