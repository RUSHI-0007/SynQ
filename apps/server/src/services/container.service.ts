import Docker from 'dockerode';
import { ContainerConfig, FrameworkTemplate } from '@hackathon/shared-types';
import path from 'path';
import { supabase } from '../lib/supabase';

const docker = new Docker();

// ─── Private Helpers ─────────────────────────────────────────────────────────

/**
 * Execute a shell command inside a running container at /workspace.
 * Streams all output to the server's own stdout/stderr for real-time debugging.
 */
async function execShell(container: Docker.Container, shellCmd: string): Promise<void> {
  const exec = await container.exec({
    Cmd: ['sh', '-c', shellCmd],
    AttachStdout: true,
    AttachStderr: true,
    WorkingDir: '/workspace',
  });
  const stream = await exec.start({ Detach: false, hijack: true });
  docker.modem.demuxStream(stream, process.stdout, process.stderr);
  await new Promise<void>((resolve, reject) => {
    stream.on('end', resolve);
    stream.on('error', reject);
  });
}

/**
 * Write a UTF-8 file into /workspace inside the container via stdin → tee.
 * Automatically creates parent directories as needed.
 */
async function writeWorkspaceFile(
  container: Docker.Container,
  relativePath: string,
  content: string
): Promise<void> {
  const fullPath = `/workspace/${relativePath}`;
  const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));

  // Ensure parent directory exists (no-op if it already does)
  if (dir && dir !== '/workspace' && dir !== '/') {
    await execShell(container, `mkdir -p "${dir}"`);
  }

  const exec = await container.exec({
    Cmd: ['tee', fullPath],
    AttachStdin: true,
    AttachStdout: true,
    AttachStderr: true,
  });

  await new Promise<void>((resolve, reject) => {
    exec.start({ hijack: true, stdin: true }, (err: Error | null, stream: any) => {
      if (err) return reject(err);
      stream.write(Buffer.from(content, 'utf8'));
      stream.end();
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
  });
}

// ─── Template Content Strings ─────────────────────────────────────────────────
// Defined as module-level constants so they don't pollute the scaffold function.

const PYTHON_FASTAPI_MAIN = `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="SynQ FastAPI Sandbox", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Hello from SynQ FastAPI Sandbox! 🚀"}


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
`;

const PYTHON_FASTAPI_REQUIREMENTS = `fastapi>=0.104.0
uvicorn[standard]>=0.24.0
httpx>=0.26.0
`;

const PYTHON_FASTAPI_README = `# FastAPI Sandbox

Your isolated Python 3.11 + FastAPI environment is ready.

## Run the server

\`\`\`bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
\`\`\`

Interactive API docs: http://localhost:8000/docs

## Install more packages

\`\`\`bash
pip install sqlalchemy pydantic-settings
\`\`\`
`;

const PYTHON_BLANK_MAIN = `# Welcome to your Python Sandbox on SynQ! 🐍
# Your collaborative Python environment is ready.


def greet(name: str) -> str:
    """Returns a friendly greeting."""
    return f"Hello, {name}! Welcome to SynQ."


def main():
    message = greet("World")
    print(message)


if __name__ == "__main__":
    main()
`;

const PYTHON_BLANK_README = `# Python Blank Sandbox

Your isolated Python 3.11 environment is ready.

## Getting Started

\`\`\`bash
# Run the main file
python3 main.py

# Install packages
pip install requests numpy pandas
\`\`\`
`;

const NODE_BLANK_INDEX = `// Welcome to your Node.js Sandbox on SynQ! 🟢
// Your collaborative Node.js environment is ready.

const http = require('http');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Hello from SynQ Node.js Sandbox!', path: req.url }));
});

server.listen(PORT, () => {
  console.log(\`🚀 Server running at http://localhost:\${PORT}\`);
});
`;

const NODE_BLANK_PACKAGE = `{
  "name": "synq-node-sandbox",
  "version": "1.0.0",
  "description": "SynQ Node.js Blank Sandbox",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "node --watch index.js"
  },
  "keywords": [],
  "license": "MIT"
}
`;

const NODE_BLANK_README = `# Node.js Blank Sandbox

Your isolated Node.js 20 environment is ready.

## Getting Started

\`\`\`bash
# Run the server
node index.js

# Watch mode (auto-restart on changes)
node --watch index.js

# Install packages
npm install express axios
\`\`\`
`;

const GO_MAIN = `package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Hello from SynQ Go Sandbox! 🚀",
		})
	})
	fmt.Println("🚀 Server running at http://localhost:8080")
	http.ListenAndServe(":8080", nil)
}
`;

const GO_README = `# Go Sandbox

Your isolated Go 1.22 environment is ready.

## Getting Started

\`\`\`bash
# Run the server
go run main.go

# Build a binary
go build -o app .

# Install packages
go get github.com/gin-gonic/gin
\`\`\`
`;

const CPP_CMAKE_LISTS = `cmake_minimum_required(VERSION 3.16)
project(SynQSandbox VERSION 1.0.0)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED True)

add_executable(app src/main.cpp)

target_compile_options(app PRIVATE -Wall -Wextra)
`;

const CPP_MAIN = `#include <iostream>
#include <string>
#include <vector>

int main() {
    std::cout << "Hello from SynQ C++ Sandbox! 🚀" << std::endl;

    std::vector<std::string> languages = {"C++", "Rust", "Go"};
    for (const auto& lang : languages) {
        std::cout << "  → " << lang << std::endl;
    }

    return 0;
}
`;

const CPP_README = `# C++ CMake Sandbox

Your isolated C++17 + CMake environment is ready.

## Build & Run

\`\`\`bash
cd build
cmake ..
make
./app
\`\`\`
`;

const C_MAIN = `#include <stdio.h>
#include <stdlib.h>

int main(void) {
    printf("Hello from SynQ C Sandbox!\\n");
    printf("GCC is ready. Start coding!\\n");
    return EXIT_SUCCESS;
}
`;

const C_MAKEFILE = `.PHONY: all clean run

CC     = gcc
CFLAGS = -Wall -Wextra -O2 -std=c17
TARGET = app

all: $(TARGET)

$(TARGET): main.c
\t$(CC) $(CFLAGS) -o $(TARGET) main.c

run: $(TARGET)
\t./$(TARGET)

clean:
\trm -f $(TARGET)
`;

const C_README = `# C Sandbox

Your isolated C17 + GCC environment is ready.

## Build & Run

\`\`\`bash
make
./app

# Or in one step:
make run

# Clean build artifacts:
make clean
\`\`\`
`;

const RUST_README = `# Rust Sandbox

Your isolated Rust + Cargo environment is ready.

## Getting Started

\`\`\`bash
# Run the project
cargo run

# Build a release binary
cargo build --release

# Add a dependency
cargo add serde tokio
\`\`\`
`;

// ─── Per-Template Scaffold Logic ──────────────────────────────────────────────

/**
 * Runs the correct CLI commands and writes starter files for each template.
 * After this runs, the user's /workspace is immediately usable:
 *  - Packages are installed
 *  - Starter files are visible in the IDE file tree
 *  - `npm run dev` / `cargo run` / `go run main.go` etc. just works
 */
async function scaffoldTemplate(
  container: Docker.Container,
  templateId: FrameworkTemplate,
  _projectId: string,
  isAlpine: boolean
): Promise<void> {

  switch (templateId) {

    // ── Web Frameworks ──────────────────────────────────────────────────────
    case 'NEXTJS_TAILWIND': {
      console.log('[Scaffolder] → Next.js + Tailwind (installs ~300MB — may take 2–3 mins)…');
      const gitInstall = isAlpine ? 'apk add --no-cache git' : 'apt-get install -y -qq git';
      await execShell(container,
        `${gitInstall} && ` +
        `npx --yes create-next-app@latest . ` +
        `--typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm`
      );
      break;
    }

    case 'VANILLA_VITE': {
      console.log('[Scaffolder] → Vite + React + TypeScript…');
      // Scaffold into a temp dir to avoid "directory not empty" issues,
      // then move everything to /workspace and install packages.
      await execShell(container,
        'npm create vite@latest _synq_tmp -- --template react-ts && ' +
        'cp -a _synq_tmp/. . && ' +
        'rm -rf _synq_tmp && ' +
        'npm install'
      );
      break;
    }

    // ── Python ──────────────────────────────────────────────────────────────
    case 'PYTHON_FASTAPI': {
      console.log('[Scaffolder] → Python FastAPI + Uvicorn…');
      await execShell(container, 'pip install fastapi "uvicorn[standard]" httpx --quiet');
      await writeWorkspaceFile(container, 'main.py', PYTHON_FASTAPI_MAIN);
      await writeWorkspaceFile(container, 'requirements.txt', PYTHON_FASTAPI_REQUIREMENTS);
      await writeWorkspaceFile(container, 'README.md', PYTHON_FASTAPI_README);
      break;
    }

    case 'PYTHON_BLANK': {
      console.log('[Scaffolder] → Python Blank…');
      await writeWorkspaceFile(container, 'main.py', PYTHON_BLANK_MAIN);
      await writeWorkspaceFile(container, 'README.md', PYTHON_BLANK_README);
      break;
    }

    // ── Systems Languages ───────────────────────────────────────────────────
    case 'RUST_CARGO': {
      console.log('[Scaffolder] → Rust + Cargo…');
      // cargo is pre-installed in the rust:1.78-alpine image
      await execShell(container, 'cargo init .');
      await writeWorkspaceFile(container, 'README.md', RUST_README);
      break;
    }

    case 'GO_MODULE': {
      console.log('[Scaffolder] → Go Module…');
      await execShell(container, 'go mod init synq-sandbox');
      await writeWorkspaceFile(container, 'main.go', GO_MAIN);
      await writeWorkspaceFile(container, 'README.md', GO_README);
      break;
    }

    case 'CPP_CMAKE': {
      console.log('[Scaffolder] → C++ + CMake…');
      // gcc:13-bookworm is Debian — uses apt-get. g++ is included; cmake and make are not.
      await execShell(container,
        'apt-get update -qq && apt-get install -y -qq cmake make 2>/dev/null; ' +
        'mkdir -p /workspace/src /workspace/build'
      );
      await writeWorkspaceFile(container, 'CMakeLists.txt', CPP_CMAKE_LISTS);
      await writeWorkspaceFile(container, 'src/main.cpp', CPP_MAIN);
      await writeWorkspaceFile(container, 'README.md', CPP_README);
      break;
    }

    case 'C_MAKE': {
      console.log('[Scaffolder] → C + Makefile…');
      // gcc:13-bookworm has gcc; install make explicitly
      await execShell(container, 'apt-get update -qq && apt-get install -y -qq make 2>/dev/null');
      await writeWorkspaceFile(container, 'main.c', C_MAIN);
      await writeWorkspaceFile(container, 'Makefile', C_MAKEFILE);
      await writeWorkspaceFile(container, 'README.md', C_README);
      break;
    }

    case 'NODE_BLANK': {
      console.log('[Scaffolder] → Node.js Blank…');
      await writeWorkspaceFile(container, 'index.js', NODE_BLANK_INDEX);
      await writeWorkspaceFile(container, 'package.json', NODE_BLANK_PACKAGE);
      await writeWorkspaceFile(container, 'README.md', NODE_BLANK_README);
      break;
    }
  }
}

// ─── Public Service ───────────────────────────────────────────────────────────

export class ContainerService {
  /**
   * Spawns a Docker container, mounts a persistent volume, and scaffolds the
   * chosen framework template with all packages installed and starter files written.
   */
  static async createProjectContainer(
    templateId: FrameworkTemplate,
    projectId: string
  ): Promise<ContainerConfig> {

    const imageMap: Record<FrameworkTemplate, string> = {
      NEXTJS_TAILWIND: 'node:20-alpine',
      PYTHON_FASTAPI:  'python:3.11-alpine',
      VANILLA_VITE:    'node:20-alpine',
      CPP_CMAKE:       'gcc:13-bookworm',
      RUST_CARGO:      'rust:1.78-alpine',
      GO_MODULE:       'golang:1.22-alpine',
      C_MAKE:          'gcc:13-bookworm',
      NODE_BLANK:      'node:20-alpine',
      PYTHON_BLANK:    'python:3.11-alpine',
    };

    const image = imageMap[templateId] ?? 'node:20-alpine';
    const isAlpine = image.includes('alpine');

    // Apple Silicon M1/M2 compatibility
    const platform = process.arch === 'arm64' ? 'linux/arm64' : 'linux/amd64';

    // Bind-mount a local host directory — files persist across container restarts
    const hostVolumePath = path.resolve(`/tmp/hackathon-accelerator/${projectId}`);

    console.log(`[Scaffolder] Pulling ${image} for project ${projectId}…`);
    await new Promise<void>((resolve, reject) => {
      docker.pull(image, { platform }, (err: Error | null, stream: NodeJS.ReadableStream | undefined) => {
        if (err) return reject(err);
        if (!stream) return reject(new Error('No stream returned from docker.pull'));
        docker.modem.followProgress(stream, (err: Error | null) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });

    console.log(`[Scaffolder] Creating container…`);

    // Pick a random ephemeral host port (30000–39999) for the container's app
    const hostPort = Math.floor(Math.random() * 10000) + 30000;

    const container = await docker.createContainer({
      Image: image,
      Cmd: ['tail', '-f', '/dev/null'],
      name: `hackathon-project-${projectId}`,
      WorkingDir: '/workspace',
      ExposedPorts: { '3000/tcp': {} },
      HostConfig: {
        AutoRemove: true,
        Binds: [`${hostVolumePath}:/workspace`],
        PortBindings: {
          '3000/tcp': [{ HostIp: '0.0.0.0', HostPort: String(hostPort) }],
        },
      },
      platform,
    }) as Docker.Container;

    await container.start();
    console.log(`[Scaffolder] Container ${container.id} started.`);

    // Check if a backup already exists in Supabase Storage (resumed project)
    const { data: backupCheck } = await supabase.storage
      .from('workspaces')
      .list(projectId, { search: 'backup.tar' });

    if (backupCheck && backupCheck.length > 0) {
      console.log(`[Scaffolder] Found existing backup for ${projectId}. Restoring from Supabase…`);
      await ContainerService.restoreWorkspace(projectId, container);
    } else {
      console.log(`[Scaffolder] New project — scaffolding ${templateId}…`);
      await scaffoldTemplate(container, templateId, projectId, isAlpine);
    }

    // Mark project as active in DB
    await supabase.from('projects').update({ status: 'active' }).eq('id', projectId);

    // Build the public preview URL:
    // - In production: derive the host from NEXT_PUBLIC_API_URL (e.g. https://synq.example.com → synq.example.com:hostPort)
    // - Locally: just localhost:hostPort
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const serverHost = new URL(apiBase).hostname;
    const protocol = new URL(apiBase).protocol; // 'http:' or 'https:'
    const previewUrl = `${protocol}//${serverHost}:${hostPort}`;

    // Store previewUrl on the project record so any collaborator can load it
    await supabase
      .from('projects')
      .update({ previewUrl })
      .eq('id', projectId);

    return {
      projectId,
      containerId: container.id,
      port: hostPort,
      previewUrl,
      status: 'running',
      platform,
      workspacePath: hostVolumePath,
    };
  }

  static async stopContainer(containerId: string): Promise<void> {
    const container = docker.getContainer(containerId);
    await container.stop();
  }

  /**
   * Downloads a project's tarball from Supabase Storage and extracts it
   * into the running Docker container via dockerode's putArchive.
   */
  static async restoreWorkspace(projectId: string, container: Docker.Container): Promise<void> {
    try {
      const backupPath = `${projectId}/backup.tar`;
      const { data, error } = await supabase.storage
        .from('workspaces')
        .download(backupPath);

      if (error || !data) {
        throw new Error(`Failed to download backup: ${error?.message || 'No data'}`);
      }

      const arrayBuffer = await data.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // putArchive extracts the tar into the container.
      // Since getArchive packs the "workspace" folder inside the tar,
      // extracting to "/" unpacks directly into /workspace.
      await container.putArchive(buffer, { path: '/' });
      console.log(`[Scaffolder] Successfully restored workspace from Supabase for ${projectId}`);
    } catch (err) {
      console.error(`[Scaffolder] Restoration failed for ${projectId}:`, err);
      throw err;
    }
  }
}
