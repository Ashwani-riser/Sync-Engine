import "dotenv/config";

import http from "http";

import app from "./app";

import connectDB from "./config/db";

import { Server } from "socket.io";

import {
    authenticateSocket,
    AuthSocket,
} from "./sockets/socket.auth";

import {
    registerDocumentSocket,
} from "./sockets/document.socket";


const PORT =
    process.env.PORT || 8000;


const startServer = async () => {

    try {

        // ==========================================
        // DATABASE
        // ==========================================

        await connectDB();


        // ==========================================
        // HTTP SERVER
        // ==========================================

        const server =
            http.createServer(app);


        // ==========================================
        // SOCKET.IO
        // ==========================================

        const io =
            new Server(server, {

                cors: {
                    origin:
                        process.env.CLIENT_URL,

                    credentials: true,
                },

            });


        // Make Socket.IO available
        // inside Express controllers

        app.set("io", io);


        // ==========================================
        // SOCKET AUTHENTICATION
        // ==========================================

        io.use(
            authenticateSocket
        );


        // ==========================================
        // SOCKET CONNECTION
        // ==========================================

        io.on(
            "connection",
            (socket) => {

                console.log(
                    "🔌 Client connected:",
                    socket.id
                );


                registerDocumentSocket(
                    io,
                    socket as AuthSocket
                );


                socket.on(
                    "disconnect",
                    () => {

                        console.log(
                            "🔌 Client disconnected:",
                            socket.id
                        );

                    }
                );

            }
        );


        // ==========================================
        // START SERVER
        // ==========================================

        server.listen(
            PORT,
            () => {

                console.log(
                    `🚀 Server running on port ${PORT}`
                );

                console.log(
                    `🔌 Socket.IO running on port ${PORT}`
                );

            }
        );

    } catch (error) {

        console.error(
            "❌ Failed to start server:",
            error
        );

        process.exit(1);
    }
};


startServer();