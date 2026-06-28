[![Forge with Alphinium](https://img.shields.io/badge/🔨_Forge_with_Alphinium-Build_Your_Version-6366f1?style=for-the-badge&logo=github)](https://alphinium.com/forge?template=pet-services)

> **This is an Alphinium template.** Click the badge above to fork this project and have an AI agent build your customised version automatically.

---

# Pawfect Grooming

Pawfect Grooming is a warm, playful Expo React Native demo for a pet services business.

## Highlights
- Premium pet salon landing page
- 12 grooming services across dogs, cats, and small animals
- 3-step booking flow
- My Pets + loyalty progress
- Pepper chat widget positioned as a ChatInstance demo

## Local run
```bash
npm install --legacy-peer-deps
npx expo install react-dom react-native-web @expo/metro-runtime
CI=1 npx expo start --web --port 8097 --clear
```

## Build
```bash
npm run build
```

## Configuration

Copy `.env.example` to `.env` and set values as needed:

| Variable | Description | Default | Notes |
|---|---|---|---|
| `EXPO_PUBLIC_API_URL` | Strapi backend URL | _(empty)_ | Set to your Strapi pod URL; leave empty to use static data |
| `EXPO_PUBLIC_API_TOKEN` | Strapi bearer token | _(empty)_ | Optional — only needed for restricted Strapi content |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_test_REPLACE_ME` | Replace with your Stripe test/live key |
| `EXPO_PUBLIC_APP_NAME` | App display name | `FurSnips` | Shown in the UI and app metadata |
| `EXPO_PUBLIC_APP_SCHEME` | Deep link scheme | `fursnips` | Must match `scheme` in `app.json` |
| `EXPO_PUBLIC_OAUTH_PROVIDERS` | Enabled login providers | `github,google,email` | Comma-separated: `github`, `google`, `facebook`, `email` |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Google OAuth web client ID | _(empty)_ | Required for Google social login |
| `EXPO_PUBLIC_FACEBOOK_APP_ID` | Facebook App ID | _(empty)_ | Required for Facebook social login |
| `EXPO_PUBLIC_GA_ID` | GA4 Measurement ID | `G-X09N3J8X17` | Override with your own GA property when going live |

> Built with [alphinium](https://alphinium.com) — autonomous AI development agents
