# Amautai Project Status

## Last verified release

- Production: https://amautai.turistivo.com, running in the Turistivo Cloudflare account.
- Teacher onboarding, grade-2 Mathematics session drafts, legal pages, and custom authentication email are deployed.
- The private GitHub repository is `turistivo/amautai`. The latest documented release is pushed; current local work is uncommitted.

## In progress

- Adding teacher/parent profile selection and parent learning context.
- New profile API, UI, contracts, and migrations `0010`–`0011` are present locally.
- The work has not been verified with `pnpm run check`, deployed, or committed.

## Next steps

1. Verify all three locales and run `pnpm run check`.
2. Review the profile onboarding flow and database migrations.
3. Update this status after verification; deploy or push only when requested.

See [Profile onboarding](docs/PROFILE_ONBOARDING.md) for scope and data handling. See [Teacher onboarding](docs/TEACHER_ONBOARDING.md) for the existing learning-session workflow.
