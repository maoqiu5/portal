FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate && pnpm install --prod --frozen-lockfile

COPY src ./src
COPY public ./public

EXPOSE 3000
CMD ["pnpm", "start"]
