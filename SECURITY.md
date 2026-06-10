# Security Policy

## Supported Versions
| Version | Supported |
|---------|-----------|
| 0.x     | ✅        |

## Reporting a Vulnerability
If you discover a security vulnerability in kiwa, please report it privately so
we can address it before public disclosure.

### How to report
Please **do not** open a public GitHub Issue for security vulnerabilities.
Instead, contact the maintainer directly:
- Open a private security advisory at https://github.com/cardene777/kiwa/security/advisories/new (preferred)
- DM the maintainer on X at https://x.com/cardene777 (for initial coordination only; do not include sensitive payloads)
- Or email the maintainer (see GitHub profile for current contact)

### What to include
- Description of the vulnerability
- Steps to reproduce
- Potential impact (for example, RCE, data exposure, or supply chain attack)
- Suggested mitigation (if any)

### Response timeline
- Acknowledgment within 48 hours
- Initial assessment within 7 days
- Fix targeted within 30 days for high-severity issues

## Scope
This policy applies to:
- `@kiwa/core` (npm package)
- `@kiwa/cli` (npm package)
- The kiwa GitHub repository
Out of scope:
- Vulnerabilities in upstream dependencies (`anvil` / `viem` / Playwright) - report to those projects directly
- Issues with end-user contracts tested via kiwa

## Disclosure
Once a fix is released, we will:
- Publish a GitHub Security Advisory
- Include a CVE if appropriate
- Credit the reporter (unless anonymity is requested)
