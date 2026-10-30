# Image untuk backend Express. Untuk app kamu sendiri: cek baris bertanda SESUAIKAN.
FROM node:24-slim

ENV NODE_ENV=production
WORKDIR /app

# Pasang dependency dulu. Langkah ini di-cache selama package-lock.json tidak berubah.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

# Jangan menjalankan aplikasi sebagai root.
USER node
EXPOSE 3000
# SESUAIKAN: file utama backend kamu (server.js, index.js, app.js, ...).
# Jalankan node langsung, bukan "npm start", agar sinyal stop dari Docker sampai ke aplikasi.
CMD ["node", "server.js"]
