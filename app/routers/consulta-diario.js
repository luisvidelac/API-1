const express = require("express");
const router = express.Router();
const config = require("../config");
const causaModel = require("../models/causamodel");
const doctoModel = require("../models/doctomodel");

/**
 * @swagger
 * components:
 *  schemas:
 *      Document:
 *          type: object
 *          properties:
 *              uuid:
 *                  type: string
 *                  description: uuid del documento
 *          required:
 *              - uuid
 *          example:
 *              uuid: "aaaa-bbbb-cccc-dddd"
 *      Version:
 *          type: object
 *          properties:
 *              status:
 *                  type: number
 *                  description: status de la api
 *              version:
 *                  type: string
 *                  description: version de la pi
 *              date:
 *                  type: number
 *                  description: fecha de la api yyyymmdd
 *          example:
 *              status: 200
 *              version: "1.0.0"
 *              date: 20221205
 *      Causa:
 *          type: object
 *          properties:
 *              uuid:
 *                  type: string
 *                  description: uuid generado de la causa
 *              Rol:
 *                  type: string
 *                  description: rol de la causa
 *              Tribunal:
 *                  type: string
 *                  description: tribunal de la causa
 *              Caratulado:
 *                  type: string
 *                  description: caratulado de la causa
 *              usuario:
 *                  type: string
 *                  description: usuario que fue encontrada la causa
 *              documentos:
 *                  type: array
 *                  description: documentos de la causa
 *                  items:
 *                      type: object
 *          example:
 *              uuid: "aaaa-bbbb-cccc-dddd"
 *      Error:
 *          type: object
 *          properties:
 *              status:
 *                  type: number
 *                  description: status
 *              msg:
 *                  type: string
 *                  description: mensaje de error
 *              data:
 *                  type: string
 *                  description: descripcion del error
 *          example:
 *              status: 500
 *              msg: "Error"
 *              data: "Timeout"
 */


/**
 * @swagger
 * /api/version:
 *  get:
 *      summary: obtiene la version de la api
 *      responses:
 *          200:
 *              description: Obtiene la version de la api
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          $ref: '#components/schemas/Version'
 */
router.get("/*", (req, res) => {
    res.json(config.version);
});

/**
 * @swagger
 * /api/consulta_diario/obtener_documento:
 *  post:
 *      summary: permite obtener un documento
 *      tags: [Document]
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      $ref: '#components/schemas/Document'
 *      responses:
 *          200:
 *              description: Obtiene el documento con el contentype generado
 *              content:
 *                  application/pdf:
 *                      schema:
 *                          type: file
 *                          format: binary
 *          500:
 *              description: Error
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          $ref: '#components/schemas/Error'

 */
router.post("/obtener_documento", async(req, res) => {
    const peticion = req.body;

    if (!peticion.uuid || peticion.uuid.length == 0) {
        res.json({
            status: 500,
            msg: "Error",
            data: "uuid es obligatorio"
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
            msg: `Error`,
            data: error.message
        })

    } finally {
        return;
    }

})

/**
 * @swagger
 * /api/consulta_diario/obtener_causa:
 *  post:
 *      summary: permite obtener la(s) causa(s)
 *      tags: [Causa]
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      $ref: '#components/schemas/Causa'
 *      responses:
 *          200:
 *              description: Obtiene la(s) causa(s)
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: array
 *                          items:
 *                              $ref: '#components/schemas/Causa'
 *          500:
 *              description: Error
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          $ref: '#components/schemas/Error'
 */
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
                    "receptores": causa.receptores,
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