# Security Review - TrainPace

**Date:** 2026-02-26
**Scope:** Full codebase security review of the TrainPace React/TypeScript web application
**Repository:** `vite-project/src/`

---

## Executive Summary

TrainPace demonstrates **good foundational security practices** overall — the Gemini API key has been moved server-side, Firebase auth follows standard patterns, form validation uses Zod, and no hardcoded secrets exist in source. However, the review identified **3 critical**, **3 high**, **5 medium**, and **6 low** severity findings that should be addressed in priority order.

---

## Critical Findings

### C1. Open Redirect Vulnerability

**Severity:** CRITICAL
**Files:**
- `src/components/login/Register.tsx` (lines 85-96)
- `src/features/auth/LoginButton.tsx` (lines 20-28)

**Issue:** The `returnTo` URL parameter is used in `navigate()` without validation. An attacker can craft a link that redirects users to a malicious site after login/registration.

**Vulnerable code:**
```typescript
const returnTo = searchParams.get("returnTo");
if (returnTo) {
  navigate(returnTo); // No validation — accepts any URL
}
```

**Attack scenario:**
```
https://trainpace.com/register?returnTo=https://evil.com/phishing
```
After registration, the user is redirected to the attacker's site, which could mimic TrainPace to steal credentials.

**Recommendation:** Validate `returnTo` against an allowlist of internal paths:
```typescript
const isValidRedirect = (path: string): boolean => {
  if (path.startsWith('http') || path.startsWith('//')) return false;
  const allowed = ['/calculator', '/fuel', '/elevation-finder', '/dashboard', '/'];
  return allowed.some(p => path.startsWith(p));
};
```

---

### C2. Missing Firestore Security Rules (Not in Repository)

**Severity:** CRITICAL
**Location:** Firebase Console (no `firestore.rules` file in repo)

**Issue:** No Firestore security rules are version-controlled. All authorization checks are client-side only and can be bypassed by any authenticated user calling Firestore directly via browser DevTools or the Firebase SDK.

**Evidence — client-side-only auth checks in `src/features/dashboard/actions.ts`:**
```typescript
// Lines 24-26 — trivially bypassed
const data = docSnap.data();
if (!data.userId || data.userId !== userId) {
  throw new Error("You are not authorized to delete this route");
}
```

**Impact:** Any authenticated user could potentially read, modify, or delete another user's pace plans, fuel plans, GPX uploads, and bookmarks.

