const mongoose = require("mongoose");

const schema = mongoose.Schema({
    "Detalle": String,
    "Rol": String,
    "Fecha": String,
    "Caratulado": String,
    "Tribunal": String,
    "created_at": { type: Date },
    "updated_at": { type: Date, required: true, default: '01/01/1990' },
    "updated_at_receptores": { type: Date, required: true, default: '01/01/1990' },
    "cuadernos": [],
    "receptores": [],
    "uuid": String,
    "FechaEstDia": String,
    "usuarios": []
}, {
    versionKey: false
});

module.exports = mongoose.model("CausaCiviles", schema);