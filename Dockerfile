# syntax=docker/dockerfile:1.7

# ─── Base ─────────────────────────────────────────────────
FROM node:20-alpine AS base
ENV TZ=Asia/Ho_Chi_Minh
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache tzdata libc6-compat \
 && cp /usr/share/zoneinfo/$TZ /etc/localtime \
 && echo $TZ > /etc/timezone
WORKDIR /opt

# ─── Install deps ─────────────────────────────────────────
FROM base AS deps
COPY package.json yarn.lock ./
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
    yarn install --frozen-lockfile

# ─── Build ────────────────────────────────────────────────
FROM base AS build
ARG NEXT_PUBLIC_API_URL=http://localhost:4000/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY --from=deps /opt/node_modules ./node_modules
COPY . .
RUN yarn build

# ─── Runtime (Next.js standalone) ─────────────────────────
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV TZ=Asia/Ho_Chi_Minh
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN apk add --no-cache tzdata wget \
 && cp /usr/share/zoneinfo/$TZ /etc/localtime \
 && echo $TZ > /etc/timezone

WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=build --chown=nextjs:nodejs /opt/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /opt/public ./public
COPY --from=build --chown=nextjs:nodejs /opt/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

CMD ["node", "server.js"]
