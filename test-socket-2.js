const { io } = require("socket.io-client");
const http = require("http");

const HOST = "localhost";
const PORT = 8000;

const email = "ashwani.com";
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

        console.log("🔐 Client B logging in...");

        const cookie = await login();

        console.log("🍪 Client B received cookie");


        const socket = io("http://localhost:8000", {
            extraHeaders: {
                Cookie: cookie,
            },
        });


        socket.on("connect", () => {

            console.log(
                "✅ Client B connected:",
                socket.id
            );

            socket.emit(
                "join-document",
                documentId
            );
        });


        socket.on("document-joined", (data) => {

            console.log("📄 Client B joined document:");

            console.log(data);

            console.log(
                "\n👂 Client B is now listening for updates...\n"
            );
        });


        socket.on("document-updated", (data) => {

            console.log(
                "🔥🔥 REAL-TIME UPDATE RECEIVED BY CLIENT B 🔥🔥"
            );

            console.log(data);

        });


        socket.on("socket-error", (data) => {

            console.log("❌ Socket error:");

            console.log(data);

        });


        socket.on("connect_error", (error) => {

            console.log(
                "❌ Connection error:",
                error.message
            );

        });

    } catch (error) {

        console.error(
            "❌ Client B test failed:",
            error
        );

    }
}

start();