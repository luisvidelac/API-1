const mongoose = require("mongoose")

const schema = mongoose.Schema({
    "uuid": String,
    "contentype": String,
    "base64": String,
    "url": String,
    "N° Ingreso": String,
    "Ubicación": String,
    "Corte": String,
    "Caratulado": String,
    "FechaEstDia": String,
    "usuarios": [],
    "created_at": { type: Date },
    "updated_at": { type: Date, required: true, default: Date.now }
}, {
    versionKey: false
});

const doctoApelacionesModel = mongoose.model("DoctoApelaciones", schema);

module.exports = { doctoApelacionesModel };