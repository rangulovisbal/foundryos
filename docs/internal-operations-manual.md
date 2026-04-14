# Internal Operations Manual

## Founder workflow

### Daily

- review new leads in `/admin`
- qualify inbound requests
- review payment and onboarding activity
- resolve failed lead or checkout flows

### Weekly

- inspect funnel metrics
- review Snapshot outputs used by clients
- update landing and message if objections repeat
- review support load and repeated manual work

### Monthly

- review churn and activation
- evaluate which manual tasks deserve automation
- refine ICP focus
- review cost per account and LLM routing

## Lead handling process

1. Lead enters from site form
2. API validates and stores
3. Optional Resend notifications are sent
4. Lead appears in admin panel
5. Founder qualifies and routes to Snapshot sale or call

## Payment process

1. User clicks checkout on pricing page
2. Stripe Checkout hosts the payment step
3. User returns to success URL
4. Webhook stores subscription/payment metadata

## Admin process

1. Use `ADMIN_ACCESS_TOKEN` to access `/admin/login`
2. Review lead queue
3. Track storage mode: local or Neon
4. Use docs for compliance and response patterns

## Product iteration process

1. Review manual support requests
2. Tag repeatable questions
3. Convert repeated work into SOPs
4. Convert stable SOPs into automations
5. Add metrics before expanding scope

## Launch checklist

- product pages reviewed
- Stripe connected
- Neon connected
- Resend connected
- Turnstile connected
- domain connected in Vercel
- legal pack reviewed
- admin token rotated
- final smoke test run on production URL
