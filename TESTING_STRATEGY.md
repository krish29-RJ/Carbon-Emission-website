# Testing Strategy: CarbonWise

To ensure a flawless user experience and robust functionality, CarbonWise employs an aggressive and comprehensive testing strategy using `Vitest` and `React Testing Library`.

## 📊 Coverage Metrics
We maintain an exceptionally high standard for code coverage to guarantee that core logic, rendering paths, and user interactions are fully verified.

| Metric | Target | Current Coverage |
| :--- | :--- | :--- |
| **Statements** | 95.0% | **95.78%** |
| **Branches** | 80.0% | **84.96%** |
| **Functions** | 95.0% | **96.00%** |
| **Lines** | 95.0% | **96.94%** |

## 🧪 Test Suites

### 1. Core Logic & Utilities (`src/lib/*.test.ts`)
*   **Calculator Engine (`calculator.test.ts`)**: Verifies accurate mathematical computation of carbon emissions across all categories (Transport, Energy, Diet, Consumption) based on strict scientific multipliers.
*   **Utility Functions (`utils.test.ts`)**: Ensures Tailwind class merging and formatting helpers behave deterministically.

### 2. Component Testing (`src/components/*.test.tsx`)
*   **State & Interaction**: Every major UI component (e.g., `AppNavbar`, `RecommendationCard`, `StatCard`) is tested for user interaction. E.g., clicking the mobile menu button successfully toggles the navigation drawer.
*   **Edge Cases & Error Handling**: The `ErrorBoundary` component is explicitly tested to ensure it catches React rendering errors and displays the correct fallback UI.
*   **Asynchronous Behavior**: Components relying on Supabase data fetching are fully mocked using `vi.mock` to simulate successful payloads, network failures, and loading states without hitting the live database.

### 3. Page Level Integration (`src/pages/*.test.tsx`)
*   **Routing Integration**: Uses `MemoryRouter` to test that authenticated and unauthenticated paths render the correct layouts.
*   **Layout Verification**: Ensures the `AuthLayout` properly redirects users based on session state.

## 🛠️ Execution

Tests are executed locally and via CI/CD pipelines before deployment.

```bash
# Run all tests
npm run test

# Generate detailed coverage report
npm run test -- --coverage
```
