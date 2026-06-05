# Automatic Migrations & Code Modernization

> **Angular 22:** See [angular-22.md](angular-22.md) for what changed when upgrading (OnPush default, FetchBackend, incremental hydration, stable Resource API and Signal Forms).

When tasked with refactoring or modernizing an existing codebase, always prefer using the official automated schematics available in `@angular/core` over manual text replacement.

## Upgrading to Angular 22

```bash
ng update @angular/core@22 @angular/cli@22
```

`ng update` typically:

- Sets `ChangeDetectionStrategy.Eager` on components that had no explicit strategy (preserves pre-v22 behavior)
- Adds `withXhr()` to `provideHttpClient` when upload progress is used
- Applies hydration / incremental hydration schematics where needed

After upgrade:

- Remove deprecated `withFetch()` from `provideHttpClient` (Fetch is the default backend)
- Adopt stable `httpResource` / `resource` instead of experimental flags
- Adopt Signal Forms for new forms; use compat layer for legacy reactive forms

## Discovering Migrations

To view all available schematics for the installed version of the core framework, run:
`ng generate @angular/core: --help`

## Common Migration Schematics

Use the following commands to apply specific syntax updates. You can scope these commands to a specific project or directory using the `--project <name>` or `--path <dir>` flags.

| Feature to Modernize      | Command to Execute                                          |
| :------------------------ | :---------------------------------------------------------- |
| **Built-in Control Flow** | `ng generate @angular/core:control-flow`                    |
| **Signal-based Inputs**   | `ng generate @angular/core:signal-input-migration`          |
| **Signal Queries**        | `ng generate @angular/core:signal-queries-migration`        |
| **Functional Outputs**    | `ng generate @angular/core:output-migration`                |
| **`inject()` Function**   | `ng generate @angular/core:inject`                          |
| **Self-Closing Tags**     | `ng generate @angular/core:self-closing-tag`                |
| **Standalone**            | `ng generate @angular/core:standalone` (See workflow below) |

## Specialized Workflow: Migrating to Standalone

The Standalone migration is an interactive, multi-step refactoring. You **MUST** perform this in three discrete stages, verifying that the application builds and runs correctly after each stage completes:

1. **Phase 1**: Run `ng generate @angular/core:standalone` and select the option to **Convert all components, directives, and pipes to standalone**.
2. **Phase 2**: Verify the build with `ng build`. Run the command again and select **Remove unnecessary NgModule classes**.
3. **Phase 3**: Verify the build with `ng build`. Run the final pass and select **Bootstrap the project using standalone APIs**.
