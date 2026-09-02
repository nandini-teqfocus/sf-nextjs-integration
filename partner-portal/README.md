# Partner Application Portal — Next.js 14 & Salesforce Integration

Enterprise partner application portal built on Next.js 14 App Router, securely embedded inside Salesforce Experience Cloud via Lightning Web Component (LWC) and integrated with Salesforce Apex REST using OAuth 2.0 JWT Bearer Flow.

## Architecture

* **Framework:** Next.js 14 (App Router, Node.js Serverless Runtime)
* **Authentication:** OAuth 2.0 JWT Bearer Flow (RS256 Private Key Assertion)
* **Salesforce Integration:** Apex REST (`/services/apexrest/v1/applications`)
* **Experience Cloud Host:** `nextjsPortalHost` LWC with bidirectional `postMessage` protocol
* **Security:** Field-Level Security (`stripInaccessible`), CSP Trusted Sites, and `frame-ancestors` clickjacking protection
