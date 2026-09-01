// ─────────────────────────────────────────────────────────
// Twilio Verify Configuration
//
// Steps to get these credentials:
// 1. Go to https://www.twilio.com/try-twilio  (free trial, no credit card needed)
// 2. Verify your phone number during signup
// 3. From the Twilio Console Dashboard, copy:
//    - Account SID  (starts with "AC...")
//    - Auth Token   (click "Show" to reveal)
// 4. Go to: Explore Products → Verify → Services → Create Service
//    - Name it anything (e.g. "WorldEvents")
//    - Copy the Service SID (starts with "VA...")
// 5. Paste all three values below and save the file
// ─────────────────────────────────────────────────────────

export const TWILIO_CONFIG = {
  ACCOUNT_SID:  'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // ← replace this
  AUTH_TOKEN:   'your_auth_token_here',              // ← replace this
  SERVICE_SID:  'VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // ← replace this (Verify Service SID)
};
