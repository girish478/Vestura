# Security Policy

## Supported versions

Security fixes are applied to the latest `main` branch of this repository.

## Reporting a vulnerability

If you discover a security issue (exposed credentials, injection, unsafe file handling, etc.):

1. **Do not** open a public GitHub issue for sensitive reports.
2. Contact the repository maintainer privately (use GitHub Security Advisories if enabled, or email the maintainer listed on the repository).

Please include steps to reproduce and the potential impact.

## API keys

- Never commit `.env` or real API keys.
- Run production deployments with secrets configured in the host environment, not in source code.
- Rotate keys immediately if they are leaked.
