// src/firebase/authentication.js
import {
  getAuth,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from 'firebase/auth';
import { functions } from './firebaseConfig';
import { httpsCallable } from 'firebase/functions';

// This module provides functions for managing the currently authenticated user's credentials,
// such as changing their password or email address securely.

/**
 * Changes the current authenticated user's password.
 * This requires the user to provide their current password for security.
 * @param {string} currentPassword - The user's current password.
 * @param {string} newPassword - The new password to set.
 */
export const changeUserPassword = async (currentPassword, newPassword) => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    console.error("changeUserPassword failed: No user is currently signed in.");
    throw new Error("No user is currently signed in.");
  }

  const credential = EmailAuthProvider.credential(user.email, currentPassword);

  try {
    // Re-authenticate the user to confirm their identity
    await reauthenticateWithCredential(user, credential);
    // If re-authentication is successful, update the password
    await updatePassword(user, newPassword);
    console.log(`Password changed for user: ${user.email}`);
  } catch (error) {
    console.error(`Password change failed for user ${user.email}:`, error);
    // Provide a more user-friendly error message
    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      throw new Error("The current password you entered is incorrect.");
    } else if (error.code === 'auth/weak-password') {
      throw new Error("The new password is too weak. It must be at least 6 characters long.");
    }
    throw new Error("An error occurred while changing your password. Please try again.");
  }
};

/**
 * Calls a Cloud Function to send a verification code to the user's proposed new email address.
 * @param {string} newEmail The new email address to verify.
 */
export const sendEmailChangeVerification = async (newEmail) => {
  try {
    const sendCodeFunction = httpsCallable(functions, 'sendEmailChangeCode');
    const result = await sendCodeFunction({ newEmail });
    if (!result.data?.success) {
      throw new Error(result.data?.message || "Cloud function failed to send verification code.");
    }
    console.log(`Email change verification code sent to ${newEmail}`);
    return result.data;
  } catch (error) {
    console.error("Error calling sendEmailChangeCode Cloud Function:", error);
    // The error from the callable function already includes a helpful message.
    throw new Error(error.message || "An unexpected error occurred while sending the verification code.");
  }
};

/**
 * Initiates the process to change the current authenticated user's email.
 * Re-authenticates the user and then calls a Cloud Function to handle the change atomically.
 * @param {string} currentPassword - The user's current password for re-authentication.
 * @param {string} newEmail - The new email address.
 * @param {string} verificationCode - The code sent to the new email address.
 */
export const changeUserEmail = async (currentPassword, newEmail, verificationCode) => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    console.error("changeUserEmail failed: No user is currently signed in.");
    throw new Error("No user is currently signed in.");
  }

  // Step 1: Re-authenticate on the client for security
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  try {
    await reauthenticateWithCredential(user, credential);
    console.log(`User ${user.email} re-authenticated successfully for email change.`);
  } catch (error) {
    console.error(`Email change for ${user.email} failed during re-authentication:`, error);
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
      throw new Error("The password you entered is incorrect.");
    }
    throw new Error("An error occurred during re-authentication. Please try again.");
  }

  // Step 2: Call the Cloud Function to perform the atomic update
  try {
    const changeEmailFunction = httpsCallable(functions, 'changeUserEmail');
    const result = await changeEmailFunction({ newEmail, verificationCode });

    if (!result.data?.success) {
      throw new Error(result.data?.message || "Cloud function failed to update email.");
    }
    console.log(`Cloud function successfully changed email for UID ${user.uid} to ${newEmail}`);
    // The client's auth state will update automatically after a token refresh.
    return { success: true, message: result.data.message || "Email updated successfully. You might be asked to log in again with your new email." };
  } catch (error) {
    console.error(`Error calling changeUserEmail Cloud Function for UID ${user.uid}:`, error);
    throw new Error(error.message || "An unexpected error occurred while updating your email.");
  }
};