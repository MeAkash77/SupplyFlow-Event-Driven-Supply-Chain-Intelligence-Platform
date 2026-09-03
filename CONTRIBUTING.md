# Contributing to EasyFlow

Welcome! EasyFlow is designed to become an open source workflow orchestration platform for supply chain operations. We welcome contributions from developers, designers, and operators.

## How to Get Started

1. Fork the repository.
2. Create a feature branch from `main`.
3. Open a PR with a clear title and description.
4. Add tests for new behavior and update documentation as needed.

## Branch Naming

Use descriptive branch names such as:

- `feature/tenant-onboarding`
- `fix/rabbitmq-retry`
- `docs/connector-guide`

## PR Guidelines

- Keep PRs focused on one feature or bug.
- Include screenshots or example requests when UI or API behavior changes.
- Document any new public API endpoints or design decisions.
- Prefer small, incremental improvements.

## Code Style

- Python code should follow standard Python conventions.
- Frontend code should use Tailwind classes and the existing component styling patterns.
- Keep imports organized and avoid unused dependencies.

## Testing

- Backend testing: `python -m unittest discover -s tests`
- Frontend testing is not yet configured in this repo; add tests for new components when possible.

## Documentation

Good docs are part of every PR. Add or update:

- `README.md`
- `ARCHITECTURE.md`
- `CONTRIBUTING.md`
- in-code comments for complex logic

## Reporting Issues

If you find a bug or want to request a feature, please open an issue with:

- a short title
- reproduction steps
- expected vs actual behavior
- relevant logs or screenshots

## Roadmap Contribution

If you want to help with the roadmap, start with these areas:

- `auth` and tenant onboarding
- connector SDK and integration adapters
- workflow execution persistence and state history
- notifications and alert channels
- AI operational insights

Thanks for helping make EasyFlow a production-ready open source product.
