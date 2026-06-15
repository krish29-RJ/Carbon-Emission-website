# Security Architecture

CarbonWise is built with a security-first mindset, ensuring user data privacy and mitigating common web vulnerabilities.

## 1. Authentication & Authorization
*   **Provider**: Supabase Auth (PostgreSQL Row Level Security).
*   **Session Management**: Secure, HttpOnly JWT tokens manage user sessions. The `useAuth` hook explicitly validates session integrity before rendering protected routes.
*   **Row Level Security (RLS)**: Database tables are secured via PostgreSQL RLS policies. Users can only `SELECT`, `INSERT`, or `UPDATE` their own footprint logs and profile data.

## 2. XSS (Cross-Site Scripting) Prevention
*   **React Sanitization**: All user inputs and AI-generated outputs are rendered safely via React's DOM rendering. 
*   **Zero `dangerouslySetInnerHTML`**: We explicitly audited the codebase and removed all unsafe HTML rendering (e.g., in `CoachPage` and Recharts tooltips) to ensure that malicious inputs from external sources cannot execute JavaScript payloads in the user's browser.

## 3. Dependency Security
*   **Continuous Auditing**: We maintain strict dependency versioning. Routine `npm audit` checks are enforced to guarantee 0 high-severity vulnerabilities in the production bundle.
*   **Chunk Splitting**: Production builds are carefully code-split via Vite to prevent bundle pollution and ensure efficient, secure delivery of static assets.

## 4. API & Rate Limiting
*   **Gemini API Security**: AI calls are proxied and managed securely. Prompts are heavily structured to prevent prompt injection attacks or malicious jailbreaks by end-users.
