const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const Image = require('../models/img');
const router = express.Router();

// Configuración de Multer para la carga de imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Asegúrate de que esta carpeta exista
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Tipo de archivo no permitido'));
  },
});

/* POST image */
router.post('/', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).send('No se subió imagen');

  const model = req.body.model || 'default';
  const imagePath = path.resolve(req.file.path);
  const imageDir = path.dirname(imagePath);
  const ext = path.extname(imagePath);
  const baseName = path.basename(imagePath, ext);
  const annotatedImagePath = path.join(imageDir, `${baseName}_output${ext}`);

  exec(`python3 process_image.py "${imagePath}" "${model}"`, async (err, stdout, stderr) => {
    if (err) {
      console.error('Error en script:', err);
      console.error('stderr:', stderr);
      // Elimina archivo original si hay error
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      return res.status(500).send('Error al procesar imagen');
    }

    try {
      const outputLines = stdout.trim().split('\n');
      const lastLine = outputLines[outputLines.length - 1];
      const { detections } = JSON.parse(lastLine);

      // Leer la imagen anotada y codificar en base64
      if (!fs.existsSync(annotatedImagePath)) {
        throw new Error('Imagen anotada no encontrada');
      }
      const base64 = fs.readFileSync(annotatedImagePath, 'base64');

      const latest = await Image.findOne().sort({ id: -1 });
      const nextId = latest ? latest.id + 1 : 1;

      const newImage = new Image({ id: nextId, base64, detections });
      await newImage.save();

      // Limpieza: elimina archivos original y anotado
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      if (fs.existsSync(annotatedImagePath)) fs.unlinkSync(annotatedImagePath);

      res.json({ id: newImage.id, base64, detections });
    } catch (parseError) {
      console.error('Error al parsear JSON desde stdout:', parseError);
      console.error('stdout completo:', stdout);
      // Limpieza en error
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      if (fs.existsSync(annotatedImagePath)) fs.unlinkSync(annotatedImagePath);
      res.status(500).send('Error al analizar resultado del modelo');
    }
  });
});

/* GET image by ID */
router.get('/:id', async function (req, res) {
  const id = req.params.id;

  try {
    const foundImg = await Image.findOne({ id });

    if (foundImg) {
      res.status(200).json({
        id: foundImg.id,
        base64: foundImg.base64,
        detections: foundImg.detections
      });
    } else {
      res.status(404).send('Imagen no encontrada');
    }
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

module.exports = router;
