const { io } = require("socket.io-client");
const http = require("http");

const HOST = "localhost";
const PORT = 8000;

const email = "ashwani@example.com";
const password = "123456";

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

        console.log("🔐 Logging in...");

        const cookie = await login();

        console.log("🍪 Cookie received");


        const socket = io("http://localhost:8000", {
            extraHeaders: {
                Cookie: cookie,
            },
        });


        socket.on("connect", () => {

            console.log("✅ Socket connected:", socket.id);

            socket.emit(
                "join-document",
                "6a908fc62e5d2ed7a2db57a7"
            );
        });


        socket.on("document-joined", (data) => {

            console.log("📄 Document joined:");
            console.log(data);


            socket.emit("document-update", {
                documentId: "6a908fc62e5d2ed7a2db57a7",
                title: "Socket Test",
                content: "Hello from Socket.IO!",
            });
        });


        socket.on("document-updated", (data) => {

            console.log("📝 Document updated:");
            console.log(data);
        });


        socket.on("socket-error", (data) => {

            console.log("❌ Socket error:");
            console.log(data);
        });


        socket.on("connect_error", (error) => {

            console.log("❌ Connection error:");
            console.log(error.message);
        });

    } catch (error) {

        console.error("❌ Test failed:", error.message);

    }
}


start();