# n8n Workflows (SSOT)

This folder contains **source-controlled** n8n workflow JSON templates for the "找風問幸福" LINE OA launch.

## Goal (MVP)
- LINE Messaging API webhook → n8n
- n8n routes inbound text + lineUserId → Zoho Creator **native API** (wrapper endpoint)
- Zoho returns `{ok, blocked, message, meta}`
- n8n replies to LINE with `message`

## Notes
- These JSON files are designed to be imported into n8n (UI or CLI).
- Credentials are **not** stored in git. Use n8n credentials manager.

## Workflows
- `workflows/LINE_Webhook__Router.json`
- `workflows/LINE_Webhook__Reply.json`

## Required environment/credentials
- LINE: Channel secret + Channel access token
- Zoho: Creator API auth (OAuth connection) + app/endpoint

## Import
- UI: Workflows → Import from File
- CLI: `n8n import:workflow --input <file>` (if n8n CLI is installed)
