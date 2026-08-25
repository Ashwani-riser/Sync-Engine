import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";
import documentRoutes from "./routes/document.routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Sync Engine is running",
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
export default app;