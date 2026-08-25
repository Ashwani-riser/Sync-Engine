import { Router } from "express";
import { create } from "../controllers/document.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Create document
router.post("/", authenticate, create);

export default router;