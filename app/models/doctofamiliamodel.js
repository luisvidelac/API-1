const mongoose = require("mongoose")

const schema = mongoose.Schema({
    "uuid": String,
    "contentype": String,
    "base64": String,
    "url": String,
    "Rit": String,
    "Ruc": String,
    "Tribunal": String,
    "Caratulado": String,
    "FechaEstDia": String,
    "usuarios": [],
    "created_at": { type: Date },
    "updated_at": { type: Date, required: true, default: Date.now }
}, {
    versionKey: false
});

const doctoFamiliaModel = mongoose.model("DoctoFamilia", schema);

module.exports = { doctoFamiliaModel };