# agents-linting.md — Linting-obedience
- All code must obey project's lint rules regardless of language; lint errors are build-blocking.
- Never suppress with `// eslint-disable` / `# noqa` without explanatory comment referencing approved exception.
- Multi-language → apply correct linter per file (`eslint`/`ruff`/`pylint`/`clang-format`/`prettier`/`biome`); never assume syntax correctness.
- New files must pass relevant linter before commit.
