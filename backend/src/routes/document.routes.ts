import { Router } from "express";
import {
    create,
    getAll,
    getById,
    addCollaboratorToDocument,
    updateCollaborator,
    removeCollaboratorFromDocument,
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

// Add collaborator
router.post(
    "/:documentId/collaborators",
    authenticate,
    addCollaboratorToDocument
);

// Change collaborator role
router.patch(
    "/:documentId/collaborators/:collaboratorId",
    authenticate,
    updateCollaborator
);

// Remove collaborator
router.delete(
    "/:documentId/collaborators/:collaboratorId",
    authenticate,
    removeCollaboratorFromDocument
);

export default router;