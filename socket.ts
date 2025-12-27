import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

export let io: Server;

export const initSocket = (httpServer: any) => {
  io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:3000", // Ensure this is exactly your frontend URL
      methods: ["GET", "POST"],
      credentials: true
    }
  });
  return io;
};