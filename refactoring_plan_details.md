# Detailed Refactoring Plan: Jaydai Chrome Extension

This document provides a detailed breakdown of the refactoring strategy for the Jaydai Chrome Extension, building upon the initial checklist in `todo.md`.

**1. Multi-Site Abstraction (Ref: todo.md #1)**

*   **Goal:** Decouple core logic from site-specific implementations (ChatGPT, Claude, etc.) to facilitate easy addition of new platforms.
*   **Strategy:** We will implement a Strategy Pattern combined with configuration files.
    *   A new directory `src/platforms` will be created.
    *   Inside `src/platforms`, subdirectories for each supported site (e.g., `chatgpt`, `claude`) will contain:
        *   `config.ts`: Defines site-specific selectors (prompt textarea, chat container), API endpoint patterns, and other constants.
        *   `networkHandler.ts`: Implements logic for intercepting and processing site-specific network requests (replaces logic currently in `fetchInterceptor.js` and `endpointDetector.js`).
        *   `domUtils.ts`: Contains functions for interacting with the site's DOM, including prompt insertion (replaces logic in `insertPrompt.ts`).
        *   `initializer.ts`: (Optional) Site-specific initialization logic if needed.
    *   A central `PlatformManager` or similar service will detect the current platform (refining `detectPlatform`) and load the appropriate site-specific strategy (config, handlers, utils).
*   **Implementation Steps:**
    *   **(1.5)** Create `src/platforms/chatgpt` and `src/platforms/claude` directories.
    *   **(1.1)** Move ChatGPT-specific endpoint patterns from `endpointDetector.js` to `src/platforms/chatgpt/config.ts`. Create equivalent config for Claude.
    *   **(1.1)** Refactor `fetchInterceptor.js` to use the `PlatformManager` to delegate request/response handling to the active platform's `networkHandler.ts`.
    *   **(1.2)** Create `PlatformManager.ts` to handle platform detection and strategy loading.
    *   **(1.3)** Move ChatGPT-specific insertion logic from `insertPrompt.ts` to `src/platforms/chatgpt/domUtils.ts`. Create equivalent for Claude.
    *   **(1.3)** Refactor the main prompt insertion function to use the `PlatformManager` to call the active platform's `domUtils.ts` insertion function.
    *   **(1.4)** Review `content.js`, `initializer.ts`, `applicationInitializer.ts` to ensure they use the `PlatformManager` where site-specific logic might be needed.

**2. Code Structure & Maintainability (Ref: todo.md #2)**

*   **Goal:** Improve organization, reduce file size, and eliminate duplication.
*   **Strategy:** Systematically review large files and complex directories, applying principles of modularity and DRY (Don't Repeat Yourself).
*   **Implementation Steps:**
    *   **(2.1)** Analyze files like `AuthService/index.ts`, `TemplateService.tsx`, potentially large hooks or components. Break them down into smaller, more focused files based on functionality (e.g., separate auth operations, token handling). The `injectedInterceptor` logic will be largely refactored into the `src/platforms` structure.
    *   **(2.2)** Evaluate the overall `src` directory structure. Consider grouping related features more cohesively if needed (e.g., all prompt-related hooks/services under a `features/prompts` directory). The current structure seems reasonable but will be reassessed after multi-site abstraction.
    *   **(2.3)** Search for duplicated utility functions, API call patterns, or component logic. Abstract these into reusable functions, hooks, or components.
    *   **(2.4)** Remove `sendLegacyEvent` calls and related logic in `eventsHandler.js` and `fetchInterceptor.js` after confirming the new event system (`dispatchEvent`) is fully adopted by all relevant services.

**3. Componentization (Ref: todo.md #3)**

*   **Goal:** Ensure React components are small, reusable, and follow best practices.
*   **Strategy:** Review existing components, especially larger ones involved in the popup or welcome pages.
*   **Implementation Steps:**
    *   **(3.1)** Examine components like `ExtensionPopup.tsx`, `WelcomePage.tsx`, `AuthDialog.tsx`, `ToolCard.tsx`. Break down complex components into smaller, single-purpose child components.
    *   **(3.1)** Identify opportunities to create more reusable presentational components.

**4. State Management (Ref: todo.md #4)**

*   **Goal:** Ensure consistent and efficient use of state management.
*   **Strategy:** Review the usage of `AuthContext.tsx` and custom hooks managing state.
*   **Implementation Steps:**
    *   **(4.1)** Verify that context is used appropriately and doesn't cause unnecessary re-renders. Evaluate if Zustand or Jotai could simplify global state if context becomes unwieldy (though likely not necessary for the current scope).
    *   **(4.1)** Ensure custom hooks managing state have clear responsibilities and dependencies.

**5. Services Layer (Ref: todo.md #5)**

*   **Goal:** Ensure services are well-defined and maintainable.
*   **Strategy:** Review service responsibilities and interactions.
*   **Implementation Steps:**
    *   **(5.1)** Confirm each service in `src/services` (e.g., `AuthService`, `TemplateService`, `StatsService`) has a clear, single responsibility.
    *   **(5.2)** Analyze `ChatOrchestrator.ts`. Ensure its role in coordinating different services (like chat parsing, storage, API calls) is clear and not overly complex. Refactor if it's becoming a bottleneck or handling too many unrelated tasks.

**6. Error Handling (Ref: todo.md #6)**

*   **Goal:** Implement consistent and informative error handling.
*   **Strategy:** Review `try...catch` blocks, API error handling, and user feedback mechanisms.
*   **Implementation Steps:**
    *   **(6.1)** Standardize error handling for API calls within `ApiClient.ts` or service wrappers.
    *   **(6.1)** Ensure errors in background scripts, content scripts, and UI components are caught, logged appropriately (perhaps using a dedicated error reporting service/module like `ErrorReporter.ts`), and provide user feedback where necessary (e.g., using `react-hot-toast` via `useNotifications`).

**7. Testing Setup (Ref: todo.md #7)**

*   **Goal:** Introduce automated testing for improved reliability and easier future development.
*   **Strategy:** Integrate Vitest and write unit/integration tests for key parts of the application.
*   **Implementation Steps:**
    *   **(7.1)** Install and configure Vitest (`npm install -D vitest @vitest/ui`). Add test scripts to `package.json`.
    *   **(7.2)** Write unit tests for:
        *   Utility functions (e.g., `placeholderUtils.ts`, `getCurrentChatId.ts`).
        *   Platform-specific logic (`src/platforms/**/domUtils.ts`, `networkHandler.ts`).
        *   Core services logic (e.g., parts of `AuthService`, `TemplateService`).
        *   Critical hooks (e.g., `useTemplateEditor`, `useFolderSearch`).
    *   **(7.3)** Write integration tests for:
        *   API service interactions (mocking API calls).
        *   Key user flows like template creation/insertion (potentially using testing-library/react).

**8. Final Review & Cleanup (Ref: todo.md #8)**

*   **Goal:** Ensure code quality and consistency.
*   **Strategy:** Apply automated tooling and perform manual review.
*   **Implementation Steps:**
    *   **(8.1)** Run ESLint (`npm run lint`) and Prettier (if configured, or configure it) to enforce code style and catch potential issues.
    *   **(8.2)** Conduct a final walkthrough of the refactored code.
    *   **(8.3)** Update any relevant README sections or internal documentation comments if structures have significantly changed.

This detailed plan provides a roadmap for the refactoring process. I will now proceed with the implementation, following these steps and updating the `todo.md` checklist as tasks are completed.
