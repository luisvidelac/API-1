const express = require("express");
const router = express.Router();
const config = require("../config");
const causaModel = require("../models/causamodel");
const doctoModel = require("../models/doctomodel");

router.get("/*", (req, res) => {
    res.json(config.version);
});

router.post("/obtener_documento", async(req, res) => {
    const peticion = req.body;

    if (!peticion.uuid || peticion.uuid.length == 0) {
        res.json({
            status: 3011,
            msg: "uuid es obligatorio",
            data: []
        })
        return;

    }

    try {

        let document = await doctoModel.findOne({ uuid: peticion.uuid });
        if (document) {
            res.type(document.contentype);
            let extension = document.contentype.split('/')[1];
            res.header('Content-Disposition', `attachment; filename="documento.${extension}"`);
            res.send(Buffer.from(document.base64, 'base64'));
        } else {
            res.json({
                status: 200,
                msg: `OK`,
                data: 'No encontrado'
            });
        }



    } catch (error) {
        console.log(error);
        res.json({
            status: 500,
            msg: `OK`,
            data: error.message
        })

    } finally {
        return;
    }

})

router.post("/obtener_causa", async(req, res) => {
    const peticion = req.body;

    try {
        let causas = await causaModel.find(peticion);
        if (causas && causas.length > 0) {
            const retorno = [];
            for await (const causa of causas) {
                let obj = {
                    "Rol": causa.Rol,
                    "Fecha": causa.Fecha,
                    "Caratulado": causa.Caratulado,
                    "Tribunal": causa.Tribunal,
                    "cuadernos": causa.cuadernos,
                    "usuario": causa.usuario,
                    "uuid": causa.uuid
                };
                retorno.push(obj);
            }
            res.json({
                status: 200,
                msg: `OK`,
                data: retorno
            });
        } else {
            res.json({
                status: 200,
                msg: `OK`,
                data: 'No encontrado'
            })
        }
    } catch (error) {
        console.log(error);
        res.json({
            status: 500,
            msg: `OK`,
            data: error.message
        })

    } finally {
        return;
    }
});

module.exports = router