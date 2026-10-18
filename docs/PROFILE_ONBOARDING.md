# Profile onboarding

After sign-in, users choose one role: teacher or parent. Existing teacher profiles are migrated as teachers.

Parents save one learning context per workspace: primary grade (1–6), optional location/community, and optional language. Do not collect a child's name, address, or identifying details in this flow. Data is stored in `family_profiles` and can be edited from the parent home.

`GET` and `PUT /api/profile/family` require the authenticated user to have the parent role. The server derives the user and workspace from the verified session. Migrations: `0010_account_profiles.sql` and `0011_family_profiles.sql`.

Parents can open `/panel/familia/jugar` after signing in, choosing the parent role, and saving a family profile. The three-round sample is fixed to second-grade multiplication; it is not AI-generated or personalized from the saved family context. Its score is not saved. No named student records are collected.
