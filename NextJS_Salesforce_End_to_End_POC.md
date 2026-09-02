# Next.js + Salesforce Experience Cloud — End-to-End POC

## Project

**Partner Application & Case Tracking Portal**

## Goal

Build a complete Proof of Concept demonstrating how a **Next.js 14 App Router application** can be securely embedded inside **Salesforce Experience Cloud** through an iframe and communicate with Salesforce through **Apex REST**.

The POC must cover the complete integration lifecycle:

- Salesforce data model
- Apex REST APIs
- Apex security and FLS
- Salesforce Connected App
- OAuth 2.0 JWT Bearer Flow
- Next.js 14 App Router
- Server Components
- Client Components
- Route Handlers
- Server-side Salesforce API client
- iframe embedding
- `postMessage` communication
- CSP and `frame-ancestors`
- CRUD operations
- Filtering
- Dynamic iframe resizing
- Error handling
- Token caching
- Debouncing
- Local development
- Deployment considerations
- End-to-end manual testing

---

# 1. Business Use Case

The organization has external partners who need to submit and track applications.

Salesforce is the **system of record**, while Next.js provides a modern partner-facing UI.

A partner should be able to:

1. Log in to Salesforce Experience Cloud.
2. Open the Partner Application Portal.
3. View application records.
4. Filter applications by status.
5. Submit a new application.
6. See the newly created application.
7. Receive success/error feedback.
8. Navigate between Next.js pages while remaining inside Experience Cloud.

The integration must ensure that:

- Salesforce credentials are never exposed in the browser.
- The Next.js private key remains server-side.
- Salesforce sharing and FLS are enforced.
- Cross-origin communication is validated.
- Only approved Salesforce domains can embed the Next.js application.
- Only the trusted Next.js origin can send messages to the Salesforce LWC.

---

# 2. High-Level Architecture

```text
                         SALESFORCE EXPERIENCE CLOUD
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   Experience Cloud Page                                          │
│          │                                                       │
│          ▼                                                       │
│   ┌───────────────────────┐                                     │
│   │ nextjsPortalHost LWC  │                                     │
│   └───────────┬───────────┘                                     │
│               │                                                  │
│               │ Secure iframe                                   │
│               ▼                                                  │
│   ┌─────────────────────────────────────────┐                    │
│   │            Next.js 14 App               │                    │
│   │                                         │                    │
│   │  Server Components                      │                    │
│   │  Client Components                      │                    │
│   │  SalesforceContextSync                  │                    │
│   │  Applications UI                        │                    │
│   │                                         │                    │
│   │             /api/*                      │                    │
│   └───────────────────┬─────────────────────┘                    │
│                       │                                          │
└───────────────────────┼──────────────────────────────────────────┘
                        │
                        │ Server-to-server HTTPS
                        ▼
             ┌─────────────────────────────┐
             │ Salesforce OAuth 2.0        │
             │ JWT Bearer Flow             │
             └─────────────┬───────────────┘
                           │
                           ▼
             ┌─────────────────────────────┐
             │ Salesforce Apex REST        │
             │ /services/apexrest/v1/...   │
             └─────────────┬───────────────┘
                           │
                           ▼
             ┌─────────────────────────────┐
             │ Security / Sharing / FLS    │
             └─────────────┬───────────────┘
                           │
                           ▼
             ┌─────────────────────────────┐
             │ Partner_Application__c      │
             └─────────────────────────────┘
```

---

# 3. Actors

## 3.1 Partner User

External Experience Cloud user.

Can:

- View applications
- Filter applications
- Submit applications
- View application status

## 3.2 Salesforce

Acts as:

- System of record
- OAuth authorization server
- Apex REST provider
- Security enforcement layer
- Experience Cloud host

## 3.3 Next.js

Acts as:

- Partner portal frontend
- Server-side integration layer
- Salesforce API proxy
- Cross-origin iframe application

## 3.4 Salesforce LWC

Acts as:

