import mongoose, { Document as MongooseDocument, Schema } from "mongoose";

export interface IDocument extends MongooseDocument {
    title: string;
    content: string;
    owner: mongoose.Types.ObjectId;

    collaborators: {
        user: mongoose.Types.ObjectId;
        role: "editor" | "viewer";
    }[];
}
const documentSchema = new Schema<IDocument>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },

        content: {
            type: String,
            default: "",
        },

        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        collaborators: [
          {
             user: {
                  type: Schema.Types.ObjectId,
                  ref: "User",
                  required: true,
             },
              role: {
                   type: String,
                   enum: ["editor", "viewer"],
                   default: "editor",
               },
           },
        ],
    },
    {
        timestamps: true,
    }
);

const Document = mongoose.model<IDocument>(
    "Document",
    documentSchema
);

export default Document;