const { io } = require("socket.io-client");

const socket = io("http://localhost:8000", {
    withCredentials: true,
});

socket.on("connect", () => {
    console.log("✅ Connected:", socket.id);

    socket.emit(
        "join-document",
        "6a908fc62e5d2ed7a2db57a7"
    );
});

socket.on("document-joined", (data) => {
    console.log("📄 Document joined:", data);

    socket.emit("document-update", {
        documentId: "6a908fc62e5d2ed7a2db57a7",
        title: "Socket Test",
        content: "Hello from Socket.IO!",
    });
});

socket.on("document-updated", (data) => {
    console.log("📝 Document updated:", data);
});

socket.on("socket-error", (data) => {
    console.log("❌ Socket error:", data);
});

socket.on("connect_error", (error) => {
    console.log("❌ Connection error:", error.message);
});