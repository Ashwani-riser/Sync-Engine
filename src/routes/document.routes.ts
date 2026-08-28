import { Router } from "express";
import {
    create,
    getAll,
    getById,
    addCollaboratorToDocument,
} from "../controllers/document.controller";

import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authenticate, create);

router.get("/", authenticate, getAll);

router.get("/:documentId", authenticate, getById);

// Add collaborator — only owner can do this
router.post(
    "/:documentId/collaborators",
    authenticate,
    addCollaboratorToDocument
);

export default router;