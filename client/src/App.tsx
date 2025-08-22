import React, { useEffect } from "react";
import socket from "./socket/socket";

function App() {
  useEffect(() => {
    socket.connect();

    socket.on("connect", () => {
      console.log("✅ Connected to server");
      socket.emit("my-msg", "Hello from client!");
    });

    socket.on("message", (msg) => {
      console.log("📩 Message from server:", msg);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div>
      <h1>React + TypeScript + Socket.IO</h1>
    </div>
  );
}

export default App;
