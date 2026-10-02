import crypto from "crypto";
import bcrypt from "bcrypt";
import User from "../models/user";
import PendingUser from "../models/PendingUser";

export const createPendingVerification = async ({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}) => {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("An account with this email already exists");
  }

  const existingPendingUser = await PendingUser.findOne({ email });

  if (existingPendingUser) {
    await PendingUser.deleteOne({ _id: existingPendingUser._id });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const token = crypto.randomBytes(32).toString("hex");

  const tokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const expires = new Date(Date.now() + 30 * 60 * 1000);

  const pendingUser = await PendingUser.create({
    name,
    email,
    password: hashedPassword,
    verificationToken: tokenHash,
    verificationExpires: expires,
  });

  return {
    pendingUser,
    token,
  };
};

export const verifyPendingUser = async (token: string) => {
  const tokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const pendingUser = await PendingUser.findOne({
    verificationToken: tokenHash,
    verificationExpires: { $gt: new Date() },
  });

  if (!pendingUser) {
    throw new Error("Invalid or expired verification token");
  }

  const existingUser = await User.findOne({
    email: pendingUser.email,
  });

  if (existingUser) {
    await PendingUser.deleteOne({ _id: pendingUser._id });
    throw new Error("An account with this email already exists");
  }

  const user = await User.create({
    name: pendingUser.name,
    email: pendingUser.email,
    password: pendingUser.password,
    authProvider: "local",
    emailVerified: true,
  });

  await PendingUser.deleteOne({
    _id: pendingUser._id,
  });

  return user;
};