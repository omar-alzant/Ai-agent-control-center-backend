import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { initSocket } from './socket.ts';


// Route Imports
import agentRoutes from './routes/agentRoutes.ts';
import chatRoutes from './routes/chatRoutes.ts';
import messageRoutes from './routes/messageRoutes.ts';

dotenv.config();

const app = express();
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

const httpServer = createServer(app);
const io = initSocket(httpServer);
// Mount Routes
app.use('/api/agents', agentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);

// Socket Broadcast remains here as it's a global background task
setInterval(() => {
  const timestamp = new Date().toLocaleTimeString();
  io.emit('telemetry_update', {
    type: 'latency',
    value: Math.floor(Math.random() * 150) + 50,
    timestamp
  });


  io.emit('telemetry_update', {
    type: 'tokens', // This matches your state key 'tokens' in useSocketMetrics
    value: Math.floor(Math.random() * 50) + 20, 
    timestamp
  });
}, 2000);

httpServer.listen(4000, () => console.log('🚀 Backend running at :4000'));