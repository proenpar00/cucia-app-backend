const mongoose = require('mongoose');

const imgSchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true,
        required: true
    },
    base64: {
        type: String,
        required: true
    },
    detections: [  // Nuevo campo para almacenar las clases y sus confidencias
        {
            class: {
                type: String,
                required: true
            },
            confidence: {
                type: Number,
                required: true
            }
        }
    ]
});

imgSchema.methods.cleanup = function() {
    return {
        id: this.id,
        base64: this.base64,
        detections: this.detections // Retornar también las detecciones
    };
}

const Image = mongoose.model('Image', imgSchema);

module.exports = Image;
