const mongoose = require("mongoose")

const schema = mongoose.Schema({
    Detalle: String,
    Rol: String,
    Fecha: String,
    Caratulado: String,
    Tribunal: String,
    created_at: { type: Date },
    updated_at: { type: Date, required: true, default: '01/01/1990' },
    cuadernos: [],
    uuid: String,
    usuario: String
}, {
    versionKey: false
})

module.exports = mongoose.model("Causa", schema)