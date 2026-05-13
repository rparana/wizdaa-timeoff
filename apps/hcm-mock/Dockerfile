# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

FROM base AS installer
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/hcm-mock/package.json ./apps/hcm-mock/
RUN pnpm install --frozen-lockfile

COPY turbo.json tsconfig.json ./
COPY apps/hcm-mock ./apps/hcm-mock

RUN pnpm --filter @wizdaa/hcm-mock build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/hcm-mock/package.json ./apps/hcm-mock/
RUN pnpm install --frozen-lockfile --prod

COPY --from=installer /app/apps/hcm-mock/dist ./apps/hcm-mock/dist

ENV PORT=3001
EXPOSE 3001

CMD ["node", "apps/hcm-mock/dist/main.js"]
