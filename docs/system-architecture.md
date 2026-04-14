# System Architecture

## Product layers

### 1. Acquisition layer

- Landing page
- Pricing page
- SEO primitives
- Lead capture form
- UTM capture
- Optional Cloudflare Turnstile

### 2. Conversion layer

- Stripe Checkout session API
- Pricing plan abstraction
- Hosted payment only
- No direct storage of payment card data

### 3. Diagnostic layer

- Snapshot intake form
- Heuristic scoring engine
- OpenAI-ready upgrade path
- Dashboard demo seeded from the same engine

### 4. Operations layer

- Admin login with secure cookie
- Admin dashboard with lead queue
- Local storage fallback for development
- Neon-ready persistence for production

### 5. Communications layer

- Resend outbound notifications
- Lead receipt confirmation
- Internal new-lead notification

### 6. Security layer

- Security headers through middleware
- Rate limiting on public APIs
- Optional Cloudflare Turnstile
- Admin token gate
- Stripe webhook verification

## Data model

### Leads

- id
- name
- email
- company
- website
- team size
- message
- source
- status
- consent
- snapshot requested
- UTM tags
- turnstile verification
- created at / updated at

### Subscriptions

- id
- email
- company
- plan id
- status
- Stripe customer id
- Stripe subscription id
- metadata
- created at / updated at

## Runtime strategy

- static marketing routes where possible
- server routes for lead intake, checkout and webhooks
- Neon when `DATABASE_URL` exists
- local JSON fallback when Neon is absent

## Scaling decisions already reflected

- payment offloaded to Stripe Checkout
- email offloaded to Resend
- bot protection offloaded to Cloudflare
- database abstraction prepared for Neon
- API boundaries separated from UI
- internal docs embedded in repo

## Next evolution points

- replace token-based admin with managed auth
- move heuristic scoring to hybrid heuristic + LLM pipeline
- add customer accounts and workspace model
- add billing portal route
- add analytics events and attribution dashboards
