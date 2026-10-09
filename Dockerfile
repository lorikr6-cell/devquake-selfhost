# One image per app: docker build --build-arg APP=pulse -t devquake-pulse .
# Runs as a non-root user; everything it creates itself (secrets) lives in the /data volume.

FROM node:22-alpine AS build
ARG APP=pulse
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /repo
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile
RUN node scripts/select-app.mjs "$APP"
RUN pnpm --filter @devquake-selfhost/shell build

FROM node:22-alpine
ARG APP=pulse
LABEL org.opencontainers.image.source="https://github.com/lorikr6-cell/devquake-selfhost" \
      org.opencontainers.image.licenses="AGPL-3.0-only" \
      org.opencontainers.image.title="DevQuake ${APP} (self-hosted)"
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATA_DIR=/data
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app && mkdir -p /data && chown app:app /data
COPY --from=build --chown=app:app /repo/shell/.next/standalone ./
COPY --from=build --chown=app:app /repo/shell/.next/static ./shell/.next/static
USER app
EXPOSE 3000
VOLUME ["/data"]
# Up and the database reachable (the first start waits for MySQL and runs the migrations).
HEALTHCHECK --interval=15s --timeout=5s --start-period=120s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3000/api/_health > /dev/null || exit 1
CMD ["node", "shell/server.js"]
