# Property Management System Client

This is the Next.js frontend for the Property Management System. Complete setup instructions, including the Laravel API, are in the [repository README](../README.md).

## Client setup

From this directory:

```powershell
npm install
Set-Content .env.local "NEXT_PUBLIC_API_URL=http://localhost:8000/api"
```

The Laravel API must be running at `http://localhost:8000`. The API URL must include `/api`.

## Development

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validation

```powershell
npm run lint
npm run build
```
