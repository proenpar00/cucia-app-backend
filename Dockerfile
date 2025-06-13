FROM node:21-bullseye

# Instalar Python, pip, y herramientas necesarias
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv git && \
    apt-get clean

WORKDIR /app

# Crear entorno virtual de Python
RUN python3 -m venv /venv
ENV PATH="/venv/bin:$PATH"

# Instalar dependencias Node
COPY package*.json ./
RUN npm ci

# Instalar dependencias Python
COPY requirements.txt ./
RUN pip install --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# Copiar el resto del código
COPY . .

# Expone el puerto que usará Render
EXPOSE 3000

# Comando de inicio (Render usará npm start)
CMD ["npm", "start"]
