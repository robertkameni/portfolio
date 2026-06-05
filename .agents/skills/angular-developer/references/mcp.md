# Angular CLI MCP Server

> **Angular 22:** The `onpush_zoneless_migration` tool helps migrate to OnPush (now the default CD strategy). See [angular-22.md](angular-22.md).

The Angular CLI includes a Model Context Protocol (MCP) server that enables AI assistants (like Cursor, Gemini CLI, JetBrains AI, etc.) to interact directly with the Angular CLI. It provides tools for project analysis, guided migrations, and running builds/tests.

**This repo enables the server in Cursor** via `.cursor/mcp.json` (server name: `angular-cli`; Cursor MCP id: `user-angular-cli`).

## Agent fact-check policy (MANDATORY)

Repo docs (`angular-22.md`, reference guides) are orientation only. **The Angular MCP server is the source of truth** for APIs, syntax, deprecations, and version-specific behavior.

**Do NOT** answer Angular API questions or write Angular code from training data alone.

### Required workflow

1. **`list_projects`** — first step for any Angular task in this repo. Read `frameworkVersion` and `path` (workspace `angular.json`).
2. **`get_best_practices`** — pass `workspacePath` from step 1 **before** creating or modifying Angular code.
3. **`search_documentation`** — fact-check concepts, APIs, and deprecations. Pass `version` from `frameworkVersion`. Check `searchedVersion` in the response.
4. **`find_examples`** — modern patterns (signals, `httpResource`, Signal Forms, `@defer`, etc.). Pass `workspacePath` from step 1.

### When to call which tool

| User intent | Tool |
| :---------- | :--- |
| "What is…?" / "Is X deprecated?" | `search_documentation` |
| "How do I…?" / implementation | `find_examples`, then `get_best_practices` |
| New component, service, route | `get_best_practices` first |
| Migration / OnPush / zoneless | `onpush_zoneless_migration` |
| Workspace layout, test framework | `list_projects` |

Prefer MCP tools over `run_terminal_command` for equivalent discovery and documentation tasks.

## Available Tools (Default)

When the MCP server is enabled, AI agents have access to the following tools:

| Name                        | Description                                                                                               |
| :-------------------------- | :-------------------------------------------------------------------------------------------------------- |
| `ai_tutor`                  | Launches an interactive AI-powered Angular tutor.                                                         |
| `get_best_practices`        | Retrieves the Angular Best Practices Guide (crucial for standalone components, typed forms, etc.).        |
| `list_projects`             | Lists all applications and libraries in the workspace by reading `angular.json`.                          |
| `find_examples`             | Curated, version-aligned official code examples (signals, forms, routing, etc.).                          |
| `onpush_zoneless_migration` | Analyzes code and provides a plan to migrate it to `OnPush` change detection (prerequisite for zoneless). |
| `search_documentation`      | Searches the official documentation at `https://angular.dev`.                                             |

## Experimental Tools

Some tools must be enabled explicitly using the `--experimental-tool` (or `-E`) flag.

| Name                       | Description                                                           |
| :------------------------- | :-------------------------------------------------------------------- |
| `build`                    | Performs a one-off build using `ng build`.                            |
| `devserver.start`          | Asynchronously starts a dev server (`ng serve`). Returns immediately. |
| `devserver.stop`           | Stops the dev server.                                                 |
| `devserver.wait_for_build` | Returns the logs of the most recent build in a running dev server.    |
| `e2e`                      | Executes end-to-end tests.                                            |
| `test`                     | Runs the project's unit tests.                                        |

## Configuration

To use the MCP server, you configure your host environment (IDE or CLI) to run `npx @angular/cli mcp`.

### Antigravity IDE

Create a file named `.antigravity/mcp.json` in your project's root:

```json
{
  "mcpServers": {
    "angular-cli": {
      "command": "npx",
      "args": ["-y", "@angular/cli", "mcp"]
    }
  }
}
```

### Gemini CLI

Create `.gemini/settings.json` in the project root:

```json
{
  "mcpServers": {
    "angular-cli": {
      "command": "npx",
      "args": ["-y", "@angular/cli", "mcp"]
    }
  }
}
```

### Cursor

This repo ships `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "angular-cli": {
      "command": "npx",
      "args": ["-y", "@angular/cli", "mcp"]
    }
  }
}
```

Reload MCP in Cursor after changes. Agents call tools via the `user-angular-cli` MCP server.

### VS Code

Create `.vscode/mcp.json`:

```json
{
  "servers": {
    "angular-cli": {
      "command": "npx",
      "args": ["-y", "@angular/cli", "mcp"]
    }
  }
}
```

## Command Options

You can pass arguments to the MCP server in the `args` array of your configuration:

- `--read-only`: Only registers tools that do not modify the project.
- `--local-only`: Only registers tools that do not require an internet connection.
- `--experimental-tool` (`-E`): Enables specific experimental tools (e.g., `-E build`, `-E devserver`).

Example for read-only mode with experimental tools enabled:

```json
"args": ["-y", "@angular/cli", "mcp", "--read-only", "-E", "build", "-E", "test"]
```
