# Goal
Implement support for managing multiple email templates in the Hackpilot Mailer UI.

# Proposed Changes
- [MODIFY] `src/app/page.tsx`: 
  - Replace static `PREDEFINED_TEMPLATES` with a dynamic `templates` state array of objects (`{ id, name, content }`).
  - Add a `selectedTemplateId` state to track which template is active or if "AUTO" is selected.
  - Update the "Campaign Template" UI section to include an inline template manager (Add, Rename, Edit Content, Delete).
  - Modify prompt construction logic to safely use either the selected template or a combined string of all templates for "AUTO".
  - Ensure persistence of `templates` and `selectedTemplateId` using `localStorage`.

# Verification Plan
- `npm run build` to verify there are no TypeScript or Next.js build errors.
- Ensure the prompt generation continues to behave correctly based on whether "AUTO" or a specific template ID is chosen.