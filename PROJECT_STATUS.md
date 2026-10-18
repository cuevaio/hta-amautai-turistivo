# Amautai Project Status

## Last verified release

- Production: https://amautai.turistivo.com, running in the Turistivo Cloudflare account.
- Teacher onboarding, grade-2 Mathematics session drafts, legal pages, and custom authentication email are deployed.
- The private GitHub repository is `turistivo/amautai`. The integrated code is included in `master`; production deployment remains a separate action.

## Local integration

- Local onboarding, pixel artwork, Spanish routes, and the shared family dashboard sidebar are preserved. Integration originated on `codex/integrate-remote-games` and is included in `master`.
- Remote changes through `73a0942` are integrated with the local game work. The family sample is replaced locally by [saved multi-child family games](docs/FAMILY_GAMES.md), reusing all five active teacher games.
- Existing migration filenames are retained. The three pending game migrations were applied locally after a database backup; existing application data was unchanged.
- The current local `pnpm run check` passes: architecture, lint, typechecking, 121 Worker tests, 40 web tests, four gateway tests, eleven architecture fixtures, and the production build/dry run.

## Next steps

1. Review the combined onboarding and game flows locally.
2. Deploy and verify the integrated version only when requested.

See [Profile onboarding](docs/PROFILE_ONBOARDING.md) for scope and data handling. See [Teacher onboarding](docs/TEACHER_ONBOARDING.md) for the existing learning-session workflow.
