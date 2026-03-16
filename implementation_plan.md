# Implementation Plan

## Goal
Build a premium, highly-polished Next.js web application that allows the user to upload contact lists (CSV) and templates (PDF), automatically generates customized emails using the Hack Club AI API (`qwen/qwen3-32b`), and provides a beautiful dashboard to approve, reject, regenerate, or send these emails via a simple Gmail integration.

## Proposed Changes

### 1. Project Infrastructure & Types
- **[NEW]** `src/lib/types.ts`: Define strong TypeScript interfaces for Contacts, EmailDrafts, and API responses to ensure type safety (NO `any` types).
- **[NEW]** `src/lib/utils.ts`: Utility functions for class merging (`clsx`, `tailwind-merge`) to support dynamic UI styling.

### 2. Backend API Routes (Next.js App Router)
- **[NEW]** `src/app/api/generate/route.ts`: Endpoint to communicate with the Hack Club AI API (`https://ai.hackclub.com/proxy/v1/chat/completions`). Handles prompt construction based on templates and contact data.
- **[NEW]** `src/app/api/send/route.ts`: Endpoint using `nodemailer` to send approved emails. Will accept standard Gmail SMTP credentials securely (App Password) from the client or environment to avoid spam flagging while keeping setup simple.

### 3. Frontend UI Components (Glassmorphism & Framer Motion)
- **[MODIFY]** `src/app/globals.css`: Add custom CSS variables for premium gradients, glassmorphism utilities, and sleek dark mode aesthetics.
- **[NEW]** `src/components/Dashboard.tsx`: Main orchestrator component containing the workflow (Setup -> Review -> Sent).
- **[NEW]** `src/components/ConfigurationPanel.tsx`: UI for users to input their Hack Club API Key, Gmail credentials, and upload CSV/PDF files.
- **[NEW]** `src/components/EmailQueue.tsx`: A visually engaging carousel or list (using `framer-motion`) displaying generated drafts.
- **[NEW]** `src/components/EmailCard.tsx`: Individual email draft component with smooth hover effects and action buttons (Approve, Reject, Regenerate, Edit).

### 4. Main Page Integration
- **[MODIFY]** `src/app/page.tsx`: Assemble the components into a cohesive, responsive page with modern typography and dynamic backgrounds.

## Verification Plan
1. **Type Checking & Linting**: Run `npm run lint` and `npx tsc --noEmit` to ensure strict type safety.
2. **Build Test**: Run `npm run build` to verify Next.js production compilation.
3. **Mock Data Testing**: Verify UI states using highly realistic mock data before integrating the live API.
4. **API Integration Test**: Send a test request to the Hack Club AI API using the provided key to ensure valid formatting and response parsing.
5. **SMTP Test**: Test sending a single email to a controlled inbox to confirm Nodemailer setup and Gmail compatibility.