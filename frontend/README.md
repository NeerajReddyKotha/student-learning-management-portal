# LMS Frontend Service (Next.js + TypeScript)

This is the Next.js App Router frontend for the LMS Platform.

## Technology Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Getting Started

### Local Development
```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env.local

# 3. Start development server
npm run dev
```

### Health Check Endpoint
- **Frontend Health**: `GET http://localhost:3000/api/health`
