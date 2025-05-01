# Refactoring Plan for Jaydai Chrome Extension

This document outlines the steps for refactoring the Jaydai Chrome Extension codebase (branch v1.0.6).

**Goals:**
- Improve code maintainability.
- Reduce code redundancy.
- Enhance file and folder structure.
- Implement robust multi-site support (ChatGPT, Claude, future sites).
- Introduce automated testing.

**Refactoring Tasks:**

- [ ] **1. Multi-Site Abstraction:**
    - [ ] 1.1. Refactor network interception (`fetchInterceptor.js`, `endpointDetector.js`) to support site-specific configurations (endpoints, request/response handling).
    - [ ] 1.2. Abstract platform detection logic (`detectPlatform` in `insertPrompt.ts`) into a dedicated module.
    - [ ] 1.3. Refactor prompt insertion logic (`insertPrompt.ts`) to use site-specific selectors and methods, managed via a configuration or strategy pattern.
    - [ ] 1.4. Adapt content script initialization (`content.js`, `initializer.ts`, `applicationInitializer.ts`) for potential site-specific logic.
    - [ ] 1.5. Create a dedicated `src/platforms` or `src/sites` directory to house all site-specific code (configurations, selectors, insertion logic, network handlers).

- [ ] **2. Code Structure & Maintainability:**
    - [ ] 2.1. Analyze file sizes and complexity (e.g., services, hooks, large components) and break down large files into smaller, focused modules.
    - [ ] 2.2. Review and potentially reorganize folder structure for better clarity (e.g., moving `injectedInterceptor` if appropriate).
    - [ ] 2.3. Identify and eliminate redundant code patterns (e.g., in API calls, utility functions, component logic).
    - [ ] 2.4. Review and potentially remove legacy code paths (e.g., `sendLegacyEvent` if no longer needed).

- [ ] **3. Componentization:**
    - [ ] 3.1. Review React components for simplification, reusability, and decomposition into smaller units.

- [ ] **4. State Management:**
    - [ ] 4.1. Analyze state management usage (Context, hooks) for consistency and efficiency.

- [ ] **5. Services Layer:**
    - [ ] 5.1. Ensure services (`src/services`) adhere to the Single Responsibility Principle and interactions are clear.
    - [ ] 5.2. Assess the complexity of orchestrator services like `ChatOrchestrator.ts` and refactor if necessary.

- [ ] **6. Error Handling:**
    - [ ] 6.1. Review and ensure consistent, robust error handling across the application, especially for async operations.

- [ ] **7. Testing Setup:**
    - [ ] 7.1. Integrate a testing framework (e.g., Vitest).
    - [ ] 7.2. Write unit tests for critical utility functions, hooks, and services.
    - [ ] 7.3. Write integration tests for key user flows (e.g., prompt insertion, template management).

- [ ] **8. Final Review & Cleanup:**
    - [ ] 8.1. Run linters and formatters.
    - [ ] 8.2. Perform a final code review.
    - [ ] 8.3. Update documentation if necessary.
