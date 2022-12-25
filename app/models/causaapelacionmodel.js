const mongoose = require("mongoose");

const schema = mongoose.Schema({
    "Detalle": String,
    "N° Ingreso": String,
    "Ubicacion": String,
    "Fecha Ubicación": String,
    "Corte": String,
    "Caratulado": String,
    "created_at": { type: Date },
    "updated_at": { type: Date, required: true, default: '01/01/1990' },
    "uuid": String,
    "FechaEstDia": String,
    "usuarios": [],
    "competencia": String
}, {
    versionKey: false
});

module.exports = mongoose.model("CausaApelacion", schema);