# 4uStream CSP development fix

- Development now adds `unsafe-eval` to `script-src` so Next.js React Fast Refresh can run under the local CSP.
- Production does not add `unsafe-eval`.
- Existing Admin and security headers are preserved.
- This change is specifically for the localhost development error reported in the browser console.
