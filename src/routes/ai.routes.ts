import { Router } from "express";
import { aiAssist } from "../controllers/ai.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post(
    "/assist",
    authenticate,
    aiAssist
);

export default router;