import app from "./app.js";
import dbConnection from "./db/db..js";
import { createServer } from 'http';
import { setupSocketServer } from "./socket/socket.service.js";
const server = createServer(app);

setupSocketServer(server)
dbConnection().then(() => {
  server.listen(process.env.PORT, () => {
    console.log(`🤖 Server is running port${process.env.PORT}`);
  });
  console.log(process.env.PORT);
}).catch((err) => {
console.log("failed to connect db");

})
