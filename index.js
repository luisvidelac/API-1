const express = require("express");
const mongoose = require("mongoose");
const app = express();
const path = require("path");
const config = require("./app/config");

const estadoDiario = require("./app/routers/estado-diario");
const consulta = require("./app/routers/consulta-diario");

app.use(express.json())

// Configurar cabeceras y cors
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});

//Rutas
app.use('/api/estado_diario', estadoDiario)
app.use('/api/consulta_diario', consulta);
app.get('/api/version', (req, res) => {
    res.json(config.version);
});

app.get('/*', (req, res) => {
    res.sendFile(path.resolve(__dirname, './app/public/welcome.html'))
});

app.post('/*', (req, res) => {
    res.status(401).send('acceso no autorizado');
});

mongoose.connect("mongodb://localhost:27017/pdj", { useNewUrlParser: true })
    .then(() => {
        console.log('mongo conectado');
    });

app.listen(config.port, () => {
    console.log('app up!');
})