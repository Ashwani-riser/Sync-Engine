import { OAuth2Client } from "google-auth-library";
import User from "../models/user";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

interface GoogleUserData {
  googleId: string;
  email: string;
  name: string;
}

export const loginWithGoogle = async (
  credential: string
) => {
  // 1. Verify Google ID token
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload) {
    throw new Error("Invalid Google token");
  }

  if (!payload.email || !payload.sub) {
    throw new Error("Google account information missing");
  }

  if (!payload.email_verified) {
    throw new Error("Google email is not verified");
  }

  const googleUser: GoogleUserData = {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name || "Google User",
  };

  // 2. Check if Google account already exists
  let user = await User.findOne({
    googleId: googleUser.googleId,
  });

  // 3. If not found, check existing account by email
  if (!user) {
    user = await User.findOne({
      email: googleUser.email,
    });
  }

  // 4. Create new account
  if (!user) {
    const randomPassword = await bcrypt.hash(
      `${googleUser.googleId}-${Date.now()}-${Math.random()}`,
      10
    );

    user = await User.create({
      name: googleUser.name,
      email: googleUser.email,
      password: randomPassword,
      googleId: googleUser.googleId,
      authProvider: "google",
      emailVerified: true,
    });
  } else {
    // 5. Link Google account with existing account
    if (!user.googleId) {
      user.googleId = googleUser.googleId;
    }

    if (user.authProvider === "local") {
      // Keep existing local login working.
      // Google login is now linked to the same account.
      user.googleId = googleUser.googleId;
    }

    await user.save();
  }

  // 6. Create our normal JWT
  const token = jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
    },
    process.env.JWT_SECRET as string,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    } as jwt.SignOptions
  );

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  };
};