- Next.js iframe host
- Salesforce/Next.js communication bridge
- Salesforce-side UI integration layer

---

# 4. Salesforce Data Model

Create a custom object:

## `Partner_Application__c`

| Field | Type | Purpose |
|---|---|---|
| `Applicant_Name__c` | Text (255) | Applicant/partner name |
| `Email__c` | Email | Applicant email |
| `Status__c` | Picklist | Application lifecycle |
| `Requested_Amount__c` | Currency (18,2) | Requested amount |
| `Notes__c` | Long Text Area (32768) | Application details |
| `Account__c` | Lookup(Account) | Related Salesforce Account |

### Status Values

```text
New
Under Review
Approved
Rejected
```

---

# 5. Salesforce Security Model

The POC must demonstrate Salesforce security.

## Record-Level Security

Use:

```apex
global with sharing class PartnerApplicationRestResource
```

This ensures record-level sharing rules are respected.

## Field-Level Security

For reads:

```apex
Security.stripInaccessible(
    AccessType.READABLE,
    records
);
```

For creates:

```apex
Security.stripInaccessible(
    AccessType.CREATABLE,
    records
);
```

The objective is to ensure that fields unavailable to the running user are not exposed or written.

---

# 6. Apex REST API

Create:

```text
PartnerApplicationRestResource.cls
```

Endpoint:

```text
/services/apexrest/v1/applications
```

Use:

```apex
@RestResource(urlMapping='/v1/applications/*')
global with sharing class PartnerApplicationRestResource
```

---

# 7. GET Applications

## Endpoint

```http
GET /services/apexrest/v1/applications
```

## Optional Filter

```http
GET /services/apexrest/v1/applications?status=New
```

## Expected Query

```sql
SELECT
    Id,
    Name,
    Applicant_Name__c,
    Email__c,
    Status__c,
    Requested_Amount__c,
    Notes__c,
    CreatedDate,
    LastModifiedDate
FROM Partner_Application__c
ORDER BY CreatedDate DESC
LIMIT 100
```

## Expected Response

```json
[
  {
    "Id": "a01XXXXXXXXXXXX",
    "Applicant_Name__c": "ABC Partner",
    "Email__c": "partner@example.com",
    "Status__c": "New",
    "Requested_Amount__c": 50000,
    "Notes__c": "POC application"
  }
]
```

---

# 8. POST Application

## Endpoint

```http
POST /services/apexrest/v1/applications
```

## Request

```json
{
  "applicantName": "ABC Partner",
  "email": "partner@example.com",
  "requestedAmount": 50000,
  "notes": "Application submitted through Partner Portal"
}
```

## Salesforce Processing

```text
JSON Request
    ↓
Deserialize Payload
    ↓
Validate Input
    ↓
Create Partner_Application__c
    ↓
Set Status = New
    ↓
stripInaccessible(CREATABLE)
    ↓
Insert
    ↓
Return Record ID
```

## Expected Response

```json
{
  "success": true,
  "recordId": "a01XXXXXXXXXXXX"
}
```

HTTP status:

```text
201 Created
```

---

# 9. Apex Error Handling

GET failure:

```text
HTTP 500
```

POST validation/processing failure:

```text
HTTP 400
```

Example:

```json
{
  "error": "Invalid application data"
}
```

The API must never expose unnecessary internal implementation details in production.

---

# 10. Apex Test Class

Create:

```text
PartnerApplicationRestResourceTest.cls
```

The test class must cover:

- GET all applications
- GET filtered applications
- POST application
- Record creation
- Status defaults to `New`
- Invalid POST payload
- Exception handling
- Security-related behavior where practical

Target:

```text
75%+ code coverage
```

Also verify the actual API response status codes and JSON response structures.

---

# 11. Salesforce Connected App

Create a Salesforce Connected App for server-to-server authentication.

Configure:

- OAuth
- JWT Bearer authentication
- Certificate/public key
- Integration user
- Appropriate OAuth scopes

The Connected App provides the client ID and validates the JWT signature.

---

