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

import {
    authenticate,
} from "../middleware/auth.middleware";


const router =
    Router();


// ==========================================
// DOCUMENTS
// ==========================================

router.post(
    "/",
    authenticate,
    create
);


router.get(
    "/",
    authenticate,
    getAll
);


// ==========================================
// HISTORY
// ==========================================

router.get(
    "/:documentId/history",
    authenticate,
    getHistory
);


// ==========================================
// COLLABORATORS
// ==========================================

router.post(
    "/:documentId/collaborators",
    authenticate,
    addCollaboratorToDocument
);


router.patch(
    "/:documentId/collaborators/:collaboratorId",
    authenticate,
    updateCollaborator
);


router.delete(
    "/:documentId/collaborators/:collaboratorId",
    authenticate,
    removeCollaboratorFromDocument
);


// ==========================================
// DOCUMENT BY ID
// ==========================================

router.get(
    "/:documentId",
    authenticate,
    getById
);


// ==========================================
// UPDATE
// ==========================================

router.patch(
    "/:documentId",
    authenticate,
    update
);


// ==========================================
// DELETE
// ==========================================

router.delete(
    "/:documentId",
    authenticate,
    remove
);


export default router;