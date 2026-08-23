# Sentient Proxy

**Classification:** Active project · **Status:** Maintained frontend experiment

A React and Vite frontend experiment that animates a field of drifting flag icons. It is currently a client-side project; references to future AI or backend integration describe possible extensions, not implemented services.

## Stack

- React 19 and Vite.
- Framer Motion and Recharts where used by the frontend.
- ESLint for code quality.
- GitHub Actions for dependency installation, linting, and production builds.

## Development

```bash
npm ci
npm run dev
```

## Validation

```bash
npm run lint
npm run build
```

The production build is written to `dist/`. Animation behavior can be inspected and adjusted in `src/SentientProxy.jsx`.

## Project boundaries

No backend, deployed AI service, or live API integration should be assumed from this repository alone. Historical ideas can be revisited without treating them as completed functionality.
