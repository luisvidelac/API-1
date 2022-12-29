const mongoose = require("mongoose");

const schema = mongoose.Schema({
    "Detalle": String,
    "N° Ingreso": String,
    "Tipo Recurso": String,
    "Fecha Ingreso": String,
    "Caratulado": String,
    "created_at": { type: Date },
    "updated_at": { type: Date, required: true, default: '01/01/1990' },
    "uuid": String,
    "detalle": [],
    "FechaEstDia": String,
    "usuarios": []
}, {
    versionKey: false
});

const causaSupremaModel = mongoose.model("CausaSuprema", schema);

module.exports = { causaSupremaModel };