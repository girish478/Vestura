# Contributing to Virtual AI Try-On

Thank you for your interest in contributing! This document explains how to get started and what to keep in mind.

---

## Getting started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally.
3. Create a new branch from `main` for your changes:
   ```bash
   git checkout -b feat/your-feature-name
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Set up your environment:
   ```bash
   cp .env.example .env
   # Edit .env and add your GEMINI_API_KEY
   ```
6. Start the development server:
   ```bash
   npm run dev
   ```
7. Make your changes and test them.
8. Open a **pull request** against the `main` branch.

---

## Contribution guidelines

### Code quality

- Keep changes focused. One pull request per feature or fix.
- Run `npm run build` before opening a PR to verify the build succeeds.
- Use TypeScript throughout; avoid `any` where possible.
- Keep backend (server-side) and frontend code clearly separated.

### AI providers

This is the most important area to get right:

- **Only add a provider if it genuinely supports virtual try-on**.
  - The provider must accept at least two image inputs (garment + person).
  - The provider must return a single composed image.
  - A generic text-to-image API does not qualify.
- Place all provider code in `server/ai/` under its own file (e.g., `server/ai/replicate.ts`).
- Implement the `TryOnProvider` interface from `server/ai/types.ts`.
- Register the new provider in `server/ai/provider.ts`.
- Document the new provider and its environment variables in `README.md` and `.env.example`.
- Clearly state in the documentation if the provider requires a paid account or has usage limits.

### Security

- **Never commit API keys, tokens, or secrets.**
- Do not log API keys or include them in error messages.
- Keep all AI provider calls server-side; the browser must never receive the private key.
- See `SECURITY.md` for reporting vulnerabilities.

### UI / UX changes

- Keep the try-on workflow as the primary focus.
- Test changes on desktop, tablet, and mobile.
- Maintain accessibility: labels, focus states, keyboard navigation, and sufficient contrast.
- Do not add unnecessary dependencies.

### Commit messages

Use a conventional format where practical:

```
feat: add Replicate VTON provider
fix: handle 429 rate-limit correctly on Gemini provider
docs: update README with Replicate setup instructions
refactor: extract image-resize utility to shared/
```

---

## What makes a great contribution

- A real, tested AI provider integration
- Better image validation or error messages
- Accessibility improvements
- Reproducible bug fixes with a clear description
- Documentation improvements

---

## What to avoid

- Adding "future" or "coming soon" providers that don't work yet
- Removing existing working functionality
- Committing secrets or third-party branding assets
- Adding heavy dependencies without discussion

---

## Reporting issues

Please open a GitHub issue with:

- Steps to reproduce
- Expected behaviour
- Actual behaviour
- Node.js version, OS, and browser (if relevant)

---

## License

By contributing, you agree that your contributions will be licensed under the project's [MIT License](./LICENSE).
