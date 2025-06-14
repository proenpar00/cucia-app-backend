FROM node:21-bullseye

# Instalar Python, pip, venv y git
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv git && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Crear entorno virtual de Python
RUN python3 -m venv /venv
ENV PATH="/venv/bin:$PATH"

# Instalar dependencias Node.js
COPY package*.json ./
RUN npm ci

# Instalar dependencias Python
COPY requirements.txt ./
RUN pip install --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# Copiar todo el código
COPY . .

# Exponer puerto para Render
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]
