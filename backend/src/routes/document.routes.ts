import { Router } from "express";
import {
    create,
    getAll,
    getById,
    addCollaboratorToDocument,
    update,
    remove,
    getHistory,
} from "../controllers/document.controller";

import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authenticate, create);

router.get("/", authenticate, getAll);

router.get(
    "/:documentId/history",
    authenticate,
    getHistory
);

router.get("/:documentId", authenticate, getById);

// Add collaborator — only owner can do this
router.post(
    "/:documentId/collaborators",
    authenticate,
    addCollaboratorToDocument
);
router.patch(
    "/:documentId",
    authenticate,
    update
);

router.delete(
    "/:documentId",
    authenticate,
    remove
);

export default router;