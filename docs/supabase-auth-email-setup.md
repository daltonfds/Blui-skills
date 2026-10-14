# BluiSkill — Supabase Auth email setup

This repository cannot change the Supabase project's Auth sender or SMTP credentials by code alone. Configure these settings in the Supabase dashboard for the project used by BluiSkill.

## Sender identity
- Sender name: `BluiSkill`
- Sender email: `noreply@bluiskill.com` (or `support@bluiskill.com` if that address is configured and verified)
- Confirmation subject: `Confirme a sua conta na BluiSkill`

## Supabase dashboard steps
1. Open **Authentication → Email Templates → Confirm signup**.
2. Update the subject and body to use the BluiSkill name and confirmation URL variable provided by Supabase (normally `{{ .ConfirmationURL }}`). Keep the confirmation link intact.
3. Open **Authentication → SMTP Settings** (or **Providers → Email**, depending on dashboard version).
4. Configure a custom SMTP provider with the provider's host, port, username, password, and verified sender address. Do not commit SMTP credentials or service API keys to GitHub or client-side environment variables.
5. Verify DNS for `bluiskill.com` with the email provider: SPF, DKIM and, where supported, DMARC.
6. Save the configuration and test signup confirmation and password reset emails.

## Important
Changing the template changes the message branding, but changing the actual sender from “Supabase Auth” requires a configured custom SMTP sender/domain. The address must be owned or verified by the operator. Password reset templates should also use the BluiSkill name and preserve Supabase's reset URL variable.
