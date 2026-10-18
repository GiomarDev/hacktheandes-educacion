# Build estático de Centinela Escolar servido por nginx, que enruta /api/<servicio> a cada microservicio.
# Construir desde la raíz del repositorio: docker build -f deploy/web.Dockerfile .
FROM node:26-slim AS build
WORKDIR /web
COPY apps/web/package.json apps/web/package-lock.json ./
RUN npm ci && npm rebuild
COPY apps/web ./
RUN npm run build

FROM nginx:1.29-alpine
COPY deploy/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /web/dist /usr/share/nginx/html
# Destinos por defecto: los nombres de servicio de deploy/compose.yml.
ENV AUTH_UPSTREAM=http://auth:3000 \
    SIAGIE_UPSTREAM=http://siagie:3001 \
    ALERTA_UPSTREAM=http://alerta:3002 \
    SIMON_UPSTREAM=http://simon:3003 \
    ESCALE_UPSTREAM=http://escale:3004
