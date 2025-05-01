// src/services/auth/AuthService/index.ts
import { AbstractBaseService } from "../../BaseService";
import { AuthState, AuthErrorCode, AuthUser, AuthToken } from "@/types";
import { AuthStateManager } from "./AuthStateManager";
import { AuthOperations } from "./AuthOperations";
import { AuthNotifications } from "./AuthNotifications";
import { TokenService } from "../TokenService";
import { debug } from "@/core/config";

/**
 * Service for managing authentication state and operations.
 * Acts as a facade and orchestrator for authentication-related tasks,
 * coordinating AuthStateManager, AuthOperations, AuthNotifications, and TokenService.
 */
export class AuthService extends AbstractBaseService {
  private static instance: AuthService | null = null;
  private stateManager: AuthStateManager;
  private tokenService: TokenService;

  // Dependencies are injected or default instances are used
  private constructor(
    tokenService: TokenService,
    stateManager: AuthStateManager
  ) {
    super();
    this.tokenService = tokenService;
    this.stateManager = stateManager;
    debug("AuthService initialized with dependencies");
  }

  public static getInstance(
    tokenService?: TokenService,
    stateManager?: AuthStateManager
  ): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService(
        tokenService || TokenService.getInstance(),
        stateManager || new AuthStateManager()
      );
    }
    return AuthService.instance;
  }

  /**
   * Initialize authentication state by checking token validity and loading user data.
   */
  protected async onInitialize(): Promise<void> {
    debug("AuthService: Initializing...");
    this.stateManager.updateState({ isLoading: true, error: null });

    try {
      const tokenResponse = await this.tokenService.getAuthToken();

      if (!tokenResponse.success) {
        debug("AuthService: No valid token found or refresh failed.");
        this.stateManager.updateState({
          isAuthenticated: false,
          isLoading: false,
          error: tokenResponse.error || null,
          user: null,
        });
        return;
      }

      debug("AuthService: Valid token found. Fetching user data...");
      const user = await AuthOperations.getUserFromStorage();
      this.stateManager.updateState({
        isAuthenticated: true,
        isLoading: false,
        error: null,
        user,
      });
      debug("AuthService: Initialization successful.", { user });
    } catch (error) {
      console.error("AuthService: Initialization error:", error);
      this.stateManager.updateState({
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : "Authentication error",
        user: null,
      });
    }
  }

  /**
   * Clean up listeners.
   */
  protected onCleanup(): void {
    this.stateManager.clearListeners();
    debug("AuthService: Cleaned up listeners.");
  }

  // --- State Accessors and Subscription ---

  public isAuthenticated(): boolean {
    return this.stateManager.getState().isAuthenticated;
  }

  public getAuthState(): AuthState {
    return this.stateManager.getState();
  }

  public subscribe(callback: (state: AuthState) => void): () => void {
    return this.stateManager.subscribe(callback);
  }

  // --- Authentication Actions (Delegation to AuthOperations) ---

  /**
   * Handles the scenario when a session expires.
   */
  public async handleSessionExpired(): Promise<void> {
    debug("AuthService: Handling session expired.");
    this.stateManager.updateState({
      isAuthenticated: false,
      error: "Session expired. Please sign in again.",
      user: null,
      isLoading: false, // Ensure loading is false
    });

    await this.tokenService.clearAuthSession();
    await AuthOperations.clearUserDataOnly();

    AuthNotifications.showSessionExpiredNotification();
    AuthNotifications.notifyAuthError(
      AuthErrorCode.SESSION_EXPIRED,
      this.stateManager.getState().error
    );
  }

  /**
   * Sign in using email and password by delegating to AuthOperations.
   */
  public async signInWithEmail(
    email: string,
    password: string
  ): Promise<boolean> {
    return AuthOperations.executeSignInWithEmail(
      email,
      password,
      this.stateManager,
      this.tokenService
    );
  }

  /**
   * Sign up using email and password by delegating to AuthOperations.
   */
  public async signUp(
    email: string,
    password: string,
    name?: string
  ): Promise<boolean> {
    return AuthOperations.executeSignUp(
      email,
      password,
      name,
      this.stateManager,
      this.tokenService
    );
  }

  /**
   * Sign in using Google OAuth by delegating to AuthOperations.
   */
  public async signInWithGoogle(): Promise<boolean> {
    return AuthOperations.executeSignInWithGoogle(
      this.stateManager,
      this.tokenService
    );
  }

  /**
   * Sign out the current user by delegating to AuthOperations.
   */
  public async signOut(): Promise<void> {
    await AuthOperations.executeSignOut(this.stateManager, this.tokenService);
  }

  /**
   * Clear any error message in the auth state.
   */
  public clearError(): void {
    if (this.stateManager.getState().error) {
      debug("AuthService: Clearing error state.");
      this.stateManager.updateState({ error: null });
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();

