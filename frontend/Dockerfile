# 1. untuk build aplikasi frontend pakai Node
FROM node:20-alpine AS builder
WORKDIR /app

# copy package dulu supaya npm ci bisa di cache
COPY package.json package-lock.json ./
RUN npm ci

# copy semua source code lalu build ke folder dist
COPY . .
RUN npm run build && find dist -name "*.map" -delete


# 2. menjalankan hasil build pakai nginx
FROM nginx:alpine

# ganti config bawaan nginx dengan config sendiri
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# mengambil folder dist saja dari tahap builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# mengecek apakah nginx masih jalan setiap 30 detik
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]