# 12. OAuth 2.0 JWT Bearer Flow

The authentication architecture must be:

```text
Next.js Server
      │
      │ Private Key
      ▼
Create Signed JWT
      │
      │ iss = Client ID
      │ sub = Integration User
      │ aud = Salesforce Login URL
      ▼
Salesforce OAuth Token Endpoint
      │
      ▼
Access Token
      │
      ▼
Apex REST API
```

## Critical Security Requirement

The private key must never be available to:

- Browser
- Client Components
- JavaScript bundle
- HTML
- URL parameters
- `postMessage`

It must remain server-side.

---

# 13. Next.js Project

Create a Next.js 14 application using the App Router.

Recommended structure:

```text
partner-portal/
│
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   │
│   ├── applications/
│   │   ├── page.tsx
│   │   └── new/
│   │       └── page.tsx
│   │
│   └── api/
│       └── applications/
│           └── route.ts
│
├── components/
│   ├── SalesforceContextSync.tsx
│   │
│   └── applications/
│       ├── ApplicationTable.tsx
│       ├── ApplicationForm.tsx
│       └── FilterPanel.tsx
│
├── lib/
│   ├── salesforceClient.ts
│   └── permissions.ts
│
├── types/
│   └── portal.ts
│
├── next.config.mjs
├── package.json
└── .env.local
```

---

# 14. Next.js App Router Concepts

Demonstrate:

```text
app/page.tsx
```

→ Dashboard

```text
app/applications/page.tsx
```

→ Applications

```text
app/applications/new/page.tsx
```

→ New Application

```text
app/api/applications/route.ts
```

→ API endpoint

The POC must demonstrate that Next.js App Router uses the application folder structure to define routes.

---

# 15. Server Components

Use Server Components for:

- Server-side rendering
- Server-side data access where appropriate
- Non-interactive UI
- Logic that should never reach the browser

Example conceptual flow:

```text
Server Component
      ↓
Server-side function
      ↓
Salesforce client
      ↓
Salesforce API
```

Do not place Salesforce private credentials inside Client Components.

---

# 16. Client Components

Use Client Components for:

- Forms
- `useState`
- Button interactions
- Filters
- Browser events
- `postMessage`
- Dynamic UI behavior

Example:

```text
ApplicationForm.tsx
FilterPanel.tsx
SalesforceContextSync.tsx
```

---

# 17. Next.js Route Handler

Create:

```text
app/api/applications/route.ts
```

The Route Handler acts as the backend boundary between the browser and Salesforce.

Architecture:

```text
Browser
   ↓
/api/applications
   ↓
Next.js Route Handler
   ↓
salesforceClient.ts
   ↓
Salesforce
```

The browser must not directly call the Salesforce Apex REST endpoint.

---

# 18. Salesforce Client

Create:

```text
lib/salesforceClient.ts
```

Responsibilities:

- Generate JWT
- Request OAuth token
- Cache access token
- Call Salesforce Apex REST
- Handle HTTP failures
- Serialize/deserialize responses

Conceptual functions:

```text
getSalesforceAccessToken()
getApplications()
createApplication()
```

---

# 19. Environment Configuration

Use server-side environment variables.

Example:

```text
SF_CLIENT_ID=
SF_USERNAME=
SF_LOGIN_URL=
SF_PRIVATE_KEY=
SF_API_VERSION=
```

Never expose these through:

```text
NEXT_PUBLIC_*
```

The private key must remain server-side.

---

# 20. Salesforce Portal LWC

Create:

```text
nextjsPortalHost
```

Files:

```text
nextjsPortalHost.html
nextjsPortalHost.js
nextjsPortalHost.css
nextjsPortalHost.js-meta.xml
```

The LWC embeds Next.js:

```html
<iframe
    class="nextjs-iframe"
    src={iframeUrl}
    allow="clipboard-write; camera; geolocation">
</iframe>
```

---

# 21. Dynamic iframe URL

The LWC should construct the URL with required Salesforce context.

