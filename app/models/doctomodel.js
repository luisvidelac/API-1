const mongoose = require("mongoose")

const schema = mongoose.Schema({
    uuid: String,
    contentype: String,
    base64: String,
    url: String,
    Rol: String,
    Caratulado: String,
    Tribunal: String,
    usuario: String,
    created_at: { type: Date },
    updated_at: { type: Date, required: true, default: Date.now }
}, {
    versionKey: false
})

module.exports = mongoose.model("Docto", schema)