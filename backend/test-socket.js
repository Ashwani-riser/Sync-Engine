const { io } = require("socket.io-client");
const http = require("http");

const HOST = "localhost";
const PORT = 8000;

const email = "ashwani@example.com";
const password = "123456";

const documentId = "6a908fc62e5d2ed7a2db57a7";

function login() {
    return new Promise((resolve, reject) => {

        const data = JSON.stringify({
            email,
            password,
        });

        const req = http.request(
            {
                hostname: HOST,
                port: PORT,
                path: "/api/auth/login",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(data),
                },
            },
            (res) => {

                let body = "";

                res.on("data", (chunk) => {
                    body += chunk;
                });

                res.on("end", () => {

                    console.log("Login status:", res.statusCode);
                    console.log("Login response:", body);

                    const cookies = res.headers["set-cookie"];

                    if (!cookies) {
                        reject(new Error("Token cookie not received"));
                        return;
                    }

                    const tokenCookie = cookies.find((cookie) =>
                        cookie.startsWith("token=")
                    );

                    if (!tokenCookie) {
                        reject(new Error("Token cookie not found"));
                        return;
                    }

                    resolve(tokenCookie.split(";")[0]);
                });
            }
        );

        req.on("error", reject);

        req.write(data);
        req.end();
    });
}

async function start() {

    try {

        console.log("Logging in...");

        const cookie = await login();

        console.log("Cookie received");

        const socket = io(process.env.NEXT_PUBLIC_API_URL, {
            extraHeaders: {
                Cookie: cookie,
            },
        });

        socket.on("connect", () => {

            console.log("Socket connected:", socket.id);

            console.log("Joining document...");

            socket.emit(
                "join-document",
                documentId
            );
        });

    //     socket.on("document-joined", (data) => {

    //          console.log("Document joined:");
    //          console.log(data);

    //    socket.emit("document-update", {
    //          documentId: documentId,
    //          title: "Socket Test",
    //          content: "Hello from Client A",
    //        });
    //   });

   socket.on("document-joined", (data) => {
    console.log("Document joined:");
    console.log(data);

    // socket.emit("document-update", {
    //     documentId: documentId,
    //     title: "Socket Test",
    //     content: "Update from Client A",
    //     expectedVersion: 8,
    // });
});
socket.on("presence-updated", (data) => {
    console.log("");
    console.log("👥 PRESENCE UPDATED:");
    console.log(data);
    console.log("");
});

        socket.on("document-updated", (data) => {

            console.log("");
            console.log("REAL-TIME UPDATE RECEIVED");
            console.log("Document updated:");
            console.log(data);
            console.log("");
        });

        socket.on("version-conflict", (data) => {

            console.log("");
            console.log("VERSION CONFLICT");
            console.log(data);
            console.log("");
        });

        socket.on("socket-error", (data) => {

            console.log("");
            console.log("Socket error:");
            console.log(data);
            console.log("");
        });

        socket.on("connect_error", (error) => {

            console.log("");
            console.log("Connection error:");
            console.log(error.message);
            console.log("");
        });

        socket.on("disconnect", (reason) => {

            console.log("Socket disconnected:", reason);
        });

    } catch (error) {

        console.error("Test failed:", error);
    }
}

start();