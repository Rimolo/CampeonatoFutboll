# client/Dockerfile

# Etapa 1: Construcción de la aplicación React
# Usa una imagen base de Node.js para construir la aplicación
FROM node:20-alpine as builder

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos package.json y package-lock.json
# Esto permite que Docker use la caché para npm install si estos archivos no cambian
COPY package.json ./
COPY package-lock.json ./

# Instala las dependencias del proyecto
RUN npm install

# Copia el resto del código de la aplicación (incluyendo src/)
COPY . .

# Construye la aplicación React para producción
# Esto creará una carpeta 'build' con los archivos estáticos optimizados
RUN npm run build

# Etapa 2: Servir la aplicación con Nginx
# Usa una imagen ligera de Nginx para servir los archivos estáticos
FROM nginx:alpine

# Copia la configuración de Nginx predeterminada del contenedor
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Elimina la página de bienvenida predeterminada de Nginx
RUN rm -rf /etc/nginx/html/*

# Copia los archivos de la aplicación React construidos desde la etapa 'builder'
COPY --from=builder /app/build /usr/share/nginx/html

# Expone el puerto 80, que es el puerto predeterminado para Nginx
EXPOSE 80

# Comando para iniciar Nginx cuando el contenedor se ejecute
CMD ["nginx", "-g", "daemon off;"]