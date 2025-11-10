// src/firebase/passwordrecovery.js
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "./firebaseConfig";

/**
 * Sends a password reset email to the specified email address.
 * @param {string} email The user's email address.
 * @returns {Promise<{success: boolean, message: string}>} An object indicating success or failure.
 */
export async function resetPassword(email) {
  // SECURITY: Validate input before processing.
  if (!email) {
    return { success: false, message: "Email address cannot be empty." };
  }

  try {
    await sendPasswordResetEmail(auth, email);
    console.log(`Password reset email sent to: ${email}`);
    return { success: true, message: "Password reset email sent! Please check your inbox." };
  } catch (error) {
    console.error(`Failed to send password reset email to ${email}:`, error.code);
    
    // SECURITY: Provide user-friendly messages for known errors without leaking sensitive information.
    if (error.code === 'auth/invalid-email') {
        return { success: false, message: "The email address is not valid." };
    }
    if (error.code === 'auth/user-not-found') {
        return { success: false, message: "No account is associated with this email address." };
    }
    // Generic fallback for other errors to prevent leaking implementation details.
    return { success: false, message: "An error occurred while sending the reset email. Please try again." };
  }
}