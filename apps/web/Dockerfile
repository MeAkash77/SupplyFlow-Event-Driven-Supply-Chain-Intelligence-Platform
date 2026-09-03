FROM node:20-alpine AS deps

WORKDIR /app

COPY apps/web/package.json ./package.json
RUN npm install

FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY apps/web/ ./

ARG EASYFLOW_API_URL=http://api:8000
ENV EASYFLOW_API_URL=${EASYFLOW_API_URL}
ENV NODE_ENV=production

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=builder /app ./

EXPOSE 3000

CMD ["npm", "run", "start", "--", "--hostname", "0.0.0.0", "--port", "3000"]

