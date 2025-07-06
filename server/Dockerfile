# Dockerfile (en la raíz del proyecto para el backend)

# Usa una imagen base de Node.js
FROM node:20-alpine

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia package.json y package-lock.json
# Esto permite a Docker usar la caché para npm install si estos archivos no cambian
COPY package.json ./
COPY package-lock.json ./

# Instala las dependencias del proyecto
RUN npm install

# Copia el resto del código de la aplicación (incluyendo tu server.js, rutas, modelos, etc.)
COPY . .

# Expone el puerto en el que tu aplicación Node.js escucha (ej. 5000)
# Asegúrate de que este puerto coincida con el que usa tu app de Express.
EXPOSE 5000

# Comando para iniciar la aplicación Node.js
CMD ["npm", "start"]