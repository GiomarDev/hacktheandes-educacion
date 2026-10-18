# Una imagen para los cinco microservicios; SERVICE elige cuál arranca (ms-auth, ms-siagie, ...).
# Construir desde la raíz del repositorio: docker build -f deploy/backend.Dockerfile .
FROM node:26-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
# npm 11 no ejecuta scripts de instalación sin allowScripts: rebuild los corre (Prisma, argon2, SWC).
RUN npm ci && npm rebuild
COPY . .
# prisma generate solo lee el schema; la URL no se usa, pero prisma.config.ts la exige.
RUN for s in auth siagie alerta simon escale; do \
      U=$(echo "$s" | tr a-z A-Z); \
      env "${U}_DATABASE_URL=postgresql://build@localhost/build" npm run "${s}:generate"; \
    done \
 && npm run build \
 && npm prune --omit=dev

FROM node:26-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
# Migraciones y configuración de Prisma: `npx prisma migrate deploy --config apps/<svc>/prisma.config.ts`.
COPY --from=build /app/apps/ms-auth/prisma.config.ts ./apps/ms-auth/
COPY --from=build /app/apps/ms-auth/prisma ./apps/ms-auth/prisma
COPY --from=build /app/apps/ms-siagie/prisma.config.ts ./apps/ms-siagie/
COPY --from=build /app/apps/ms-siagie/prisma ./apps/ms-siagie/prisma
COPY --from=build /app/apps/ms-alerta/prisma.config.ts ./apps/ms-alerta/
COPY --from=build /app/apps/ms-alerta/prisma ./apps/ms-alerta/prisma
COPY --from=build /app/apps/ms-simon/prisma.config.ts ./apps/ms-simon/
COPY --from=build /app/apps/ms-simon/prisma ./apps/ms-simon/prisma
COPY --from=build /app/apps/ms-escale/prisma.config.ts ./apps/ms-escale/
COPY --from=build /app/apps/ms-escale/prisma ./apps/ms-escale/prisma
USER node
ENV SERVICE=ms-auth
CMD ["sh", "-c", "exec node dist/apps/$SERVICE/main.js"]
