import { Server } from "socket.io";
export const initSocket = (httpServer: any) => {
  const io = new Server(httpServer, {
    cors: { origin: "http://localhost:3000", credentials: true }
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on('join_room', (agentId) => {
      socket.join(agentId);
      console.log(`Socket ${socket.id} joined room: ${agentId}`);
    });

    socket.on('leave_room', (agentId) => {
      socket.leave(agentId);
      console.log(`Socket ${socket.id} left room: ${agentId}`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });

  return io;
};