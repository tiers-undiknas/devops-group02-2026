FROM node:20-alpine AS builder
WORKDIR /app
RUN chown node:node /app
USER node

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci

COPY --chown=node:node src ./src
COPY --chown=node:node tests ./tests
COPY --chown=node:node vitest.config.js ./

FROM builder AS test
ENV NODE_ENV=test
CMD ["npm", "test"]

FROM builder AS production-deps
RUN npm prune --omit=dev \
    && find node_modules -type f \
    \( -name '*.map' -o -name '*.ts' \
    -o -iname 'README*' -o -iname 'CHANGELOG*' \) -delete \
    && find node_modules -type d \
    \( -name test -o -name tests -o -name __tests__ \
    -o -name examples -o -name docs \) \
    -prune -exec rm -rf '{}' + \
    && rm -rf node_modules/bullmq/dist/esm \
    node_modules/luxon/build/amd node_modules/luxon/build/global \
    node_modules/luxon/src

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --chown=node:node --from=production-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/package.json /app/package-lock.json ./
COPY --chown=node:node --from=builder /app/src ./src

USER node
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
    CMD node -e "const http=require('node:http'); \
    const req=http.get({host:'127.0.0.1',port:process.env.PORT||3000, \
    path:'/healthz/live'},res=>{res.resume(); \
    process.exit(res.statusCode===200?0:1)}); \
    req.on('error',()=>process.exit(1)); \
    req.setTimeout(3000,()=>{req.destroy();process.exit(1)});"

CMD ["npm", "start"]