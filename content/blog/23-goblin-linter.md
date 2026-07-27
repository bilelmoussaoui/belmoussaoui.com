+++
title = "goblint: A Linter for GObject C Code"
date = 2026-04-11
draft = false

[taxonomies]
categories = ["Tools", "GNOME"]
tags = ["C", "GObject", "Linting"]

[extra]
lang = "en"
toc = true
math = false
mermaid = false
cc_license = true
outdate_warn = false
+++

Over the past week, I’ve been building **goblint**, a linter specifically designed for GObject-based C codebases.

If you know Rust’s `clippy` or Go’s `go vet`, think of goblint as the same thing for GObject/GLib.

## Why this exists

A large part of the Linux desktop stack (GTK, Mutter, Pango, NetworkManager) is built on GObject. These projects have evolved over decades and carry a lot of patterns that predate newer GLib helpers, are easy to misuse, or encode subtle lifecycle invariants that nothing verifies.

This leads to issues like missing `dispose`/`finalize`/`constructed` chain-ups (memory leaks or undefined behavior), incorrect property definitions, uninitialized `GError*` variables, or function declarations with no implementation.

These aren’t theoretical. [This GTK merge request](https://gitlab.gnome.org/GNOME/gtk/-/merge_requests/9789) recently fixed several missing chain-ups in example code.

Despite this, the C ecosystem lacks a linter that understands GObject semantics. goblint exists to close that gap.

## What goblint checks

goblint ships with [**35 rules**](https://github.com/bilelmoussaoui/goblint/blob/main/RULES.md) across different categories:

- **Correctness**: Real bugs like non-canonical property names, uninitialized `GError*`, missing `PROP_0`
- **Suspicious**: Likely mistakes like missing implementations or redundant NULL checks
- **Style**: Idiomatic GLib usage (`g_strcmp0`, `g_str_equal()`)
- **Complexity**: Suggests modern helpers (`g_autoptr`, `g_clear_*`, `g_set_str()`)
- **Performance**: Optimizations like `G_PARAM_STATIC_STRINGS` or `g_object_notify_by_pspec()`
- **Pedantic**: Consistency checks (macro semicolons, matching declare/define pairs)

**23 out of 35 rules are auto-fixable.** You should apply fixes one rule at a time to review the changes:

```bash
goblint --fix --only use_g_strcmp0
goblint --fix --only use_clear_functions
```

## CI/CD Integration

goblint fits into existing pipelines.

### GitHub Actions

```yaml
- name: Run goblint
  run: goblint --format sarif > goblint.sarif

- name: Upload SARIF results
  uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: goblint.sarif
```

Results show up in the Security tab under "Code scanning" and inline on pull requests.

### GitLab CI

```yaml
goblint:
  image: ghcr.io/bilelmoussaoui/goblint:latest
  script:
    - goblint --format sarif > goblint.sarif
  artifacts:
    reports:
      sast: goblint.sarif
```

Results appear inline in merge requests.

## Configuration

Rules default to `warn`, and can be tuned via `goblint.toml`:

```toml
min_glib_version = "2.40" # Auto-disable rules for newer versions

[rules]
g_param_spec_static_name_canonical = "error" # Make critical
use_g_strcmp0 = "warn" # Keep as warning
use_g_autoptr_inline_cleanup = "ignore" # Disable

# Per-rule ignore patterns
missing_implementation = { level = "error", ignore = ["src/backends/**"] }
```

You can adopt it gradually without fixing everything at once.

## Try it

```bash
# Run via container
podman run --rm -v "$PWD:/workspace:Z" ghcr.io/bilelmoussaoui/goblint:latest

# Install locally
cargo install --git https://github.com/bilelmoussaoui/goblint goblint

# Usage
goblint              # Lint current directory
goblint --fix        # Apply automatic fixes
goblint --list-rules # Inspect available rules
```

The [project](https://github.com/bilelmoussaoui/goblint) is early, so feedback is especially valuable (false positives, missing checks, workflow issues, etc.).

---

**Note:** The project was originally named "goblin" but was renamed to "goblint" to avoid conflicts with the existing [goblin](https://crates.io/crates/goblin) crate for parsing binary formats.