Conceptually:

```text
https://nextjs-app.com/applications
    ?sfUserId=<Salesforce User ID>
    &origin=<Salesforce Origin>
```

Do not put secrets or Salesforce access tokens in the URL.

---

# 22. postMessage Communication

The POC must implement two-way communication.

## Salesforce → Next.js

```text
Salesforce LWC
      ↓
postMessage()
      ↓
Next.js iframe
```

## Next.js → Salesforce

```text
Next.js iframe
      ↓
window.parent.postMessage()
      ↓
Salesforce LWC
```

---

# 23. postMessage Security

Never use:

```javascript
targetOrigin = "*"
```

Use a specific trusted origin.

Receiver must validate:

```javascript
event.origin
```

and:

```javascript
event.data.source
```

Expected source:

```text
NEXTJS_APP
```

Example message:

```json
{
  "source": "NEXTJS_APP",
  "type": "SHOW_TOAST",
  "payload": {
    "title": "Application Submitted",
    "message": "Application created successfully",
    "variant": "success"
  }
}
```

---

# 24. Supported Message Types

## `SHOW_TOAST`

Purpose:

Display a Salesforce toast.

```text
Next.js
   ↓
SHOW_TOAST
   ↓
Salesforce LWC
   ↓
ShowToastEvent
```

## `RESIZE_HEIGHT`

Purpose:

Resize the Salesforce iframe.

```json
{
  "source": "NEXTJS_APP",
  "type": "RESIZE_HEIGHT",
  "payload": {
    "height": 1200
  }
}
```

## `NAVIGATION_CHANGE`

Purpose:

Notify Salesforce when Next.js route changes.

```json
{
  "source": "NEXTJS_APP",
  "type": "NAVIGATION_CHANGE",
  "payload": {
    "path": "/applications/new"
  }
}
```

---

# 25. Dashboard

Create:

```text
/
```

Dashboard should show:

```text
Partner Application Portal

Total Applications
New
Under Review
Approved
Rejected

[View Applications]
[Submit New Application]
```

The dashboard should use Salesforce data.

---

# 26. Applications Page

Create:

```text
/applications
```

UI:

```text
Applications

Status:
[ All ▼ ]

------------------------------------------------
Applicant      Email        Amount       Status
------------------------------------------------
ABC Partner   abc@test.com  $50,000      New
XYZ Partner   xyz@test.com  $25,000      Approved
DEF Partner   def@test.com  $75,000      Under Review
------------------------------------------------

[Submit New Application]
```

---

# 27. Application Filtering

Supported filters:

```text
All
New
Under Review
Approved
Rejected
```

Example:

```text
GET /api/applications?status=Approved
```

The Next.js Route Handler forwards the appropriate filter to Apex REST.

---

# 28. New Application Page

Create:

```text
/applications/new
```

Form:

```text
Submit Partner Application

Applicant Name *
[________________________]

Email *
[________________________]

Requested Amount *
[________________________]

Notes
[________________________]

[Submit Application]
```

The form must be a Client Component.

---

# 29. Client-Side Validation

Validate:

- Required applicant name
- Valid email
- Positive requested amount
- Notes length
- Invalid/empty payloads

Validation should happen before the API request.

Server-side validation must still be performed.

---

# 30. Application Creation Flow

```text
User submits form
        ↓
Client validation
        ↓
POST /api/applications
        ↓
Next.js Route Handler
        ↓
Server validation
        ↓
JWT authentication
        ↓
Apex REST
        ↓
FLS validation
        ↓
INSERT Partner_Application__c
        ↓
201 Created
        ↓
Return record ID
        ↓
Next.js success state
        ↓
SHOW_TOAST → Salesforce
        ↓
Navigate to /applications
```

---

# 31. Dynamic iframe Height

The Next.js application should detect content height and notify Salesforce.

```text
Next.js Content
      ↓
Calculate height
      ↓
postMessage(RESIZE_HEIGHT)
      ↓
Salesforce LWC
      ↓
iframe.style.height
```

