const mongoose = require("mongoose");

const schema = mongoose.Schema({
    "uuid": String,
    "contentype": String,
    "base64": String,
    "url": String,
    "N° Ingreso": String,
    "Tipo Recurso": String,
    "Caratulado": String,
    "FechaEstDia": String,
    "usuarios": [],
    "created_at": { type: Date },
    "updated_at": { type: Date, required: true, default: Date.now }
}, {
    versionKey: false
});

module.exports = mongoose.model("DoctoSuprema", schema);