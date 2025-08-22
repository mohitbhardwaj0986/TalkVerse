import { io, Socket } from "socket.io-client";

// Define server events
interface ServerToClientEvents {
  message: (msg: string) => void;
  userJoined: (username: string) => void;
}

// Define client events
interface ClientToServerEvents {
  sendMessage: (msg: string) => void;
}

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  import.meta.env.VITE_BACKEND_URL as string,
  {
    autoConnect: false,
  }
);

export default socket;