Test with:

- Dashboard
- Application table
- New Application form
- Validation errors
- Long content

---

# 32. Salesforce CSP

Configure Salesforce CSP Trusted Sites.

Add the Next.js domain:

```text
https://your-nextjs-app.example.com
```

Context:

```text
Communities
```

Required directives:

```text
frame-src
connect-src
img-src
style-src
font-src
```

---

# 33. Next.js CSP

Configure `next.config.mjs`.

The application should restrict embedding through:

```text
Content-Security-Policy:
frame-ancestors 'self'
https://*.salesforce.com
https://*.force.com
https://*.my.site.com
```

The objective is:

```text
Salesforce CSP
    ↓
Controls what Salesforce can load

Next.js frame-ancestors
    ↓
Controls who can embed Next.js
```

---

# 34. Permissions

Create:

```text
lib/permissions.ts
```

Use it for role/feature-based behavior.

Examples:

```text
CAN_VIEW_APPLICATIONS
CAN_CREATE_APPLICATION
CAN_VIEW_AMOUNT
CAN_VIEW_NOTES
```

Permissions should not replace Salesforce authorization. Salesforce remains the final enforcement layer.

---

# 35. TypeScript Models

Create:

```text
types/portal.ts
```

Example:

```typescript
export interface PartnerApplication {
  id: string;
  applicantName: string;
  email: string;
  status: string;
  requestedAmount: number;
  notes?: string;
}
```

Keep the Next.js models aligned with the Salesforce API response.

---

# 36. Error Handling

The UI must handle:

### Network failure

```text
Unable to connect to the server.
```

### Salesforce authentication failure

```text
Unable to authenticate with Salesforce.
```

### Salesforce API failure

```text
Unable to load applications.
```

### Validation failure

```text
Please correct the highlighted fields.
```

### Unauthorized action

```text
You do not have permission to perform this action.
```

---

# 37. OAuth Token Caching

Do not request a new Salesforce token for every API request.

Use:

```text
First API request
      ↓
Generate JWT
      ↓
Salesforce token
      ↓
Cache token
```

Subsequent calls:

```text
API request
      ↓
Cached access token
      ↓
Salesforce
```

Refresh the token when required.

The POC should demonstrate that token caching reduces unnecessary authentication calls.

---

# 38. Debouncing

For heavy/live inputs:

```text
User input
    ↓
300–500 ms debounce
    ↓
API request
```

Use this for:

- Live filters
- Search
- Autosave scenarios

Do not make an API request for every keystroke.

---

# 39. Local Development

Start Next.js:

```bash
npm run dev
```

Expected:

```text
http://localhost:3000
```

Expose the application:

```bash
npx localtunnel --port 3000
```

or:

```bash
ngrok http 3000
```

Use the HTTPS tunnel URL in Salesforce.

---

# 40. Local E2E Architecture

```text
Developer Machine
       │
       ▼
Next.js :3000
       │
       ▼
ngrok / localtunnel
       │
       ▼
HTTPS Public URL
       │
       ▼
Salesforce CSP
       │
       ▼
Experience Cloud
       │
       ▼
LWC
       │
       ▼
Next.js iframe
```

---

# 41. End-to-End Business Journey

The final demonstration should follow this exact scenario.

