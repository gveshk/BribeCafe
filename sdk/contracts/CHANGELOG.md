# @bribecafe/contracts changelog

All notable contract changes must be recorded here.

## Versioning convention

- **Path-versioned contracts** are exposed as `@bribecafe/contracts/v1`.
- Additive, backward-compatible updates can be released under the same major API path (`v1`) with package minor/patch bumps.
- Breaking changes MUST ship under a new path namespace (e.g. `v2`) and include a migration note.

## Entry format

Use this format for each release:

```md
## [<package-version>] - YYYY-MM-DD
### Added
- ...

### Changed
- ...

### Deprecated
- ...

### Removed
- ...

### Breaking
- If present, must include migration guidance and target version path.
```

## [1.0.0] - 2026-03-17
### Added
- Initial `v1` contracts for agents, tables, messages, quotes, contracts, escrow, and disputes.
- Shared request/response schemas for backend routes and inferred DTO types.
