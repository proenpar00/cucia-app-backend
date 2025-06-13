FROM node:21-bullseye

# Instalar Python, pip, git, y otros requerimientos
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv git && \
    apt-get clean

WORKDIR /app

RUN python3 -m venv /venv
ENV PATH="/venv/bin:$PATH"

COPY package*.json ./
RUN npm ci

COPY requirements.txt ./

# 🔧 Asegúrate de usar pip actualizado antes de instalar torch
RUN pip install --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt
