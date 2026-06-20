# Airchatty — production image (web interface + server-side MP4 rendering).
# Renders with Remotion, which needs a headless Chromium plus its system libs.
FROM node:22-bookworm-slim

# System libraries required by headless Chromium + colour-emoji font so emojis
# render in the video the same way they do on a phone.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates fonts-liberation fonts-noto-color-emoji \
    libnss3 libdbus-1-3 libatk1.0-0 libatk-bridge2.0-0 libasound2 \
    libxrandr2 libxkbcommon0 libxfixes3 libxcomposite1 libxdamage1 \
    libxext6 libxcb1 libxss1 libglib2.0-0 libgbm1 libgtk-3-0 \
    libpango-1.0-0 libcairo2 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install ALL dependencies (incl. ts-node/esbuild used at runtime) regardless of
# NODE_ENV, then pre-download the Chromium shell so the first render is instant.
COPY package*.json ./
RUN npm install --include=dev
RUN npx remotion browser ensure

COPY . .

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["npm", "start"]
