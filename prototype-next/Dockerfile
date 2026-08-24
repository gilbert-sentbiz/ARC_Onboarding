# PI-229: 로컬 풀스택 docker용 프론트 이미지 (Next.js standalone 서버 모드)
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV DOCKER_BUILD=1
# NEXT_PUBLIC_API_BASE_URL은 빌드 타임에 번들에 인라인됨 — compose에서 build arg로 주입
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# standalone 산출물: 최소 서버 + 정적 자산
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
