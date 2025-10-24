# Multi-stage build for Node.js API
FROM node:18-alpine AS builder

WORKDIR /app

COPY server/package*.json ./
RUN npm ci --only=production

COPY server/ ./

RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

COPY server/package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/database/schema.sql ./dist/database/

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["node", "dist/index.js"]