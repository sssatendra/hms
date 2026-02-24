FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

# Dependencies
FROM base AS deps
COPY package*.json ./
RUN npm i --only=production

# Builder
FROM base AS builder
COPY package*.json ./
RUN npm i
COPY . .
RUN npx prisma generate
RUN npm run build

# Runner
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

RUN mkdir -p logs && chown nodejs:nodejs logs

USER nodejs

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
