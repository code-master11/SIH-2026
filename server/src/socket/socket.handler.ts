import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload } from '../types';

let ioInstance: Server;

export const initSocket = (server: any) => {
  ioInstance = new Server(server, {
    cors: {
      origin: config.FRONTEND_URL,
      methods: ['GET', 'POST']
    }
  });

  ioInstance.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
      (socket as any).user = decoded;
      next();
    } catch (e) {
      next(new Error('Authentication error'));
    }
  });

  ioInstance.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    socket.join(`user:${user.userId}`);
    
    socket.on('join:case', (caseId) => {
      socket.join(`case:${caseId}`);
    });
    
    socket.on('leave:case', (caseId) => {
      socket.leave(`case:${caseId}`);
    });
  });
};

export const emitToUser = (userId: string, event: string, data: any) => {
  if (ioInstance) ioInstance.to(`user:${userId}`).emit(event, data);
};

export const emitToCase = (caseId: string, event: string, data: any) => {
  if (ioInstance) ioInstance.to(`case:${caseId}`).emit(event, data);
};
