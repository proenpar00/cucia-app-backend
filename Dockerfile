# Usa imagen base con Node y Alpine (liviana)
FROM node:21-alpine

# Instala python3, pip y git (necesario para torch hub)
RUN apk add --no-cache python3 py3-pip git

# Establece directorio de trabajo
WORKDIR /app

# Copia package.json y package-lock.json e instala dependencias npm
COPY package.json package-lock.json ./
RUN npm ci

# Copia el requirements.txt y lo instala con pip
COPY requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt

# Copia el resto de archivos (incluye process_image.py y weights)
COPY . .

# Crea carpeta uploads si no existe (por si acaso)
RUN mkdir -p uploads

# Exponer puerto donde escucha tu app Express
EXPOSE 3000

# Comando para iniciar la app
CMD ["node", "app.js"]