```text
1. Partner logs into Experience Cloud
                  ↓
2. Opens Partner Application Portal
                  ↓
3. Salesforce loads nextjsPortalHost
                  ↓
4. LWC loads Next.js iframe
                  ↓
5. Next.js initializes context
                  ↓
6. Secure postMessage communication
                  ↓
7. Dashboard loads
                  ↓
8. Applications are requested
                  ↓
9. Next.js Route Handler receives request
                  ↓
10. Next.js authenticates using JWT
                  ↓
11. Salesforce returns OAuth access token
                  ↓
12. Next.js calls Apex REST
                  ↓
13. Apex enforces sharing and FLS
                  ↓
14. Salesforce returns application records
                  ↓
15. Next.js displays applications
                  ↓
16. Partner filters by status
                  ↓
17. Partner opens New Application
                  ↓
18. Partner submits form
                  ↓
19. Next.js validates request
                  ↓
20. POST /api/applications
                  ↓
21. Next.js → Apex REST
                  ↓
22. Salesforce creates record
                  ↓
23. Status = New
                  ↓
24. Record ID returned
                  ↓
25. Next.js shows success
                  ↓
26. Next.js sends SHOW_TOAST
                  ↓
27. Salesforce displays toast
                  ↓
28. Next.js sends RESIZE_HEIGHT
                  ↓
29. Salesforce resizes iframe
                  ↓
30. Partner sees newly created application
```

---

# 42. Manual Testing Plan

## Test Case 1 — Experience Cloud Loading

### Steps

1. Log in to Experience Cloud.
2. Open the Partner Portal page.
3. Verify the LWC loads.
4. Verify the Next.js iframe loads.

### Expected Result

Next.js loads successfully inside Experience Cloud.

---

## Test Case 2 — Next.js Routing

### Steps

Navigate:

```text
/
/applications
/applications/new
```

### Expected Result

All routes load correctly inside the iframe.

---

## Test Case 3 — Dashboard Data

### Steps

1. Open Dashboard.
2. Check application statistics.

### Expected Result

Statistics are based on Salesforce data.

---

## Test Case 4 — GET Applications

### Steps

1. Open Applications.
2. Inspect browser Network tab.
3. Verify `/api/applications`.
4. Verify the Next.js server calls Salesforce.

### Expected Result

Application records are displayed.

---

## Test Case 5 — Status Filtering

### Steps

1. Select `Approved`.
2. Inspect request.
3. Verify the status query parameter.

### Expected Result

Only Approved records are displayed.

---

## Test Case 6 — Create Application

### Input

```text
Applicant Name: Test Partner
Email: test@example.com
Requested Amount: 50000
Notes: POC testing
```

### Expected Result

- Form submits successfully.
- Salesforce record is created.
- Status is `New`.
- Record ID is returned.
- Success message appears.
- Application appears in the list.

---

# 43. Security Testing

## Test Case 7 — Private Key Exposure

### Steps

1. Open browser DevTools.
2. Inspect Network requests.
3. Search loaded JavaScript for private key/configuration.
4. Inspect page source.

### Expected Result

Private key and server credentials are never exposed.

---

## Test Case 8 — postMessage Origin

### Steps

Send a message from an unauthorized origin.

### Expected Result

Salesforce ignores the message.

---

## Test Case 9 — postMessage Source

Send:

```json
{
  "source": "MALICIOUS_APP",
  "type": "SHOW_TOAST"
}
```

### Expected Result

Salesforce ignores the message.

---

## Test Case 10 — Wildcard Origin

Review implementation.

### Expected Result

No production `postMessage` call uses:

```text
*
```

as the target origin.

---

## Test Case 11 — FLS

### Steps

1. Remove field access for a test user.
2. Request application data.

### Expected Result

Unauthorized fields are removed from the response.

---

## Test Case 12 — Sharing

### Steps

1. Restrict access to application records.
2. Query applications using the integration/security context.

### Expected Result

Only records allowed by Salesforce security are returned.

---

# 44. CSP Testing

## Test Case 13 — Salesforce CSP

### Steps

1. Remove Next.js domain from CSP Trusted Sites.
2. Reload Experience Cloud.

### Expected Result

Next.js resources/iframe fail according to the CSP restriction.

Restore the domain.

### Expected Result

Application loads successfully.

---

## Test Case 14 — frame-ancestors

Attempt to embed the Next.js application from an unauthorized parent domain.

### Expected Result

Browser prevents the unauthorized embedding.

---

# 45. OAuth Testing

## Test Case 15 — JWT Authentication

Verify:

```text
Next.js Server
   ↓
JWT
   ↓
Salesforce OAuth
   ↓
Access Token
   ↓
Apex REST
```

