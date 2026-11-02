# TRL Web App — Training & Recipe LMS

Mobile-first Next.js 16 web app (installable PWA) built on the Vuexy MUI starter kit. It talks to
the Express API in `../trl-backend`.

## Setup

```bash
pnpm install
cp .env.example .env     # NEXT_PUBLIC_API_URL must point at the API, e.g. http://localhost:8020/api
pnpm dev                 # http://localhost:3020
```

`pnpm build && pnpm start` runs the production build on port 3020. pnpm 11 reads its settings from
`pnpm-workspace.yaml` (hoisted node_modules are required by the template, esbuild/sharp builds are allowed).

## Screens

| Area | Routes | Who |
| --- | --- | --- |
| Auth | `/login`, `/forgot-password` (OTP), `/change-password` (first login) | everyone |
| Learn | `/home`, `/my-training`, `/my-training/[id]` (lessons → assessment → acknowledgement), `/recipes`, `/recipes/[id]`, `/notifications`, `/profile` | everyone |
| Team | `/team`, `/team/[id]` (full training history), `/reports` | roles with report access, scoped to their team |
| Content | `/admin/modules`, `/admin/modules/[id]` (versioned editor + preview + publish), `/admin/paths`, `/admin/assignments`, `/admin/recipes`, `/admin/recipes/[id]`, `/admin/videos`, `/admin/categories` | training admins |
| Organisation | `/admin/users`, `/admin/outlets`, `/admin/brands`, `/admin/roles`, `/admin/audit` | super admin |

The menu is built from the permission map returned by `/api/master/user-profile`; pages are wrapped
in `RequirePermission` and the API enforces the same rules.

## Structure

```
src/
  app/(blank-layout-pages)/   login, forgot / change password
  app/(dashboard)/            authenticated pages (AuthGuard in the layout)
  views/                      page components (learn, recipes, team, reports, admin/*)
  components/                 shared UI: ServerTable, FormDialog, form fields, media, security
  components/security/        ProtectedContent, Watermark, SecureVideoPlayer
  contexts/AuthContext.tsx    session, permissions, idle logout, periodic revocation check
  libs/api.ts                 API client: token refresh, forced logout on revoked access
  hooks/                      useAuth, useApi, useServerTable, useOptions
```

## Content protection

- HLS via hls.js with short-lived Bunny tokens (capped at the end of the learner's shift); no
  download button, no picture-in-picture or casting, playback rate capped at 2×, seeking past the
  furthest watched point is blocked until the lesson is complete.
- A moving watermark with the viewer's name, employee ID and time sits over videos; a tiled
  watermark covers lessons and recipes. Fullscreen keeps the watermark.
- Text selection, copy, right-click, print and save shortcuts are disabled; content blurs when the
  window loses focus or PrintScreen is pressed.
- Browsers cannot fully prevent screenshots or screen recording (phone cameras always work). The
  watermark makes leaks traceable; Bunny MediaCage DRM additionally blacks out recordings on
  supported browsers.

## Sessions

Access tokens refresh automatically. Idle sessions end after `NEXT_PUBLIC_IDLE_TIMEOUT_MINUTES`.
The profile is re-checked every 2 minutes and every API call validates the session, so removing a
user's access logs them out right away.
