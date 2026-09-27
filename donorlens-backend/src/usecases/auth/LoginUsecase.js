// Business logic for user login - validates credentials and generates tokens

import User from "../../models/user/User.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../utils/jwt.util.js";

/**
 * Login Usecase - Handles the complete login business logic
 * @param {string} email - User's email address
 * @param {string} password - User's plain text password
 * @returns {Object} Result object with success status, tokens, and user data
 */
export default async function LoginUsecase(email, password) {
  try {
    if (!email || !password) {
      return {
        success: false,
        status: 400,
        message: "Email and password are required",
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        status: 400,
        message: "Invalid email format",
      };
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+passwordHash",
    );

    if (!user) {
      return {
        success: false,
        status: 401,
        message: "Invalid email or password",
      };
    }

    if (!user.isActive) {
      return {
        success: false,
        status: 403,
        message: "Account is deactivated. Please contact support.",
      };
    }

    // Google-linked accounts have no local password — fail with the same
    // generic message as a wrong password so this doesn't leak which accounts
    // are Google-only.
    if (!user.passwordHash) {
      return {
        success: false,
        status: 401,
        message: "Invalid email or password",
      };
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return {
        success: false,
        status: 401,
        message: "Invalid email or password",
      };
    }

    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user._id.toString(),
    });

    return {
      success: true,
      status: 200,
      data: {
        accessToken,
        refreshToken,
        user: user.toSafeObject(),
      },
    };
  } catch (error) {
    console.error("LoginUsecase error:", error);

    return {
      success: false,
      status: 500,
      message: "An error occurred during login. Please try again.",
    };
  }
}
