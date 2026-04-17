# Stage 1: Build
FROM node:22-alpine AS build

WORKDIR /app

# Copy web package files and install
COPY web/package.json web/package-lock.json ./
RUN npm ci

# Copy web source
COPY web/ .

ARG APP_VERSION=0.1.0
ARG GIT_SHA=unknown

RUN npm run build
RUN npm prune --production
RUN npm install --os=linux --libc=musl --cpu=x64 sharp

# Stage 2: Production
FROM node:22-alpine

WORKDIR /app

COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/data ./data-seed

# Copy content directories from repo root — the universe
COPY jardim/      ./content-seed/jardim/
COPY membros/     ./content-seed/membros/
COPY missoes/     ./content-seed/missoes/
COPY quadro/      ./content-seed/quadro/
COPY comunidades/ ./content-seed/comunidades/
COPY modelos/     ./content-seed/modelos/
COPY schema.yaml  ./content-seed/schema.yaml
COPY sobre.md     ./content-seed/sobre.md

ARG APP_VERSION=0.1.0
ARG GIT_SHA=unknown

LABEL org.opencontainers.image.version="${APP_VERSION}"
LABEL org.opencontainers.image.revision="${GIT_SHA}"

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/app/data/artelonga.db
ENV UPLOAD_DIR=/app/data/uploads
ENV CONTENT_DIR=/app/data/content
ENV APP_VERSION=${APP_VERSION}
ENV GIT_SHA=${GIT_SHA}

EXPOSE 3000

CMD ["sh", "-c", "\
  mkdir -p /app/data/uploads /app/data/content && \
  if [ ! -f /app/data/artelonga.db ]; then \
    echo 'First run: seeding database...' && \
    cp -r /app/data-seed/* /app/data/ 2>/dev/null; \
    node --import tsx scripts/seed.ts || true; \
  fi && \
  cp -r /app/content-seed/* /app/data/content/ 2>/dev/null; \
  echo 'Importing content...' && \
  node --import tsx scripts/content-import.ts && \
  exec node build/index.js \
"]
