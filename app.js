var dotenv = require('dotenv');  // Cargar dotenv
dotenv.config();  // Cargar las variables de entorno desde el archivo .env

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors'); // Importar cors
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

var indexRouter = require('./routes/index');
var imageRouter = require('./routes/image');

var app = express();

// Configuración de Swagger
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'API de Gestión de Imágenes',
            version: '1.0.0',
            description: 'API para subir y gestionar imágenes procesadas con YOLOv5.',
        },
        servers: [
            {
                url: 'https://cucia-service.onrender.com', // Cambia esto si tu aplicación corre en otro puerto
            },
        ],
    },
    apis: ['./routes/*.js'], // Ruta a tus archivos de documentación
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use(cors()); // Habilitar CORS
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api/v1/image', imageRouter);

//setup connection to mongo
const mongoose = require('mongoose');
const DB_URL = process.env.MONGODB_URI || 'mongodb://localhost/test';
console.log("Conectando a la base de datos: %s", DB_URL);

mongoose.connect(DB_URL);
const db = mongoose.connection;

//recover from errors
db.on('error', console.error.bind(console, 'db connection error'));

// Crear la carpeta uploads si no existe
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

module.exports = app;
