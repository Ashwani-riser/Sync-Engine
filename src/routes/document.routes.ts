import { Router } from "express";
import {
    create,
    getAll,
    getById,
} from "../controllers/document.controller";

import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authenticate, create);

router.get("/", authenticate, getAll);

router.get("/:documentId", authenticate, getById);

export default router;