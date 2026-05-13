# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

FROM base AS installer
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/database/package.json ./packages/database/
COPY apps/worker/package.json ./apps/worker/
RUN pnpm install --frozen-lockfile

COPY turbo.json tsconfig.json ./
COPY packages/database ./packages/database
COPY apps/worker ./apps/worker

RUN pnpm --filter @wizdaa/database build
RUN pnpm --filter @wizdaa/worker build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/database/package.json ./packages/database/
COPY apps/worker/package.json ./apps/worker/
RUN pnpm install --frozen-lockfile --prod

COPY --from=installer /app/packages/database/prisma ./packages/database/prisma
COPY --from=installer /app/packages/database/dist ./packages/database/dist
COPY --from=installer /app/apps/worker/dist ./apps/worker/dist

RUN pnpm --filter @wizdaa/database exec prisma generate --schema=prisma/schema.prisma

ENV PORT=3002
EXPOSE 3002
ENV DATABASE_URL=file:/data/app.db

CMD ["sh", "-c", "pnpm --filter @wizdaa/database exec prisma migrate deploy --schema=prisma/schema.prisma && node apps/worker/dist/main.js"]
