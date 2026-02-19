# Sandbox Custom Users (Plaid Test Data)

## Sandbox Deployment (CRITICAL)

**Every push to the GitHub `sandbox` branch triggers automatic deployment of the sandbox environment. Code goes live in sandbox immediately.**

This applies across all Disburso repositories:
- **disburso-ai-core**: Push to `sandbox` → backend deploys to `disburso-api-sandbox` on Heroku
- **disburso-ai-frontend**: Push to `sandbox` → frontend deploys to `disburso-frontend-sandbox` on Heroku

**Do NOT push untested code to the `sandbox` branch in any Disburso repo. It deploys automatically and is a live environment.**

## About This Repo

This repository contains custom JSON test users for Plaid Sandbox testing. These files are used to test complex or custom banking/identity scenarios in the Plaid Sandbox environment.

- Test user JSON files are added via the [Plaid Dashboard Test Users page](https://dashboard.plaid.com/developers/sandbox?tab=testUsers)
- Dates are auto-updated daily by `update_dates.py` so transactions stay within valid ranges
- Never contribute real user data

## Git Workflow

- **Default branch**: `main`
- **PR target**: `main`