**Recommendation:** Create and deploy Firestore security rules:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /user_pace_plans/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    match /user_fuel_plans/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    match /gpx_uploads/{docId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /user_bookmarks/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /elevation_analysis_cache/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

### C3. Deprecated Client-Side Gemini API Key File Still in Codebase

**Severity:** CRITICAL
**File:** `src/services/gemini-auth.ts` (line 33-34, 84)

**Issue:** This file contains code that sends the Gemini API key directly from the client to Google's API. While not currently imported, it represents a high-risk latent vulnerability — if anyone re-enables it, the API key leaks to every user.

```typescript
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;  // line 33
const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, { ... }); // line 84
```

The type declaration in `src/vite-env.d.ts` (line 4) also still references `VITE_GEMINI_API_KEY`.

**Recommendation:**
1. Delete `src/services/gemini-auth.ts` entirely
2. Remove `VITE_GEMINI_API_KEY` from `src/vite-env.d.ts`

---

## High Severity Findings

### H1. Missing Security Headers in Vercel Configuration

**Severity:** HIGH
**File:** `vite-project/vercel.json`

**Issue:** No security headers are configured. The application is missing:
- **Content-Security-Policy (CSP)** — prevents XSS and data exfiltration
- **X-Frame-Options** — prevents clickjacking
- **X-Content-Type-Options** — prevents MIME sniffing
- **Strict-Transport-Security (HSTS)** — forces HTTPS
- **Referrer-Policy** — limits referrer information leakage
- **Permissions-Policy** — restricts browser features

**Recommendation:** Add a global headers section to `vercel.json`:
```json
{
  "source": "/(.*)",
  "headers": [
    { "key": "X-Frame-Options", "value": "DENY" },
    { "key": "X-Content-Type-Options", "value": "nosniff" },
    { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" },
    { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
    { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
    { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' https://api.mapbox.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://api.mapbox.com; img-src 'self' data: https:; connect-src 'self' https://api.trainpace.com https://*.firebaseio.com https://*.googleapis.com https://api.mapbox.com https://nominatim.openstreetmap.org; frame-ancestors 'none';" }
  ]
}
```

---

### H2. No Protected Routes — Missing Auth Guards

**Severity:** HIGH
**File:** `src/App.tsx`

**Issue:** No routes are protected by authentication guards. Routes like `/dashboard`, `/settings`, and `/elevation-finder/:docId` render for unauthenticated users and rely on individual components to check auth state. This pattern is error-prone.

**Evidence:** `App.tsx` defines all routes as equally accessible:
```tsx
<Route path="/dashboard" element={<DashboardV2 />} />
<Route path="/settings" element={<Settings />} />
```

Individual pages handle their own auth redirects (e.g., `Settings.tsx` line 127-137), but there's no centralized guard.

**Recommendation:** Create a `ProtectedRoute` wrapper component:
```tsx
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return children;
}

// In routes:
<Route path="/dashboard" element={<ProtectedRoute><DashboardV2 /></ProtectedRoute>} />
```

---

### H3. Account Deletion Does Not Clean Up User Data

**Severity:** HIGH
**File:** `src/pages/Settings.tsx` (line 107)

**Issue:** When a user deletes their account, only the Firebase Auth record is removed. All Firestore documents (pace plans, fuel plans, GPX uploads, bookmarks) are orphaned and remain in the database.

```typescript
await deleteUser(user);  // Only deletes auth — Firestore data remains
navigate("/");
```

**Impact:** GDPR/privacy violation — user data persists after account deletion.

**Recommendation:** Implement a Cloud Function triggered on user deletion:
```typescript
exports.onUserDeleted = functions.auth.user().onDelete(async (user) => {
  const userId = user.uid;
  // Delete from user_pace_plans, user_fuel_plans, gpx_uploads, user_bookmarks
});
```
Or batch-delete client-side before calling `deleteUser()`.

---

## Medium Severity Findings

### M1. Mapbox CDN Script Loaded Without Subresource Integrity (SRI)

**File:** `src/components/utils/MapboxRoutePreview.tsx` (lines 47-60)

**Issue:** Mapbox GL JS is loaded dynamically from CDN without integrity checks. A CDN compromise could inject malicious code.

```typescript
script.src = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js";
// Missing: script.integrity and script.crossOrigin
```

**Recommendation:** Add SRI attributes when loading external scripts.

---

### M2. GPX File Upload — XML Parsing Without Entity Restriction

**File:** `src/lib/gpxMetaData.ts` (lines 14-16, 94-96)

**Issue:** `DOMParser` is used to parse uploaded GPX (XML) files. While browser DOMParser is generally safe from XXE attacks, there's no validation for malicious XML content like embedded `<script>` elements or extremely deep nesting that could cause performance issues.

**Recommendation:** Add additional GPX content validation after parsing:
```typescript
if (doc.querySelector("script, object, embed, iframe")) {
  throw new Error("Invalid GPX: contains disallowed elements");
}
```

---

### M3. Client-Side Rate Limiting Only

**File:** `src/components/elevationfinder/GpxUploader.tsx` (lines 122-156)

**Issue:** Upload rate limiting (15/day, 10/hour) is enforced only on the client. Users can bypass it by calling Firestore/Storage APIs directly.

**Recommendation:** Implement server-side rate limiting via Firebase Cloud Functions or backend middleware.

---

### M4. Auth Context Missing Loading State

**File:** `src/features/auth/AuthContext.tsx`

**Issue:** The auth context doesn't distinguish between "still loading" and "not authenticated." This causes brief UI flashes and race conditions where protected content may render momentarily.

```typescript
const [user, setUser] = useState<User | null>(null); // null = loading AND unauthenticated
```

**Recommendation:** Add a `loading` state:
```typescript
const [loading, setLoading] = useState(true);
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    setUser(user);
    setLoading(false);
  });
  return () => unsubscribe();
}, []);
```

---

### M5. Dependency Vulnerabilities (17 total, 6 high)

**Source:** `npm audit` output

Key vulnerable packages:
| Package | Severity | Issue |
|---------|----------|-------|
| `react-router` 7.x | High | XSS via open redirects, CSRF in actions, DoS via cache poisoning |
| `rollup` <4.59.0 | High | Arbitrary file write via path traversal |
| `glob` 10.x | High | ReDoS vulnerability |
| `esbuild` <=0.24.2 | Moderate | Dev server allows any website to send requests |
| `@babel/helpers` | Moderate | Inefficient RegExp complexity |

**Recommendation:** Run `npm audit fix` and update `react-router-dom` to the latest patched version.

---

## Low Severity Findings

### L1. Weak Password Requirements
**File:** `src/components/login/Register.tsx` (line 27)
Only requires 6 characters minimum. NIST recommends 8+ characters minimum.

### L2. Console Logging in Production
**Files:** 75 `console.log/error/warn` calls across 20 files
Some may leak internal details. Consider environment-based log levels.

### L3. Mapbox Token Domain Restrictions
**File:** `src/components/utils/MapboxRoutePreview.tsx` (line 28)
Ensure the Mapbox token is restricted to `trainpace.com` in the Mapbox dashboard.

### L4. Missing Firebase Storage Security Rules
**Location:** Firebase Console (not in repo)
Similar to Firestore rules, Storage security rules should be version-controlled and enforce per-user access.

### L5. API Error Messages May Leak Information
**File:** `src/services/gemini.ts` (lines 147-148)
Backend error details are passed directly to users via `errorData.error || errorData.details`.

### L6. No CSRF Token Handling
Firebase Auth handles CSRF for OAuth flows, but direct Firestore writes have no additional CSRF protection. This is a defense-in-depth concern since CSRF is partially mitigated by SameSite cookies and Firebase SDK handling.

---

## Positive Security Practices Observed

| Practice | Status | Evidence |
|----------|--------|----------|
| No hardcoded secrets | GOOD | All API keys via `import.meta.env` |
| Gemini API key server-side | GOOD | Proxied through `api.trainpace.com` |
| No `dangerouslySetInnerHTML` | GOOD | Not found in codebase |
| No `eval()` / `new Function()` | GOOD | Not found in codebase |
| Zod form validation | GOOD | Register form, race inputs |
| Firebase ID token auth | GOOD | Bearer tokens for API calls |
| Anti-enumeration error messages | GOOD | `Login.tsx` groups auth errors |
| External links sandboxed | GOOD | `rel="noopener noreferrer"` on all |
| GPX file type validation | GOOD | Extension + XML structure checks |
| File size limits | GOOD | 10MB max enforced |
| Duplicate detection | GOOD | SHA-256 hash-based |
| Session storage cleanup | GOOD | Cleared after use |
| Blog content from static JSON | GOOD | No user-generated markdown |
| `.env` files gitignored | GOOD | Lines 9, 26 of `.gitignore` |

---

## Recommended Action Plan

### Immediate (Critical)
1. Fix open redirect in `Register.tsx` and `LoginButton.tsx`
2. Deploy Firestore security rules
3. Delete `gemini-auth.ts` and clean up `vite-env.d.ts`

### Short-term (High)
4. Add security headers to `vercel.json`
5. Add centralized route protection (`ProtectedRoute` component)
6. Implement user data cleanup on account deletion

### Medium-term
7. Add SRI to CDN-loaded scripts
8. Harden GPX XML parsing
9. Move rate limiting server-side
10. Add auth loading state to context
11. Run `npm audit fix` and update vulnerable dependencies

### Ongoing
12. Strengthen password requirements
13. Strip console logs from production builds
14. Restrict Mapbox token to production domains
15. Version-control all Firebase security rules
