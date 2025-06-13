# Imagen base con Node y Alpine
FROM node:21-alpine

# Instalar Python, pip, virtualenv y git (para torch hub)
RUN apk add --no-cache python3 py3-pip py3-virtualenv git

# Establecer directorio de trabajo
WORKDIR /app

# Crear entorno virtual para Python y agregarlo al PATH
RUN python3 -m venv /venv
ENV PATH="/venv/bin:$PATH"

# Copiar e instalar dependencias Node.js
COPY package*.json ./
RUN npm ci

# Copiar e instalar dependencias Python
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el resto del proyecto
COPY . .

# Crear carpeta de subidas si no existe
RUN mkdir -p uploads

# Exponer el puerto que usa Express (Render lo detecta)
EXPOSE 3000

# Comando de inicio
CMD ["node", "app.js"]
