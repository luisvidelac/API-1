const mongoose = require("mongoose")

const schema = mongoose.Schema({
    "uuid": String,
    "contentype": String,
    "base64": String,
    "url": String,
    "N° Ingreso": String,
    "Corte": String,
    "Caratulado": String,
    "FechaEstDia": String,
    "usuarios": [],
    "created_at": { type: Date },
    "updated_at": { type: Date, required: true, default: Date.now },
    "competencia": String
}, {
    versionKey: false
});

module.exports = mongoose.model("DoctoApelaciones", schema);