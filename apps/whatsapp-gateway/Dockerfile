FROM node:22-bookworm-slim
RUN corepack enable && corepack prepare pnpm@11.25.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/whatsapp-gateway/package.json apps/whatsapp-gateway/package.json
RUN pnpm --filter @amautai/whatsapp-gateway install --frozen-lockfile --prod
COPY apps/whatsapp-gateway/src apps/whatsapp-gateway/src
RUN mkdir /data && chown node:node /data
USER node
WORKDIR /app/apps/whatsapp-gateway
CMD ["node","--experimental-strip-types","src/server.ts"]