### Expected Result

Salesforce APIs work without passing a Salesforce username/password through the application.

---

## Test Case 16 — Token Caching

### Steps

1. Make multiple API calls.
2. Inspect server logs.
3. Track token acquisition.

### Expected Result

The same valid access token is reused until refresh is required.

---

# 46. Error Testing

## Test Case 17 — Invalid Form

Submit an empty form.

### Expected Result

Client-side validation prevents submission.

---

## Test Case 18 — Invalid API Payload

Send malformed JSON.

### Expected Result

API returns an appropriate `400` response.

---

## Test Case 19 — Salesforce API Failure

Simulate an Apex/Salesforce failure.

### Expected Result

Next.js displays a meaningful error state rather than crashing.

---

# 47. iframe Testing

## Test Case 20 — Dynamic Height

Test:

```text
Dashboard
Applications
New Application
Validation errors
Long notes/content
```

### Expected Result

iframe height adjusts according to Next.js content.

---

# 48. Performance Testing

Verify:

- OAuth token caching
- Debounced filters
- Maximum API records
- No unnecessary requests
- No repeated authentication
- Reasonable page load time

The Apex GET endpoint should enforce a reasonable result limit.

---

# 49. Production Pitfalls to Avoid

## 49.1 Do Not Expose Private Keys

Never place private keys in client-side code.

## 49.2 Do Not Use Wildcard postMessage Origins

Avoid:

```javascript
postMessage(message, "*")
```

## 49.3 Validate Incoming Messages

Always verify:

```text
event.origin
event.data.source
event.data.type
```

## 49.4 Enforce Salesforce Security

Use:

```text
with sharing
stripInaccessible()
```

or the appropriate modern Salesforce security mechanism.

## 49.5 Cache OAuth Tokens

Avoid generating a new token for every API call.

## 49.6 Debounce Heavy Inputs

Use approximately:

```text
300–500 ms
```

for live inputs.

## 49.7 Avoid Putting Secrets in URLs

Do not send:

```text
client secret
private key
access token
```

through iframe query parameters.

---

# 50. Deployment Considerations

## Salesforce

Deploy:

```text
Partner_Application__c
PartnerApplicationRestResource.cls
PartnerApplicationRestResourceTest.cls
nextjsPortalHost
Connected App configuration
Certificate
Permission Sets
CSP Trusted Site
Experience Cloud configuration
```

## Next.js

Deploy:

```text
Next.js application
Environment variables
CSP configuration
Server-side Salesforce client
JWT authentication
API Route Handlers
```

---

# 51. Definition of Done

The POC is complete when all of the following work:

### Salesforce

- [ ] Custom object created
- [ ] Fields configured
- [ ] Permission model configured
- [ ] Apex REST implemented
- [ ] Apex tests written
- [ ] Connected App configured
- [ ] Certificate configured
- [ ] JWT authentication working
- [ ] CSP Trusted Site configured
- [ ] Experience Cloud page created
- [ ] LWC deployed

### Next.js

- [ ] Next.js 14 App Router configured
- [ ] Dashboard implemented
- [ ] Applications page implemented
- [ ] New Application page implemented
- [ ] Server Components demonstrated
- [ ] Client Components demonstrated
- [ ] Route Handler implemented
- [ ] Salesforce client implemented
- [ ] JWT authentication implemented
- [ ] Token caching implemented
- [ ] TypeScript models implemented
- [ ] Permission/feature logic implemented
- [ ] postMessage implemented
- [ ] iframe resizing implemented
- [ ] Error handling implemented
- [ ] CSP configured

### Integration

- [ ] Next.js successfully embedded in Experience Cloud
- [ ] GET applications works
- [ ] Filtering works
- [ ] POST application works
- [ ] Salesforce record is created
- [ ] Success toast works
- [ ] Navigation communication works
- [ ] Dynamic iframe height works

### Security

