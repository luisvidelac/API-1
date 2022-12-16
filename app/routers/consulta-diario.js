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
 *              documentos:
 *                  type: array
 *                  description: documentos de la causa
 *                  items:
 *                      type: object
 *              cuadernos:
 *                  type: array
 *                  description: cuadernos de la causa
 *                  items:
 *                      type: object
 *              receptores:
 *                  type: array
 *                  description: receptores de la causa
 *                  items:
 *                      type: object
 *              usuarios:
 *                  type: array
 *                  description: usuarios que fue encontrada la causa
 *              FechaEstDia:
 *                  type: string
 *                  description: fecha consulta estado diario en PJUD dd/mm/yyyy
 *              updated_at:
 *                  type: string
 *                  description: fecha ultima actualizacion yyyy-mm-dd
 *          example:
 *              uuid: "aaaa-bbbb-cccc-dddd"
 *      Elimina:
 *          type: object
 *          properties:
 *              fecha:
 *                  type: string
 *                  description: fecha desde la eliminacion de causas y documentos yyyy-mm-dd
 *          required:
 *              - fecha
 *          example:
 *              fecha: "2022-12-31"
 *      ResponseElimina:
 *          type: object
 *          properties:
 *              status:
 *                  type: number
 *                  description: status
 *              msg:
 *                  type: string
 *                  description: mensaje
 *              data:
 *                  type: object
 *                  description: data respuesta
 *                  properties:
 *                      acknowledged:
 *                          type: boolean
 *                          description: status
 *                      deletedCount:
 *                          type: number
 *                          description: causas eliminadas
 *          example:
 *              status: 200
 *              msg: "ok"
 *              data:
 *                  acknowledged: true
 *                  deletedCount: 643
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
 *      tags: [Version]
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
 *      tags: [Document,Error]
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
 *      tags: [Causa,Error]
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
                    "usuarios": causa.usuarios,
                    "uuid": causa.uuid,
                    "FechaEstDia": causa.FechaEstDia,
                    "updated_at": causa.updated_at
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

/**
 * @swagger
 * /api/consulta_diario/eliminar_causa:
 *  post:
 *      summary: permite eliminar causas y documentos desde la fecha indicada y anteriores
 *      tags: [Elimina,ResponseElimina,Error]
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      $ref: '#components/schemas/Elimina'
 *      responses:
 *          200:
 *              description: Respuesta de Eliminacion
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          $ref: '#components/schemas/ResponseElimina'
 *          500:
 *              description: Error
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          $ref: '#components/schemas/Error'
 */
router.post("/eliminar_causa", async(req, res) => {
    const peticion = req.body;
    if (!peticion.fecha || peticion.fecha.length == 0) {
        res.json({
            status: 500,
            msg: "Error",
            data: "fecha es obligatorio"
        })
        return;

    }
    try {
        let retorno = await doctoModel.deleteMany({ "$where": "this.updated_at.toJSON().slice(0, 10) <= '" + peticion.fecha + "'" });
        retorno = await causaModel.deleteMany({ "$where": "this.updated_at.toJSON().slice(0, 10) <= '" + peticion.fecha + "'" });
        res.json({
            status: 200,
            msg: `OK`,
            data: retorno
        });
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