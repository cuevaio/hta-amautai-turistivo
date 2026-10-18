# Amautai Project Status

## Last verified release

- Production: https://amautai.turistivo.com, running in the Turistivo Cloudflare account.
- Teacher onboarding, grade-2 Mathematics session drafts, legal pages, and custom authentication email are deployed.
- The private GitHub repository is `turistivo/amautai`. The local integration described below has not been pushed or deployed.

## Local integration

- Local onboarding, pixel artwork, Spanish routes, and the shared family dashboard sidebar are preserved on `codex/integrate-remote-games`.
- Remote commit `c873a3f` adds market/nursery games, named rooms, and room deletion. Its changes are integrated with the existing family sample and translations.
- Existing migration filenames are retained. The three pending game migrations were applied locally after a database backup; existing application data was unchanged.
- `pnpm run check` passes: architecture, lint, typechecking, 142 tests, and the production build/dry run.

## Next steps

1. Review the combined onboarding and game flows locally.
2. Push or deploy only when requested; neither action is included in this integration.

See [Profile onboarding](docs/PROFILE_ONBOARDING.md) for scope and data handling. See [Teacher onboarding](docs/TEACHER_ONBOARDING.md) for the existing learning-session workflow.
