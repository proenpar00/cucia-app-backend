const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const indexRoutes = require('./routes/index');
const imageRoutes = require('./routes/image');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/', indexRoutes);
app.use('/api/v1/image', imageRoutes);

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Conectado a MongoDB Atlas');
})
.catch(err => {
  console.error('❌ Error al conectar a MongoDB:', err.message);
});

module.exports = app;
