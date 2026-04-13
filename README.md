# Boothly

A browser-based photo booth service. Take photos with your webcam, apply decorative frames, and download the result — all without installing an app.

**Live →** [boothly.site](https://boothly.site)

---

## Features

- Webcam capture with multi-shot support
- Frame color & template customization
- Real-time preview with flash animation
- Download finished photos as PNG
- Mobile-responsive layout
- Korean / English i18n

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 18, TypeScript, Vite 6 |
| Styling | Tailwind CSS v4 |
| UI Components | Radix UI, Lucide React, Sonner |
| Backend / DB | Supabase |
| Deployment | Netlify (GitHub auto-deploy) |

## Getting Started

```bash
# 1. Clone
git clone https://github.com/xxcordeau/Boothly.git
cd Boothly

# 2. Install
npm install

# 3. Set environment variables
cp .env.example .env.local
# Fill in VITE_SUPABASE_PROJECT_ID and VITE_SUPABASE_ANON_KEY

# 4. Run
npm run dev
```

### Environment Variables

```
VITE_SUPABASE_PROJECT_ID=your_project_id
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Project Structure

```
src/
├── components/       # UI components (CameraPreview, FrameColorSelector, …)
├── pages/            # Route-level pages
├── utils/            # Supabase client, helpers
└── styles/           # Global CSS & animations
```

## License

MIT
