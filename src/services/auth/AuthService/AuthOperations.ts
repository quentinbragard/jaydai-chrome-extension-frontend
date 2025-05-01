// src/services/auth/AuthService/AuthOperations.ts
import { AuthUser, AuthToken, AuthState } from "@/types";
import { emitEvent, AppEvent } from "@/core/events/events";
import { debug } from "@/core/config";
import { AuthStateManager } from "./AuthStateManager"; // Import for type usage
import { TokenService } from "../TokenService"; // Import for type usage
import { AuthNotifications } from "./AuthNotifications";

// Define the expected response structure for background messages
interface BackgroundResponse {
  success: boolean;
  user?: AuthUser;
  error?: string;
  session?: AuthToken;
}

/**
 * Handles direct interactions with the background script for authentication operations
 * and manages user data storage (excluding tokens).
 * Also contains the logic for executing the full sign-in/sign-up/sign-out flows.
 */
export class AuthOperations {
  /**
   * Sends a message to the background script and returns the response.
   */
  private static async sendMessageToBackground(
    message: any
  ): Promise<BackgroundResponse> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          console.error(
            "AuthOperations: Error sending message to background:",
            chrome.runtime.lastError.message,
            "Message:",
            message
          );
          resolve({
            success: false,
            error: `Background script communication error: ${chrome.runtime.lastError.message}`,
          });
        } else {
          resolve(response || { success: false, error: "No response from background script" });
        }
      });
    });
  }

  /**
   * Get user data from local storage.
   */
  public static async getUserFromStorage(): Promise<AuthUser | null> {
    debug("AuthOperations: Getting user from storage...");
    return new Promise((resolve) => {
      chrome.storage.local.get(["user"], (result) => {
        debug("AuthOperations: User retrieved from storage:", result.user);
        resolve(result.user || null);
      });
    });
  }

  /**
   * Store user data in local storage.
   */
  public static async storeUserInStorage(user: AuthUser): Promise<void> {
    debug("AuthOperations: Storing user in storage:", user);
    return new Promise((resolve) => {
      chrome.storage.local.set({ user }, () => {
        debug("AuthOperations: User stored successfully.");
        resolve();
      });
    });
  }

  /**
   * Clear only user-specific data (user object, userId) from local storage.
   * Token clearing is handled by TokenService.
   */
  public static async clearUserDataOnly(): Promise<void> {
    debug("AuthOperations: Clearing user data (user, userId) from storage...");
    return new Promise((resolve) => {
      chrome.storage.local.remove(["user", "userId"], () => {
        debug("AuthOperations: User data cleared.");
        resolve();
      });
    });
  }

  // --- Full Authentication Flows ---

  /**
   * Executes the full sign-in flow using email and password.
   */
  public static async executeSignInWithEmail(
    email: string,
    password: string,
    stateManager: AuthStateManager,
    tokenService: TokenService
  ): Promise<boolean> {
    debug("AuthOperations: Executing email sign-in flow...");
    stateManager.updateState({ isLoading: true, error: null });
    const response = await this.sendMessageToBackground({ action: "emailSignIn", email, password });

    if (response.success && response.user && response.session) {
      debug("AuthOperations: Email sign-in successful.");
      await tokenService.storeAuthSession(response.session);
      await this.storeUserInStorage(response.user);
      stateManager.updateState({
        isAuthenticated: true,
        user: response.user,
        isLoading: false,
        error: null,
      });
      return true;
    } else {
      debug("AuthOperations: Email sign-in failed.", { error: response.error });
      stateManager.updateState({
        isAuthenticated: false,
        isLoading: false,
        error: response.error || "Sign-in failed",
      });
      return false;
    }
  }

  /**
   * Executes the full sign-up flow using email and password.
   */
  public static async executeSignUp(
    email: string,
    password: string,
    name: string | undefined,
    stateManager: AuthStateManager,
    tokenService: TokenService
  ): Promise<boolean> {
    debug("AuthOperations: Executing sign-up flow...");
    stateManager.updateState({ isLoading: true, error: null });
    const response = await this.sendMessageToBackground({ action: "signUp", email, password, name });

    if (response.success) {
      debug("AuthOperations: Sign-up successful (verification might be pending).");
      // Store session and user data if provided, allowing potential auto-login after verification.
      if (response.session) {
        await tokenService.storeAuthSession(response.session);
      }
      if (response.user) {
        await this.storeUserInStorage(response.user);
      }
      stateManager.updateState({
        user: response.user || null, // Update user if available
        isLoading: false,
        error: null,
        // isAuthenticated remains false until verified/logged in
      });
      return true;
    } else {
      debug("AuthOperations: Sign-up failed.", { error: response.error });
      stateManager.updateState({
        isAuthenticated: false,
        isLoading: false,
        error: response.error || "Sign-up failed",
      });
      return false;
    }
  }

  /**
   * Executes the full sign-in flow using Google OAuth.
   */
  public static async executeSignInWithGoogle(
    stateManager: AuthStateManager,
    tokenService: TokenService
  ): Promise<boolean> {
    debug("AuthOperations: Executing Google sign-in flow...");
    stateManager.updateState({ isLoading: true, error: null });

    try {
      const response = await this.sendMessageToBackground({ action: "googleSignIn" });

      if (response.success && response.user && response.session) {
        debug("AuthOperations: Google sign-in successful.");
        await tokenService.storeAuthSession(response.session);
        await this.storeUserInStorage(response.user);
        stateManager.updateState({
          isAuthenticated: true,
          user: response.user,
          isLoading: false,
          error: null,
        });
        return true;
      } else {
        debug("AuthOperations: Google sign-in failed.", { error: response.error });
        stateManager.updateState({
          isAuthenticated: false,
          isLoading: false,
          error: response.error || "Google sign-in failed",
        });
        return false;
      }
    } catch (error) {
      console.error("AuthOperations: Google sign-in operation error:", error);
      stateManager.updateState({
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : "Google sign-in failed",
      });
      return false;
    }
  }

  /**
   * Executes the full sign-out flow.
   */
  public static async executeSignOut(
    stateManager: AuthStateManager,
    tokenService: TokenService
  ): Promise<void> {
    debug("AuthOperations: Executing sign-out flow...");
    await tokenService.clearAuthSession();
    await this.clearUserDataOnly(); // Clear only user data from storage

    stateManager.updateState({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
    });

    AuthNotifications.showSignOutConfirmation();
    emitEvent(AppEvent.AUTH_LOGOUT, undefined); // Emit logout event
    debug("AuthOperations: Sign out complete.");
  }
}

