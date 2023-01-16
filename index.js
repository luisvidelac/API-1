const express = require("express");
const mongoose = require("mongoose");
const app = express();
const path = require("path");
const config = require("./app/config");
require('dotenv').config();

const estadoDiario = require("./app/routers/estado-diario");
const consulta = require("./app/routers/consulta-diario");

const log = console.log;

console.log = function() {
    log.apply(console, [new Date(), ...arguments]);
};

const swaggerUI = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");

const swaggerSpec = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "PJUD API",
            version: "1.0.0",

        },
        servers: [{
            url: "http://localhost:3000"
        }]
    },
    apis: [`${path.join(__dirname, "./app/routers/*.js")}`

    ]
};

app.use(express.json());

app.use("/api-doc", swaggerUI.serve, swaggerUI.setup(swaggerJsDoc(swaggerSpec)));

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
mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true })
    .then(() => {
        console.log('mongo conectado:', process.env.MONGO_URL);
    });

app.listen(process.env.PORT, () => {
    console.log('app up! port:', process.env.PORT);
})