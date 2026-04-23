# Build stage
FROM node:22-alpine AS builder

# Use alpine-based image and install only necessary dependencies
RUN apk add --no-cache openssl

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

# Only needed for prisma build
ARG DATABASE_URL

# Copy only necessary files for dependency installation
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY prisma ./prisma/

RUN pnpm install --frozen-lockfile \
  && pnpm prisma:generate \
  && pnpm store prune

# Copy source files and build
COPY . .
RUN pnpm build

# Production stage
FROM node:22-alpine

LABEL maintainer="FAIR Data Innovations Hub <contact@fairdataihub.org>" \
  description="This is a Nuxt 3 starter template for the FAIR Data Innovations Hub."

RUN apk add --no-cache openssl

WORKDIR /app

# Copy only the necessary files from builder stage
# COPY --from=builder /app/package.json ./
COPY --from=builder /app/.output ./
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Create startup script that runs migrations before starting the app
RUN echo '#!/bin/sh' > /app/start.sh && \
  # echo 'pnpm prisma:migrate:deploy' >> /app/start.sh && \
  echo 'exec node /app/server/index.mjs' >> /app/start.sh && \
  chmod +x /app/start.sh

EXPOSE 3000

CMD ["/bin/sh", "/app/start.sh"]