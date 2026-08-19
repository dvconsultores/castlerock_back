# Etapa de construcción
FROM node:22-alpine AS builder

WORKDIR /app

# Habilitar pnpm mediante Corepack
RUN corepack enable

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar todas las dependencias
RUN pnpm install --frozen-lockfile

# Copiar el código fuente
COPY . .

# Compilar la aplicación
RUN pnpm build


# Etapa de producción
FROM node:22-alpine

WORKDIR /app

# Habilitar pnpm
RUN corepack enable

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar solo dependencias de producción
RUN pnpm install --prod --frozen-lockfile

# Copiar los artefactos compilados
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "./dist/main.js"]