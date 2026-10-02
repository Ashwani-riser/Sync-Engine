import mongoose, { Document, Schema } from "mongoose";

export interface IPendingUser extends Document {
  name: string;
  email: string;
  password: string;
  verificationToken: string;
  verificationExpires: Date;
  createdAt: Date;
  updatedAt: Date;
}

const pendingUserSchema = new Schema<IPendingUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    verificationToken: {
      type: String,
      required: true,
    },

    verificationExpires: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IPendingUser>(
  "PendingUser",
  pendingUserSchema
);