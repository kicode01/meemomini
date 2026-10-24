# meemomini

Progressive web photo booth app built with React, TypeScript, Vite, Tailwind CSS, and shadcn/ui.

Camera-first: live preview, AR filters, real-time background removal, then export
to still, GIF or MP4 and share by QR code. Installable as a PWA.

| Area | Where it lives |
| :-- | :-- |
| Camera, capture, composition | `src/components/CameraView.tsx` |
| Background removal | MediaPipe `ImageSegmenter` — `src/hooks/useBackgroundSegmentation.ts` |
| AR filters | Jeeliz demos embedded as iframes — `src/utils/jeelizFilters.json` |
| Export (still / GIF / MP4) | `gif.js`, `mp4-muxer`, `html-to-image` |
| Storage and auth | Firebase |

## Environment

Copy `.env.example` to `.env` and fill in the Firebase web config. The Cloudinary
values are only needed for the upload path.

## Not committed: the AR filter bundle

`public/jeelizFaceFilter/` is a vendored copy of the Jeeliz face-filter demos. It
is around 349 MB, ships its own licence, and includes demo keys (a private RSA
key used by its local https server) — so it is excluded via `.gitignore` rather
than committed.

Everything else runs without it. With the folder missing, the AR filter list has
nothing to load into its iframe; capture, background segmentation, export and
sharing are unaffected.

## Requirements

- Node.js 18 or later
- npm

## Local development

```sh
npm install
npm run dev
```

The app is served at the address Vite prints in the terminal (normally `http://localhost:8080`).

To run the frontend and local server together:

```sh
npm run dev:all
```

## Production build

```sh
npm run build
npm run preview
```

Deploy the generated `dist` directory to any static hosting provider that supports single-page applications.
