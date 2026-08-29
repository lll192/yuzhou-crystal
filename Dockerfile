# Yuzhou Crystal inquiry backend — container image
FROM node:20-alpine

WORKDIR /app

# Install deps first for better layer caching
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund

# App code
COPY . .

# Runtime data & uploads persisted via volume
RUN mkdir -p /app/data /app/uploads \
  && chown -R node:node /app/data /app/uploads

ENV NODE_ENV=production

EXPOSE 3000
VOLUME ["/app/data", "/app/uploads"]

# Run as non-root
USER node
CMD ["node", "server.js"]