- [ ] Private key is server-only
- [ ] Access token is server-only
- [ ] postMessage origin validation works
- [ ] Message source validation works
- [ ] Salesforce sharing enforced
- [ ] FLS enforced
- [ ] CSP tested
- [ ] frame-ancestors tested
- [ ] Unauthorized embedding blocked

### Testing

- [ ] Functional testing completed
- [ ] Authentication testing completed
- [ ] Authorization testing completed
- [ ] Security testing completed
- [ ] Error testing completed
- [ ] iframe testing completed
- [ ] Performance testing completed
- [ ] End-to-end business journey completed

---

# 52. Final Demonstration Script

For the final POC demo, demonstrate the following sequence:

```text
1. Show Salesforce Experience Cloud.
2. Open Partner Application Portal.
3. Show Next.js loading inside the LWC iframe.
4. Explain App Router routes.
5. Open Dashboard.
6. Show Salesforce-backed application statistics.
7. Open Applications.
8. Show GET → Next.js Route Handler → Apex REST.
9. Apply Status filter.
10. Show filtered Salesforce records.
11. Open New Application.
12. Explain Client Component.
13. Submit an application.
14. Show POST → Route Handler → JWT → Apex REST.
15. Show newly created Salesforce record.
16. Show Salesforce status = New.
17. Demonstrate SHOW_TOAST.
18. Demonstrate RESIZE_HEIGHT.
19. Demonstrate NAVIGATION_CHANGE.
20. Explain JWT Bearer Flow.
21. Explain server-only private key.
22. Demonstrate token caching.
23. Demonstrate FLS.
24. Demonstrate sharing.
25. Demonstrate postMessage origin validation.
26. Demonstrate Salesforce CSP.
27. Demonstrate Next.js frame-ancestors.
28. Demonstrate an error scenario.
29. Review local development setup.
30. Conclude with the complete architecture.
```

---

# 53. Expected Final Outcome

At the end of the POC, you should have proven the following:

```text
                 ┌──────────────────────┐
                 │ Salesforce Experience│
                 │       Cloud          │
                 └──────────┬───────────┘
                            │
                         iframe
                            │
                            ▼
                 ┌──────────────────────┐
                 │      Next.js 14      │
                 │    App Router        │
                 └──────────┬───────────┘
                            │
                       Route Handler
                            │
                            ▼
                 ┌──────────────────────┐
                 │ JWT Bearer OAuth     │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │     Apex REST        │
                 └──────────┬───────────┘
                            │
                    Sharing + FLS
                            │
                            ▼
                 ┌──────────────────────┐
                 │ Partner_Application  │
                 │       __c            │
                 └──────────────────────┘
```

The final result should demonstrate a **secure, server-mediated Next.js + Salesforce Experience Cloud integration**, rather than a direct browser-to-Salesforce connection.

---

# 54. Learning Outcomes

After completing this POC, you should be able to explain and implement:

1. How Next.js App Router works.
2. Difference between Server and Client Components.
3. Next.js Route Handlers.
4. Server-side API proxy architecture.
5. Salesforce Apex REST.
6. Salesforce Connected Apps.
7. OAuth 2.0 JWT Bearer Flow.
8. Salesforce FLS and sharing.
9. Cross-origin iframe communication.
10. `window.postMessage`.
11. `event.origin` validation.
12. CSP Trusted Sites.
13. `frame-ancestors`.
14. Salesforce LWC as an iframe host.
15. Dynamic iframe resizing.
16. Next.js/Salesforce CRUD integration.
17. Server-side secret management.
18. OAuth token caching.
19. Debouncing.
20. Local tunneling.
21. End-to-end integration testing.
22. Security testing.
23. Production integration considerations.

---

# 55. POC Completion Statement

**The POC will be considered successful when a partner can use a Next.js-based application embedded inside Salesforce Experience Cloud to securely view, filter, and create Salesforce Partner Application records, while authentication, authorization, FLS, iframe security, cross-origin communication, CSP, server-side secret management, and end-to-end integration behavior are all demonstrated and manually verified.**
