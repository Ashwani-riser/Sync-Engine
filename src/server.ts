import "dotenv/config";
import http from "http";
import app from "./app";
import connectDB from "./config/db";

const PORT = process.env.PORT || 8000;

const startServer = async () => {
    await connectDB();

    const server = http.createServer(app);

    server.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
};

startServer();