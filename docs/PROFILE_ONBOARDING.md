# Profile onboarding

After sign-in, users choose one role: teacher or parent. Existing teacher profiles are migrated as teachers.

Parents save one learning context per workspace: primary grade (1–6), city, and main language. All three fields are required. Do not collect a child's name, address, or identifying details in this flow. Data is stored in `family_profiles`.

`GET` and `PUT /api/profile/family` require the authenticated user to have the parent role. The server derives the user and workspace from the verified session. Migrations: `0010_account_profiles.sql` and `0011_family_profiles.sql`.

Keep the existing migration filenames when integrating the game migrations. D1 tracks the complete filename, so the shared `0010` and `0011` prefixes do not replay applied profile migrations. Profile tables and game alterations are independent.

The family home uses the shared dashboard sidebar. Profile selection and registration keep their own loading layout.

Parents can open `/panel/familia/jugar` after signing in, choosing the parent role, and saving a family profile. The three-round sample is fixed to second-grade multiplication; it is not AI-generated or personalized from the saved family context. Its score is not saved. No named student records are collected.
