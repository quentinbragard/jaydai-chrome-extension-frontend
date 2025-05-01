# Detailed Refactoring Plan: Jaydai Chrome Extension (Phase 2)

This document outlines the second phase of refactoring for the Jaydai Chrome Extension, focusing on improving overall code maintainability, structure, and quality, building upon the multi-site abstraction implemented in Phase 1.

**Goals:**
- Create smaller, more focused code files.
- Improve folder structure for better clarity and organization.
- Remove unused code and dependencies.
- Refine naming conventions for consistency and clarity.
- Enhance type safety by reducing the use of `any`.
- Maintain all existing functionality.

**Refactoring Strategy:**

We will systematically review the codebase, applying principles of modularity, DRY (Don't Repeat Yourself), and SOLID where applicable. Tooling (linters, type checkers) will be used alongside manual review.

**Detailed Tasks:**

**1. File Structure & Organization:**
    *   **1.1. Review Single-File Folders:** Examine folders containing only one primary file (e.g., `src/hooks/notifications`, `src/services/analytics`, `src/providers`, `src/state`). Decide whether to:
        *   Merge the file content into the parent module's `index.ts` if simple.
        *   Keep the folder if the single file represents a distinct module/feature that might grow.
        *   Rename the file/folder for better clarity.
    *   **1.2. Evaluate Barrel Files:** Review `index.ts` files that primarily re-export (e.g., `src/services/TemplateService.tsx`, `src/hooks/stats/index.tsx`, `src/hooks/prompts/index.ts`, `src/services/api/index.ts`).
        *   Remove simple re-export files if they add unnecessary indirection. Encourage direct imports from the specific module file.
        *   Keep barrel files only if they group a significant number of related exports for a clear feature domain.
    *   **1.3. Consolidate `core` Directory:** Assess `src/core`. While useful, check if sub-modules like `config`, `env`, `errors`, `events` could be simplified or if parts could live closer to the features they primarily support.
    *   **1.4. Refine `services/api` Structure:** The current nesting (`prompts/folders`, `prompts/templates`) seems reasonable but verify consistency for future API additions.
    *   **1.5. Refine `hooks` Structure:** Ensure consistent grouping by feature (`prompts`, `stats`, `ui`). Check for hooks placed directly under `src/hooks` that could belong to a feature group.

**2. Code Splitting & Modularity:**
    *   **2.1. Refactor `AuthService`:** Break down the large `AuthService` class (`src/services/auth/AuthService/index.ts`).
        *   Extract distinct responsibilities (e.g., email/password auth, Google OAuth, session management, state updates) into smaller, potentially independent functions or classes within the `AuthService` directory.
        *   Reduce the number of public methods directly on the main `AuthService` instance if possible, delegating more to internal modules like `AuthOperations`.
    *   **2.2. Refactor `ChatOrchestrator`:** Simplify `ChatOrchestrator.ts`.
        *   Replace dynamic `require` calls with standard ES module `import` statements for dependency injection.
        *   Clarify its role: Is it just routing events, or does it contain business logic? Ensure it strictly orchestrates calls between `ConversationManager`, `MessageManager`, `MessageQueue`, and `PendingMessageTracker` without duplicating their logic.
    *   **2.3. Decompose Components:** Review potentially large React components (`ExtensionPopup.tsx`, `WelcomePage.tsx`, `AuthDialog.tsx`, `AuthForm.tsx`, `ToolGrid.tsx`). Break them into smaller, reusable sub-components following React best practices.
    *   **2.4. Simplify Hooks:** Examine complex custom hooks (e.g., `useTemplateCreation.ts`, `useTemplateEditor.ts`, `useFolderSearch.ts`). Split them into smaller, more focused hooks if they handle too many unrelated concerns.

**3. Unused Code Removal:**
    *   **3.1. Automated Detection:** Configure and run ESLint rules (e.g., `no-unused-vars`) and leverage TypeScript compiler options (`noUnusedLocals`, `noUnusedParameters`) to identify unused code.
    *   **3.2. Manual Review:** Search for commented-out code blocks, `TODO` comments referencing potentially obsolete logic, and functions/variables that might seem unused by static analysis but could be dynamically referenced (verify carefully before removal).
    *   **3.3. Dependency Check:** Use tools like `depcheck` (`npx depcheck`) to find unused npm dependencies listed in `package.json`.
    *   **3.4. Verify `eventsHandler.js`:** Explicitly check `src/extension/content/injectedInterceptor/eventsHandler.js` and related logic (like `messaging.js`) to ensure no legacy event handling remains after the Phase 1 refactoring.

**4. Naming Conventions & Consistency:**
    *   **4.1. Project Name:** Replace instances of "Archimind" (found in logs/comments) with "Jaydai" for consistency.
    *   **4.2. File/Folder Names:** Ensure file and folder names accurately reflect their content and follow a consistent convention (e.g., `kebab-case` for files/folders, `PascalCase` for component files).
    *   **4.3. Code Identifiers:** Review variable, function, class, and type names for clarity, descriptiveness, and adherence to TypeScript/React conventions (camelCase, PascalCase).

**5. TypeScript Enhancement (`any` Reduction):**
    *   **5.1. Address `no-explicit-any`:** Systematically review the 200+ ESLint errors related to `@typescript-eslint/no-explicit-any` reported in Phase 1.
    *   **5.2. Define Specific Types:** Replace `any` with specific types, interfaces, or generics where possible. Define missing types in `src/types` or locally as needed. This is crucial for maintainability and preventing runtime errors.

**6. Testing (Implementation):**
    *   **6.1. Setup Vitest:** Confirm Vitest setup (from Phase 1 plan) and configure it properly (e.g., `vitest.config.ts`).
    *   **6.2. Write Unit Tests:** Add unit tests for critical utility functions, refactored service modules (e.g., parts of `AuthService`), platform-specific logic, and complex hooks.
    *   **6.3. Write Integration Tests:** Add basic integration tests for key flows, potentially mocking API calls and browser APIs where necessary.

**7. Final Review & Cleanup:**
    *   **7.1. Run Linters/Formatters:** Execute `npm run lint` and `npm run type-check` again. Ensure Prettier (or another formatter) is configured and run across the codebase.
    *   **7.2. Code Walkthrough:** Perform a final manual review of the changes.
    *   **7.3. Documentation Update:** Update README or internal comments if significant structural changes occurred.

This plan provides a roadmap for the second refactoring phase. I will update the `todo.md` file to reflect these detailed tasks.
