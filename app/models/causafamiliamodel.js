const mongoose = require("mongoose");

const schema = mongoose.Schema({
    "Detalle": String,
    "Rit": String,
    "Ruc": String,
    "Estado": String,
    "Fecha": String,
    "Tribunal": String,
    "Caratulado": String,
    "created_at": { type: Date },
    "updated_at": { type: Date, required: true, default: '01/01/1990' },
    "detalle": [],
    "uuid": String,
    "FechaEstDia": String,
    "usuarios": []
}, {
    versionKey: false
});

module.exports = mongoose.model("CausaFamilia", schema);