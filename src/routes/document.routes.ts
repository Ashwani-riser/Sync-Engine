import { Router } from "express";
import {
    create,
    getAll,
} from "../controllers/document.controller";

import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authenticate, create);

router.get("/", authenticate, getAll);

export default router;