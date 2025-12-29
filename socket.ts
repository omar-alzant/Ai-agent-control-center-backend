import { Server } from "socket.io";
export const initSocket = (httpServer: any) => {
  const allowedOrigins = process.env.CORS_ORIGINS?.split(",").map(o => o.trim());

  const io = new Server(httpServer, {
    cors: { 
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins?.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    // console.log("Client connected:", socket.id);

    socket.on('join_room', (agentId) => {
      socket.join(agentId);
      // console.log(`Socket ${socket.id} joined room: ${agentId}`);
    });

    socket.on('leave_room', (agentId) => {
      socket.leave(agentId);
      // console.log(`Socket ${socket.id} left room: ${agentId}`);
    });

    socket.on("disconnect", () => {
      // console.log("Client disconnected");
    });
  });

  return io;
};