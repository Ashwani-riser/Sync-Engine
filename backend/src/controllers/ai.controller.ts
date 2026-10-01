import { Request, Response } from "express";
import { generateAIResponse } from "../services/ai.service";
import { getDocumentById } from "../services/document.service";

export const aiAssist = async (
    req: Request,
    res: Response
) => {
    try {
        const { documentId, action } = req.body;

        if (!documentId) {
            return res.status(400).json({
                success: false,
                message: "Document ID is required",
            });
        }

        if (!action) {
            return res.status(400).json({
                success: false,
                message: "Action is required",
            });
        }

        const userId = req.user!.userId;

        const document = await getDocumentById(
            documentId,
            userId
        );

        let instruction = "";

        switch (action) {
            case "summarize":
                instruction =
                    "Summarize the following document clearly and concisely.";

                break;

            case "improve":
                instruction =
                    "Improve the grammar, clarity and readability of the following document. Preserve its original meaning.";

                break;

            case "rewrite":
                instruction =
                    "Rewrite the following document in a clearer and more professional way while preserving its meaning.";

                break;

            case "explain":
                instruction =
                    "Explain the following document in simple and easy-to-understand language.";

                break;

            default:
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid action. Use summarize, improve, rewrite or explain.",
                });
        }

        const prompt = `
You are an AI assistant inside a collaborative document editor.

Your task:
${instruction}

IMPORTANT:
- Use only the document content provided below.
- Do not invent information.
- Do not discuss unrelated topics.
- Return only the requested result.

DOCUMENT:
"""
${document.content}
"""
`;

        const result = await generateAIResponse(prompt);

        return res.status(200).json({
            success: true,
            action,
            documentId,
            result,
        });

    } catch (error) {

        console.error("AI Error:", error);

        return res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "AI request failed",
        });
    }
};