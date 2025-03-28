# Authentication Tokens Directory

This directory contains authentication tokens for various services, primarily for Google Search Console integration.

## Structure

- `gsc_token_{brand_id}.json`: OAuth2 refresh tokens for Google Search Console, per brand
- Each token file contains the credentials needed for programmatic access to the APIs

## Security Notes

- Never commit these tokens to the repository (the directory is gitignored)
- In production and staging, this directory is mounted as a volume to the Docker containers
- For local development, tokens are stored in this directory when authenticating via the OAuth flow

## Generating Tokens

See the [Staging Setup Guide](docs/setup/STAGING_SETUP.md) for instructions on generating tokens for Google Search Console.

## Token Format Example

Google Search Console token JSON format:
```json
{
  "token": "ya29.a0AfB_...",
  "refresh_token": "1//03n...",
  "token_uri": "https://oauth2.googleapis.com/token",
  "client_id": "195746621463-...",
  "client_secret": "GOCSPX-...",
  "scopes": ["https://www.googleapis.com/auth/webmasters.readonly"],
  "expiry": "2025-03-28T14:23:01.234567"
}
```

## Troubleshooting

If authentication is failing:
1. Check if the token file exists
2. Verify token expiration date
3. Delete the token file and re-authenticate if needed
4. Check for permission issues (the container process needs read/write access)