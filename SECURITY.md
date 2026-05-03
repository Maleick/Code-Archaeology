# Security Policy

## Reporting A Vulnerability

Please report suspected vulnerabilities through a GitHub private security advisory for this repository. Do not open a public issue for vulnerabilities, secrets, private repository contents, or exploit details.

Include the affected version or commit, a concise reproduction, expected impact, and any relevant sanitized logs. A maintainer will review the advisory and coordinate a fix before public disclosure.

## Safety Model

Code Archaeology is designed to inspect and improve repositories without surprising users:

- `survey` is the default mode and produces reports without changing project files.
- `excavate` produces reports and mock patches without applying changes.
- `restore` can modify code only after review and should be run with tests or type checks available.
- Failed restore phases should be reverted before continuing.
- Runtime state is written to `.archaeology/` and should remain ignored and local.
- Documentation and examples must not include secrets, tokens, credentials, or private code.

The plugin must not remove try/catch blocks around I/O or external input boundaries automatically, and uncertain type replacements should be flagged for human review.
