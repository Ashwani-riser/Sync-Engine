import "dotenv/config";
import http from "http";
import app from "./app";
import connectDB from "./config/db";
import { Server } from "socket.io";
import { registerDocumentSocket } from "./sockets/document.socket";

const PORT = process.env.PORT || 8000;

const startServer = async () => {
    await connectDB();

    const server = http.createServer(app);

    const io = new Server(server, {
        cors: {
            origin: "http://localhost:3000",
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        console.log("🔌 Client connected:", socket.id);

        // Register document socket events
        registerDocumentSocket(io, socket);

        socket.on("disconnect", () => {
            console.log("🔌 Client disconnected:", socket.id);
        });
    });

    server.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🔌 Socket.IO running on port ${PORT}`);
    });
};

startServer();