# SYNQ — Technical Documentation
**Version:** 1.0.0  
**Status:** Production-Ready  
**Last Updated:** April 2026

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Monorepo Structure](#3-monorepo-structure)
4. [Tech Stack Reference](#4-tech-stack-reference)
5. [Database Schema](#5-database-schema)
6. [Backend Services](#6-backend-services)
7. [REST API Reference](#7-rest-api-reference)
8. [WebSocket Protocols](#8-websocket-protocols)
9. [Frontend Architecture](#9-frontend-architecture)
10. [Core Features Deep Dive](#10-core-features-deep-dive)
11. [Environment Variables](#11-environment-variables)
12. [Running Locally](#12-running-locally)
13. [Deployment Architecture](#13-deployment-architecture)
14. [Security Model](#14-security-model)

---

## 1. Product Overview

**SYNQ** is a full-stack, multiplayer cloud development environment (Cloud IDE) purpose-built for collaborative hackathon teams and software engineering groups. It provisions isolated Docker containers per project, provides a browser-native VS Code–grade code editor, and introduces a first-of-its-kind **Consensus Merge Engine** that requires unanimous team approval before any code is pushed to a GitHub repository.

### Core Value Propositions

| Feature | Description |
|---|---|
| **Isolated Sandboxes** | Every project runs in a dedicated Docker container with a persistent volume. No shared state between teams. |
| **Real-Time Collaboration** | Live cursor sharing, conflict-free file editing (CRDTs via Yjs + Monaco), and teammate presence indicators. |
| **Consensus Merge** | A democratic, voting-based GitHub push pipeline. Code cannot reach `main` until every teammate approves. |
| **AI Pair Programmer** | SYNQ AI (GPT-4o) understands the active file, the project's directory tree, and can autonomously rewrite files. |
| **Live Voice Rooms** | Per-project voice channels powered by LiveKit (WebRTC), embedded directly in the IDE sidebar. |
| **Multi-Language Support** | 9 pre-configured framework templates spanning Python, Node.js, Go, Rust, C, C++, and modern web frameworks. |
| **Workspace Persistence** | Idle containers are auto-archived to Supabase Storage (tar backup) and restored on-demand with zero data loss. |

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      USER BROWSER                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │             Next.js 14 (App Router)                 │   │
│  │                                                     │   │
│  │  ┌─────────┐  ┌──────────┐  ┌─────────────────┐   │   │
│  │  │ Monaco  │  │ AI Chat  │  │ Consensus Merge  │   │   │
│  │  │ Editor  │  │ Panel    │  │ Modal            │   │   │
│  │  └────┬────┘  └────┬─────┘  └────────┬────────┘   │   │
│  │       │             │                 │             │   │
│  │  ┌────▼─────────────▼─────────────────▼────────┐  │   │
│  │  │            Next.js /proxy/api/* Route        │  │   │
│  │  └────────────────────┬─────────────────────────┘  │   │
│  └───────────────────────┼─────────────────────────────┘   │
│                          │ HTTP REST                        │
└──────────────────────────┼──────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                  Express.js API Server                       │
│                     (Port 4000)                              │
│                                                             │
│  ┌────────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ ProjectsRouter │  │  MergeRouter │  │    AIRouter    │  │
│  │ ContainersRtr  │  │  VoiceRouter │  │  WorkspaceRtr  │  │
│  └────────────────┘  └──────────────┘  └────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ContainerService │ MergeService │ GithubService       │  │
│  │ FsService        │ ArchiverService │ ActivityTracker   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────┐    ┌──────────────────────────┐   │
│  │  Yjs WS Server       │    │  Terminal WS Server      │   │
│  │  (/api/ws/:id)       │    │  (/api/terminal/:id)     │   │
│  └─────────────────────┘    └──────────────────────────┘   │
└──────────────────────────────────┬──────────────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
              ▼                    ▼                    ▼
    ┌─────────────────┐  ┌───────────────┐  ┌────────────────┐
    │   Supabase DB   │  │ Docker Engine │  │  Clerk Auth    │
    │ (PostgreSQL)    │  │ (Local Host)  │  │  (JWT + OAuth) │
    └─────────────────┘  └───────────────┘  └────────────────┘
```

### Data Flow Principles

- **Container is the Source of Truth.** All file reads for the Consensus Merge Engine come directly from `FsService.readFile()` against the live Docker container, never from stale diffs.
- **API Proxy Pattern.** The frontend never calls `localhost:4000` directly. All requests route through the Next.js `/proxy/api/[...path]` catch-all route, which injects authentication headers and handles CORS.
- **WebSockets bypass the proxy.** Yjs (collaborative editing) and terminal connections connect directly to `ws://localhost:4000` to avoid HTTP upgrade edge cases.
- **Supabase Realtime.** The `MergeModal` subscribes to `merge_requests` table changes using Supabase Realtime, enabling zero-polling consensus status updates.

---

## 3. Monorepo Structure

The project is a **Turborepo** monorepo with the following layout:

```
hackathon-accelerator/
├── apps/
│   ├── web/                    # Next.js 14 frontend
│   │   ├── src/
│   │   │   ├── app/            # App Router pages
│   │   │   │   ├── (auth)/     # Clerk-protected routes
│   │   │   │   │   ├── dashboard/page.tsx
│   │   │   │   │   ├── projects/[id]/page.tsx
│   │   │   │   │   └── join/[id]/page.tsx
│   │   │   │   ├── api/
│   │   │   │   │   ├── webhooks/clerk/route.ts
│   │   │   │   │   └── proxy/api/[...path]/route.ts
│   │   │   │   ├── landing/    # Public marketing pages
│   │   │   │   ├── about/
│   │   │   │   ├── blog/
│   │   │   │   └── contact/
│   │   │   ├── components/
│   │   │   │   ├── workspace/  # IDE UI components
│   │   │   │   │   ├── MergeModal.tsx
│   │   │   │   │   └── UnifiedSidebar.tsx
│   │   │   │   ├── landing/    # Marketing components
│   │   │   │   └── ui/         # Shared design system
│   │   │   ├── features/
│   │   │   │   ├── ide/
│   │   │   │   │   ├── EditorCanvas.tsx
│   │   │   │   │   ├── FileTree.tsx
│   │   │   │   │   ├── useFileSystem.ts
│   │   │   │   │   └── useTeammates.ts
│   │   │   │   ├── merge/
│   │   │   │   │   └── useConsensus.ts
│   │   │   │   ├── voice/
│   │   │   │   │   └── VoiceRoom.tsx
│   │   │   │   └── projects/
│   │   │   │       └── InviteButton.tsx
│   │   │   └── lib/
│   │   │       ├── api-client.ts       # getApiUrl, getApiHeaders, getWsUrl
│   │   │       ├── file-tree.ts        # buildFileTree() utility
│   │   │       └── supabase.ts         # Supabase browser client
│   │   ├── next.config.mjs
│   │   └── tailwind.config.ts
│   │
│   └── server/                 # Express.js backend
│       ├── src/
│       │   ├── index.ts                # App entry, HTTP + WS server
│       │   ├── config/
│       │   │   └── env.ts              # Zod-validated environment schema
│       │   ├── db/
│       │   │   └── schema.sql          # Complete PostgreSQL schema
│       │   ├── lib/
│       │   │   └── supabase.ts         # Supabase server client
│       │   ├── middleware/
│       │   │   └── error.middleware.ts
│       │   ├── routes/
│       │   │   ├── projects.router.ts
│       │   │   ├── containers.router.ts
│       │   │   ├── merge.router.ts
│       │   │   ├── voice.router.ts
│       │   │   ├── fs.router.ts
│       │   │   ├── workspace.router.ts
│       │   │   └── ai.router.ts
│       │   ├── services/
│       │   │   ├── container.service.ts
│       │   │   ├── fs.service.ts
│       │   │   ├── merge.service.ts
│       │   │   ├── github.service.ts
│       │   │   ├── archiver.service.ts
│       │   │   ├── activity.tracker.ts
│       │   │   ├── presence.service.ts
│       │   │   ├── idle.monitor.ts
│       │   │   └── container.persistence.ts
│       │   └── ws/
│       │       ├── yjs.ws.ts           # Yjs collaborative CRDT server
│       │       └── terminal.ws.ts      # xterm.js PTY bridge
│       └── package.json
│
├── packages/
│   └── shared-types/           # TypeScript shared interfaces
│       └── src/
│           ├── container.types.ts      # ContainerConfig, FrameworkTemplate, FileNode
│           ├── project.types.ts        # Project interface
│           ├── merge.types.ts          # MergeRequest, MergeVote interfaces
│           └── index.ts
│
├── turbo.json                  # Turborepo pipeline config
└── package.json                # Root workspace config
```

---

## 4. Tech Stack Reference

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 14.2.5 | React framework, App Router, API proxy routes |
| **React** | 18.3.1 | UI component framework |
| **TypeScript** | 5.x | Static type checking across the entire monorepo |
| **Tailwind CSS** | 3.4.4 | Utility-first styling |
| **Monaco Editor** | 0.55.1 | VS Code-grade in-browser code editor |
| **Yjs** | 13.6.18 | CRDT library for conflict-free collaborative editing |
| **y-monaco** | 0.1.6 | Yjs binding for Monaco Editor |
| **y-websocket** | 1.5.4 | WebSocket provider for Yjs sync |
| **Supabase JS** | 2.44.3 | Realtime subscriptions, database client, storage |
| **Clerk Next.js** | 5.2.5 | Authentication, session management, SSO |
| **LiveKit Components** | 2.9.20 | WebRTC voice room UI components |
| **livekit-client** | 2.17.3 | LiveKit browser SDK |
| **xterm.js** | 5.3.0 | Browser terminal emulator |
| **xterm-addon-fit** | 0.8.0 | Auto-resize terminal to container |
| **Framer Motion** | 12.38.0 | Declarative animations |
| **Lucide React** | 0.577.0 | Icon library |
| **GSAP** | 3.14.2 | Advanced animation toolkit (landing page) |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | 20.x | Server runtime |
| **Express.js** | 4.19.2 | HTTP REST API framework |
| **TypeScript** | 5.x | Type-safe server code |
| **tsx** | 4.16.2 | TypeScript execution via esbuild (dev mode with live reload) |
| **Dockerode** | 4.0.2 | Docker Engine API client — container lifecycle management |
| **@octokit/rest** | 22.0.1 | GitHub REST API client — Git Tree push pipeline |
| **@clerk/backend** | 1.3.0 | Server-side Clerk SDK — OAuth token retrieval, user lookup |
| **@supabase/supabase-js** | 2.99.1 | Server-side database operations |
| **OpenAI** | 6.34.0 | GPT-4o streaming completions + function calling |
| **livekit-server-sdk** | 2.15.0 | LiveKit access token generation |
| **ws** | 8.18.0 | Raw WebSocket server (Yjs + Terminal) |
| **y-websocket** | 1.5.4 | Yjs WebSocket server implementation |
| **Zod** | 3.23.8 | Environment variable schema validation |
| **Helmet** | 7.1.0 | HTTP security headers |
| **CORS** | 2.8.5 | Cross-origin request handling |

### Infrastructure & Services

| Service | Purpose |
|---|---|
| **Supabase (PostgreSQL)** | Primary database — projects, merge requests, votes, teammates |
| **Supabase Storage** | Workspace backup bucket — `.tar` archives of `/workspace` |
| **Supabase Realtime** | WebSocket-based table subscriptions for the merge modal |
| **Docker Engine** | Runs isolated project sandboxes on the host machine |
| **Clerk** | User authentication, GitHub OAuth SSO, organization management |
| **GitHub API** | Target for Consensus Merge via Octokit Git Tree API |
| **LiveKit** | WebRTC media server for in-IDE voice rooms |
| **OpenAI (GPT-4o)** | AI pair programmer — streaming chat + autonomous file writing |
| **Turborepo** | Monorepo task orchestration and build caching |

---

## 5. Database Schema

### `projects`
Stores every scaffolded project sandbox.

| Column | Type | Notes |
|---|---|---|
| `id` | `TEXT` PK | UUID, randomly generated |
| `name` | `TEXT` | User-provided project name |
| `status` | `TEXT` | `active` \| `archived` \| `failed` |
| `ownerId` | `TEXT` | Clerk user ID of the project creator |
| `templateId` | `TEXT` | One of the 9 `FrameworkTemplate` values |
| `previewUrl` | `TEXT` | Public URL to the running app inside the sandbox |
| `createdAt` | `TIMESTAMPTZ` | Auto-set on insert |
| `updatedAt` | `TIMESTAMPTZ` | Auto-updated via PostgreSQL trigger |

---

### `project_teammates`
Maps users to projects they are members of. Used as the ground truth for Consensus count.

| Column | Type | Notes |
|---|---|---|
| `project_id` | `TEXT` | FK → `projects.id` |
| `user_id` | `TEXT` | Clerk user ID |
| `role` | `TEXT` | `owner` \| `member` |
| `custom_role` | `TEXT` (nullable) | Free-text role label entered on join (e.g. "Frontend Dev") |
| `joined_at` | `TIMESTAMPTZ` | Auto-set on insert |

**Primary Key:** `(project_id, user_id)`

---

### `merge_requests`
One row represents a single proposed merge by a teammate.

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID` PK | Auto-generated |
| `project_id` | `TEXT` | FK → `projects.id` |
| `author_id` | `TEXT` | Clerk user ID of the proposer |
| `commit_message` | `TEXT` | Git commit message (default: "Consensus merge 🚀") |
| `diff_payload` | `TEXT` | Textual description of the change |
| `files_changed` | `TEXT[]` | Array of relative file paths to push |
| `status` | `TEXT` | `pending` \| `accepted` \| `merged` \| `rejected` \| `failed` |
| `github_owner` | `TEXT` | GitHub user or org name |
| `github_repo` | `TEXT` | GitHub repository name |
| `merged_sha` | `TEXT` (nullable) | Resulting Git commit SHA after a successful push |
| `created_at` | `TIMESTAMPTZ` | Auto-set |
| `updated_at` | `TIMESTAMPTZ` | Auto-updated via trigger |

---

### `merge_votes`
One row = one user's vote on a specific merge request. Unique constraint allows vote changes via upsert.

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID` PK | Auto-generated |
| `request_id` | `UUID` | FK → `merge_requests.id` (CASCADE DELETE) |
| `user_id` | `TEXT` | Clerk user ID of the voter |
| `decision` | `TEXT` | `approve` \| `reject` |
| `voted_at` | `TIMESTAMPTZ` | Upserted on every vote change |

**Unique Constraint:** `(request_id, user_id)` — each user has exactly one vote per request.

---

### `container_snapshots`
Audit log for every workspace backup triggered by idle archiving.

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID` PK | Auto-generated |
| `project_id` | `TEXT` | FK → `projects.id` |
| `container_id` | `TEXT` | Docker container ID at time of archive |
| `storage_path` | `TEXT` | Path in Supabase Storage bucket |
| `size_bytes` | `BIGINT` | Size of the tar archive |
| `reason` | `TEXT` | `idle_shutdown` \| `manual` \| `pre_merge` |
| `created_at` | `TIMESTAMPTZ` | Auto-set |

---

## 6. Backend Services

### `ContainerService`
**File:** `apps/server/src/services/container.service.ts`

Manages the full lifecycle of Docker containers acting as project sandboxes.

| Method | Description |
|---|---|
| `createProjectContainer(templateId, projectId)` | Pulls the correct Docker image, creates and starts a container with a bind-mounted `/workspace`, checks for an existing Supabase backup (restored project), or scaffolds fresh from the template. Returns `ContainerConfig`. |
| `stopContainer(containerId)` | Gracefully stops a running container. |
| `restoreWorkspace(projectId, container)` | Downloads a tar archive from Supabase Storage and extracts it into `/workspace` using `putArchive`. |

**Supported Templates & Images:**

| Template ID | Docker Image | Description |
|---|---|---|
| `NEXTJS_TAILWIND` | `node:20-alpine` | Next.js + Tailwind (via `create-next-app`) |
| `VANILLA_VITE` | `node:20-alpine` | React + TypeScript (via `npm create vite`) |
| `PYTHON_FASTAPI` | `python:3.11-alpine` | FastAPI + Uvicorn |
| `PYTHON_BLANK` | `python:3.11-alpine` | Bare Python 3.11 |
| `NODE_BLANK` | `node:20-alpine` | Bare Node.js 20 HTTP server |
| `GO_MODULE` | `golang:1.22-alpine` | Go module with `go mod init` |
| `RUST_CARGO` | `rust:1.78-alpine` | Rust + Cargo project |
| `CPP_CMAKE` | `gcc:13-bookworm` | C++ 17 + CMake |
| `C_MAKE` | `gcc:13-bookworm` | C17 + GCC + Makefile |

---

### `FsService`
**File:** `apps/server/src/services/fs.service.ts`

Provides an abstraction layer for all file system operations inside a running Docker container. All paths are relative to `/workspace`.

| Method | Description |
|---|---|
| `getTree(projectId)` | Returns a nested `FileNode[]` tree by running `find` inside the container, excluding `node_modules`, `.git`, `.next`, `dist`, `__pycache__`, `.venv`. |
| `getFlatPaths(projectId)` | Returns a flat `string[]` of all relative file paths — used by the Merge Engine to enumerate files to push. |
| `readFile(projectId, filePath)` | Reads a file's content by running `cat` inside the container. Returns raw `string`. |
| `writeFile(projectId, filePath, content)` | Writes content to a file by streaming it into `tee` via `exec.start({stdin: true})` — bypasses all shell quoting issues entirely. |
| `createFile(projectId, filePath)` | Creates an empty file using `mkdir -p` + `touch`. |

---

### `MergeService`
**File:** `apps/server/src/services/merge.service.ts`

The heart of the Consensus Merge Engine. Orchestrates the full lifecycle from proposal to GitHub push.

| Method | Description |
|---|---|
| `createMergeRequest(input)` | Inserts a new `merge_requests` row with status `pending`. |
| `castVote(requestId, userId, decision)` | Upserts a `merge_votes` row and immediately calls `evaluateConsensus`. |
| `evaluateConsensus(requestId)` | Counts total teammates, approvals, and rejections in parallel. If all have approved, calls `executePush`. If any rejection exists, marks `rejected`. |
| `executePush(mergeReq)` | **Private.** Applies optimistic lock (sets status `accepted`), fetches the author's GitHub OAuth token from Clerk, reads all file contents from FsService, calls `GithubService.executeMergePush`, and marks status `merged` with the commit SHA. Rolls back to `failed` on any error. |

**Consensus Rules:**
- **Unanimous Approval Required**: Every member in `project_teammates` must vote `approve`.
- **Any Rejection Kills It**: A single `reject` vote immediately marks the request `rejected`.
- **Race Condition Prevention**: Optimistic SQL locking via `UPDATE WHERE status = 'pending'` prevents double-execution.
- **Idempotent Votes**: Supabase upsert on `(request_id, user_id)` allows vote changes before consensus.

---

### `GithubService`
**File:** `apps/server/src/services/github.service.ts`

Performs a native GitHub Git Tree API push — no local `git` binary required, no cloning, no credentials stored on disk.

**`executeMergePush(owner, repo, fileContents, commitMessage, userOauthToken)`**

The five-step process:
1. `GET /repos/{owner}/{repo}/git/refs/heads/main` — Resolve latest commit SHA.
2. `GET /repos/{owner}/{repo}/git/commits/{sha}` — Get the base tree SHA.
3. `POST /repos/{owner}/{repo}/git/trees` — Create a new Git tree with all modified files as blobs.
4. `POST /repos/{owner}/{repo}/git/commits` — Create the consensus commit pointing to the new tree.
5. `PATCH /repos/{owner}/{repo}/git/refs/heads/main` — Fast-forward the `main` branch ref.

**Authentication:** Uses the project author's personal GitHub OAuth token retrieved from the Clerk Backend SDK (`getUserOauthAccessToken`). This means SYNQ never stores GitHub credentials and all pushes are performed as the actual user.

**Scope Required:** GitHub OAuth token must include the `repo` scope. This is configured in the Clerk Dashboard → GitHub Social Connection → Custom Credentials → Scopes.

---

### `ArchiverService`
**File:** `apps/server/src/services/archiver.service.ts`

Handles graceful container archiving — backs up workspace to Supabase Storage and stops the Docker container.

**`backupAndKillContainer(projectId, containerId)`**
1. Calls Dockerode's `container.getArchive({ path: '/workspace' })` to get a tar stream.
2. Buffers the stream and uploads it as `{projectId}/backup.tar` to the Supabase `workspaces` storage bucket.
3. Stops and removes the Docker container.
4. Updates the `projects` row to `status: 'sleeping'`.

When the project is resumed, `ContainerService.createProjectContainer()` detects the existing backup and calls `restoreWorkspace()` instead of scaffolding from scratch.

---

### `ActivityTracker`
**File:** `apps/server/src/services/activity.tracker.ts`

A lightweight in-memory idle detection system that powers the auto-archiving background job.

| Method | Description |
|---|---|
| `markActive(projectId)` | Called by the Yjs WS server and Terminal WS server on every keystroke/message. Updates the timestamp. |
| `startIdleCronJob()` | Starts a `setInterval` that runs every 10 minutes. For any project idle for >30 minutes, triggers `ArchiverService.backupAndKillContainer()`. |

---

## 7. REST API Reference

All endpoints are prefixed with `/api` and served from port `4000`.

### Projects

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/projects?scopeId={userId}` | Returns all projects owned by or shared with the user |
| `GET` | `/api/projects/:id` | Returns a single project by ID |
| `POST` | `/api/projects/scaffold` | Creates a new project and provisions a Docker sandbox |
| `POST` | `/api/projects/:id/resume` | Restores a sleeping container from Supabase Storage |
| `POST` | `/api/projects/:id/join` | Joins a project via an invite link, saves `customRole` |
| `POST` | `/api/projects/:id/invite` | Invites a user by email. Resolves via Clerk, or sends a Clerk invitation email |
| `GET` | `/api/projects/:id/teammates` | Returns the team roster enriched with Clerk profile data (name, avatar) |

#### `POST /api/projects/scaffold` Request Body

```json
{
  "name": "My Hackathon Project",
  "templateId": "PYTHON_FASTAPI",
  "scopeId": "user_2abc123"
}
```

#### `POST /api/projects/:id/join` Request Body

```json
{
  "userId": "user_2abc123",
  "customRole": "Frontend Developer"
}
```

---

### Containers

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/containers/:id/status` | Returns the Docker container's runtime status |

---

### Merge Engine

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/merge/propose` | Creates a new merge proposal for a project |
| `POST` | `/api/merge/vote` | Casts or changes a vote; triggers GitHub push on consensus |
| `GET` | `/api/merge/requests/:projectId` | Lists all merge requests with their votes |

#### `POST /api/merge/propose` Request Body

```json
{
  "projectId": "abc-123",
  "authorId": "user_2abc",
  "commitMessage": "feat: add login page",
  "githubOwner": "rushi-codehub",
  "githubRepo": "my-hackathon-repo"
}
```

#### `POST /api/merge/vote` Request Body

```json
{
  "requestId": "uuid-of-request",
  "userId": "user_2abc",
  "decision": "approve"
}
```

---

### Workspace (File System via Docker)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/workspace/:id/files` | Returns the full `FileNode[]` tree from the container |
| `POST` | `/api/workspace/:id/files` | Creates a new empty file in the container |
| `GET` | `/api/workspace/:id/file?path={filePath}` | Reads a specific file's content |
| `PUT` | `/api/workspace/:id/file` | Writes content to a file |

---

### Voice (LiveKit Token)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/voice/token?projectId={id}&participantName={name}` | Returns a signed LiveKit JWT token for joining the project's dedicated voice room |

---

### AI (GPT-4o)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai/chat` | Streaming Server-Sent Events endpoint. Accepts message history + IDE context. Streams GPT-4o response and optionally executes `write_file` tool calls against the live sandbox. |

#### `POST /api/ai/chat` Request Body

```json
{
  "messages": [
    { "role": "user", "content": "Refactor main.py to use async functions" }
  ],
  "context": {
    "projectId": "abc-123",
    "activeFile": "main.py",
    "fileContent": "def greet(): ...",
    "tree": [{ "path": "main.py", "type": "file" }]
  }
}
```

**Response:** Server-Sent Events stream. Event types:
- `{ "text": "..." }` — streaming chat content
- `{ "action": "EXEC_START", "tool": "write_file", "path": "..." }` — AI is about to write a file
- `{ "action": "RELOAD_FILE", "path": "..." }` — AI has written the file; frontend should reload Monaco
- `{ "error": "..." }` — error signal
- `[DONE]` — stream is complete

---

## 8. WebSocket Protocols

### Yjs Collaborative Editing — `/api/ws/:projectId`

Powered by `y-websocket`. Each project has its own Yjs room at `ws://localhost:4000/api/ws/{projectId}`.

- **Protocol:** Binary Yjs sync messages (CRDT)
- **Awareness:** Used for live cursor presence (name, color, active file)
- **Clients:** `y-websocket` provider in `EditorCanvas.tsx`
- **Server:** `setupYjsWebSocketServer()` in `yjs.ws.ts`
- **Activity Tracking:** Every awareness update calls `ActivityTracker.markActive(projectId)` to reset the idle timer.

### Terminal — `/api/terminal/:projectId`

A PTY (pseudo-terminal) bridge between the browser xterm.js UI and a shell running inside the Docker container.

- **Protocol:** Raw text (terminal data) and JSON control messages
- **Client:** `xterm.js` + `xterm-addon-fit` in the IDE
- **Server:** `setupTerminalWebSocketServer()` in `terminal.ws.ts`
- **Activity Tracking:** Every keystroke resets `ActivityTracker.markActive(projectId)`.

---

## 9. Frontend Architecture

### Route Structure

| Route | Access | Component | Description |
|---|---|---|---|
| `/` | Public | Landing Page | Marketing homepage with animations |
| `/about` | Public | About Page | Product information |
| `/blog` | Public | Blog Page | Articles (static) |
| `/contact` | Public | Contact Page | Contact form |
| `/sign-in` | Public | Clerk `<SignIn>` | Authentication |
| `/sign-up` | Public | Clerk `<SignUp>` | Registration |
| `/dashboard` | Protected | Dashboard | Project list and creation |
| `/projects/[id]` | Protected | WorkspacePage | Full IDE view |
| `/join/[id]` | Protected | JoinProjectPage | Invite link + role selection |

### State Management

SYNQ uses a composable hooks pattern rather than a global store. Each feature owns its own state:

| Hook | Location | Manages |
|---|---|---|
| `useConsensus` | `features/merge/` | Merge proposal creation and voting |
| `useTeammates` | `features/ide/` | Teammate list fetch and caching |
| `useFileSystem` | `features/ide/` | File tree state and CRUD operations |
| `useAuth` | `@clerk/nextjs` | Authentication state and JWT tokens |

### API Client (`lib/api-client.ts`)

All API calls go through the central `api-client.ts` which enforces the proxy pattern:

```typescript
getApiUrl('api/projects/scaffold')
// In browser → '/proxy/api/projects/scaffold' (routes through Next.js proxy)
// On server  → 'http://localhost:4000/api/projects/scaffold' (direct)

getApiHeaders(token)
// Returns: { 'Authorization': 'Bearer ...', 'ngrok-skip-browser-warning': 'true' }
```

### `MergeModal.tsx`

The most complex frontend component. Manages the full consensus voting lifecycle:

1. Subscribes to `merge_requests` via Supabase Realtime on mount.
2. Fetches the initial pending request for the current project.
3. Displays files being synced, voter status with avatars, and commit message.
4. On "Approve Merge" click: POSTs to `/api/merge/vote`.
5. On error: Displays the raw GitHub/backend error message inline (previously was a silent failure).
6. On success (Supabase Realtime fires `status: merged`): Auto-closes modal.

---

## 10. Core Features Deep Dive

### Consensus Merge Engine

The most unique architectural feature of SYNQ. Unlike traditional git-flow, SYNQ enforces a fully democratic, real-time voting process before any code leaves the sandbox.

**Flow Diagram:**

```
1. Developer clicks "Propose Merge" in the IDE
         ↓
2. WorkspacePage prompts for GitHub Owner + Repo Name
         ↓
3. POST /api/merge/propose
   → FsService.getFlatPaths() enumerates ALL files in the container
   → MergeService.createMergeRequest() inserts row (status: pending)
         ↓
4. Supabase Realtime notifies ALL open IDEs with merge_requests change
         ↓
5. MergeModal appears on EVERY teammate's screen simultaneously
         ↓
6. Each teammate clicks "Approve Merge"
   → POST /api/merge/vote (decision: 'approve')
   → MergeService.castVote() upserts the vote
   → MergeService.evaluateConsensus() runs immediately
         ↓
7. If ALL members have approved:
   a. Optimistic lock: status → 'accepted'
   b. Clerk SDK: fetch author's GitHub OAuth token
   c. FsService.readFile() → reads EVERY file from container (live)
   d. GithubService.executeMergePush() → 5-step Git Tree API push
   e. status → 'merged' + merged_sha stored
         ↓
8. Supabase Realtime notifies all IDEs: merge complete
9. Modals auto-close. Code is live on GitHub main branch.
```

---

### AI Pair Programmer (GPT-4o God Mode)

The AI assistant has full awareness of the IDE's current state and can manipulate the filesystem directly.

**Context injected on every request:**
- The currently open file's name and full content
- A flat directory tree of the entire workspace
- The project ID for tool execution

**OpenAI Function Calling (`write_file` tool):**
When GPT-4o determines the user wants code written (not just explained), it calls the `write_file` function with the target file path and complete new content. The backend:
1. Parses the tool call arguments from the streaming response.
2. Calls `FsService.writeFile()` to inject the content directly into the Docker container.
3. Sends a `{ action: 'RELOAD_FILE' }` SSE event back to the browser.
4. The frontend's `EditorCanvas` receives this and reloads the file in Monaco — the user sees their code appear as if by magic.

---

### Live Collaboration (Yjs + Monaco + Awareness)

- **Conflict-Free Editing:** Yjs CRDTs ensure that no matter how many users type simultaneously, no edits are ever lost or corrupted. Operations are automatically merged with mathematical correctness.
- **Live Cursors:** Each client broadcasts their cursor position and active file through Yjs Awareness. `UnifiedSidebar.tsx` listens to `ide-presence` custom events dispatched by `EditorCanvas.tsx` and renders colored initials on each file where a teammate is active.
- **Presence Identification:** Each user is assigned a random HSL color at session start for visual differentiation.

---

### Workspace Persistence & Idle Archiving

SYNQ uses a two-phase persistence model:

**Phase 1: Idle Detection (ActivityTracker)**
- Every Yjs message and terminal keypress updates `ActivityTracker.lastActivity[projectId]`.
- A background `setInterval` (10-minute cadence) sweeps all tracked projects.
- Projects idle for >30 minutes are automatically archived.

**Phase 2: Archive to Supabase Storage (ArchiverService)**
- Dockerode streams `/workspace` as a tar archive.
- The archive is uploaded to the Supabase `workspaces` storage bucket as `{projectId}/backup.tar`.
- The container is stopped and removed.
- The project status is set to `sleeping`.

**Phase 3: Resume on Demand (ContainerService)**
- `POST /api/projects/:id/resume` is called by the frontend when a user opens a sleeping project.
- `ContainerService.createProjectContainer()` checks Supabase Storage for `{projectId}/backup.tar`.
- If found: `putArchive()` restores the workspace into the new container.
- If not: Fresh scaffolding from the framework template.

---

### Invite & Role System

**Invite Flow:**
1. Project owner clicks the Invite button in the IDE sidebar.
2. `InviteButton.tsx` calls `POST /api/projects/:id/invite` with the invitee's email.
3. If the email is a registered Clerk user: directly inserted into `project_teammates` as `member`.
4. If not: Clerk `createInvitation()` sends a B2C email with a magic link to `/join/{projectId}`.

**Join Flow:**
1. User opens `/join/{projectId}` from the invite link.
2. Clerk authentication is checked. If not signed in, redirect to `/sign-in?redirect_url=/join/{id}`.
3. User is presented with a UI prompt asking for their **Custom Role** (free-text, e.g. "Backend Engineer").
4. On submit: `POST /api/projects/:id/join` upserts the user into `project_teammates` with their `customRole`.
5. User is redirected to `/projects/{id}` — the full IDE view.
6. The `UnifiedSidebar` displays `customRole` under each teammate's name (falling back to `owner`/`member` if no custom role was set).

---

## 11. Environment Variables

Create a single `.env` file in the monorepo root (`hackathon-accelerator/.env`).

### Required

| Variable | Example | Description |
|---|---|---|
| `SUPABASE_URL` | `https://xxx.supabase.co` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Supabase service role key (bypasses RLS) |
| `CLERK_SECRET_KEY` | `sk_test_...` | Clerk backend secret key |

### Frontend (prefix with `NEXT_PUBLIC_`)

| Variable | Example | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase URL for browser client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Supabase anon key for browser |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_...` | Clerk publishable key |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Backend server URL (used for WS connection and SSR fetches) |
| `NEXT_PUBLIC_LIVEKIT_URL` | `wss://your.livekit.io` | LiveKit server WebSocket URL |

### Optional

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | Required for SYNQ AI features (GPT-4o) |
| `LIVEKIT_API_KEY` | Required for voice rooms |
| `LIVEKIT_API_SECRET` | Required for voice rooms |
| `LIVEKIT_URL` | LiveKit server URL |
| `NEXT_PUBLIC_APP_URL` | Public app URL (used in Clerk invitation redirect URLs, default: `http://localhost:3000`) |

---

## 12. Running Locally

### Prerequisites

- **Node.js** 20+
- **Docker Desktop** (must be running)
- **pnpm** or **npm** (project uses npm workspaces)
- A Supabase project (free tier is sufficient)
- A Clerk application (free tier is sufficient)

### Setup

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd hackathon-accelerator

# 2. Install all dependencies (runs in all workspaces)
npm install

# 3. Set up your environment
cp .env.example .env
# Fill in all required variables in .env

# 4. Initialize the Supabase database
# Open your Supabase Dashboard → SQL Editor
# Paste and run the contents of: apps/server/src/db/schema.sql

# 5. Start the full stack (frontend + backend in parallel)
npm run dev
```

This starts:
- **Next.js** at `http://localhost:3000`
- **Express API** at `http://localhost:4000`

### Clerk Configuration

1. Go to Clerk Dashboard → User & Authentication → Social Connections.
2. Enable **GitHub**.
3. Toggle **"Use custom credentials"** ON.
4. Register a new GitHub OAuth App at `github.com/settings/developers`.
   - Homepage URL: `http://localhost:3000`
   - Callback URL: `https://{your-clerk-domain}.clerk.accounts.dev/v1/oauth_callback`
5. Paste the GitHub Client ID and Secret into Clerk.
6. Under **Scopes**, add: `repo` (required for GitHub push), `user:email`, `read:user`.
7. Save.

---

## 13. Deployment Architecture

For production deployment, the following configuration changes are required:

| Component | Local | Production |
|---|---|---|
| Frontend | `http://localhost:3000` | Vercel / any Node.js host |
| Backend | `http://localhost:4000` | Render / Railway / EC2 / any server with Docker |
| Docker | Local Docker Desktop | Docker-in-Docker or a host with Docker Engine directly accessible |
| WebSockets (Yjs/Terminal) | `ws://localhost:4000` | `wss://your-api-domain.com` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | `https://your-api-domain.com` |

> **Critical:** The backend server must run on a machine with Docker Engine installed and accessible by the Node.js process. Docker-in-Docker (DinD) is the standard approach on Kubernetes/containerized infrastructure.

---

## 14. Security Model

### Authentication
- All protected routes (`/dashboard`, `/projects/*`, `/join/*`) are guarded by Clerk middleware.
- The backend trusts the Clerk-issued JWT passed as `Authorization: Bearer {token}` on every request.
- Teammate verification uses Clerk's Backend SDK to resolve user IDs from email addresses — no direct database writes of unverified user data.

### Authorization
- **Project Ownership:** The `project.ownerId` field controls who can perform destructive operations (archiving, deletion).
- **Merge Consensus:** The backend SQL query for consensus counts from `project_teammates` — this is the canonical source; no client-provided vote count is trusted.
- **GitHub Token:** The author's GitHub OAuth token is fetched server-side via the Clerk Backend SDK at the moment of push — it is never stored in the SYNQ database and never transmitted to the frontend.

### Container Isolation
- Each project runs in a completely separate Docker container.
- No shared filesystem between projects (each has its own bind-mounted host volume at `/tmp/hackathon-accelerator/{projectId}`).
- Containers run with `AutoRemove: true` — orphaned containers are automatically cleaned up.

### API Security
- `helmet()` middleware sets standard HTTP security headers (CSP, HSTS, XSS protection, etc.).
- `cors({ origin: '*' })` is configured for development. **For production:** restrict to your frontend's exact domain.
- File path traversal is prevented in `FsService` by stripping `../` sequences before executing container commands.

---

*Documentation generated from live codebase — April 2026.*  
*SYNQ is built with ❤️ for the developer community.*
