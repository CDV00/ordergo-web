# syntax=docker/dockerfile:1

FROM node:20-alpine AS base

# Set timezone
RUN apk add --no-cache tzdata
ENV TZ=Asia/Ho_Chi_Minh
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS build

RUN apk add --no-cache \
  python3 \
  g++ \
  make \
  cairo-dev \
  pango-dev \
  pkgconfig

RUN corepack enable && corepack install -g yarn@4.1.1

ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_DEPLOY_TAG_OR_COMMIT_HASH

WORKDIR /opt

COPY yarn.lock package.json .yarnrc.yml ./

RUN yarn install --immutable

COPY . .

ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_PUBLIC_DEPLOY_TAG_OR_COMMIT_HASH=$NEXT_PUBLIC_DEPLOY_TAG_OR_COMMIT_HASH

RUN --mount=type=secret,id=sentry,env=SENTRY_AUTH_TOKEN yarn build

FROM base AS runtime

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

EXPOSE 3000

COPY --from=build --chown=nextjs:nodejs /opt/.next/standalone/ .

COPY --from=build --chown=nextjs:nodejs /opt/public ./public

COPY --from=build --chown=nextjs:nodejs /opt/.next/static ./.next/static

USER nextjs

CMD ["node", "./server.js"]
