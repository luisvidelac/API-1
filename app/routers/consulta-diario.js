const express = require("express");
const router = express.Router();
const config = require("../config");
const { causaCivilesModel } = require("../models/causacivilesmodel");
const { doctoCivilesModel } = require('../models/doctocivilesmodel');
const { causaApelacionesModel } = require("../models/causaapelacionesmodel");
const { doctoApelacionesModel } = require('../models/doctoapelacionesmodel');
const { causaFamiliaModel } = require("../models/causafamiliamodel");
const { doctoFamiliaModel } = require('../models/doctofamiliamodel');
const { causaCobranzaModel } = require("../models/causacobranzamodel");
const { doctoCobranzaModel } = require('../models/doctocobranzamodel');
const { causaLaboralesModel } = require("../models/causalaboralesmodel");
const { doctoLaboralesModel } = require('../models/doctolaboralesmodel');
const { causaSupremaModel } = require("../models/causasupremamodel");
const { doctoSupremaModel } = require('../models/doctosupremamodel');

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
 *              competencia:
 *                  type: string
 *                  descripcion: competencia del documento
 *          required:
 *              - uuid
 *          example:
 *              uuid: "aaaa-bbbb-cccc-dddd"
 *              competencia: "civil"
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
 *              competencia:
 *                  type: string
 *                  descripcion: competencia de la causa
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
 *              competencia: "civil"
 *      Elimina:
 *          type: object
 *          properties:
 *              competencia:
 *                  type: string
 *                  description: competencia de la causa a eliminar
 *              fecha:
 *                  type: string
 *                  description: fecha desde la eliminacion de causas y documentos yyyy-mm-dd
 *          required:
 *              - fecha
 *          example:
 *              competencia: "civil"
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

    if (!peticion.competencia || peticion.competencia.length == 0) {
        res.json({
            status: 500,
            msg: "Error",
            data: "competencia es obligatoria"
        })
        return;

    }

    const competencias = [];
    competencias.push({ nombre: 'suprema', tabCompetencia: '#nuevocolapsador > li:nth-child(1) > a', fechaCompetencia: '#fechaEstDiaSup', cargandoCompetencia: '#loadPreEstDiaSuprema', tituloDetalle: '#thTableEstDiaSuprema > tr', detalle: '#verDetalleEstDiaSuprema > tr', consultardetalle: '#btnConsultaEstDiaSuprema', modalDetalle: "#modalDetalleEstDiaSuprema" });
    competencias.push({ nombre: 'apelaciones', tabCompetencia: '#nuevocolapsador > li:nth-child(2) > a', fechaCompetencia: '#fechaEstDiaApe', cargandoCompetencia: '#loadPreEstDiaApelacion', tituloDetalle: '#thTableEstDiaApelacion > tr', detalle: '#verDetalleEstDiaApelacion > tr', consultardetalle: '#btnConsultaEstDiaApelacion', modalDetalle: "#modalDetalleEstDiaApelaciones" });
    competencias.push({ nombre: 'civil', tabCompetencia: '#nuevocolapsador > li:nth-child(3) > a', fechaCompetencia: '#fechaEstDiaCiv', cargandoCompetencia: '#loadPreEstDiaCivil', tituloDetalle: '#thTableEstDiaCivil > tr', detalle: '#verDetalleEstDiaCivil > tr', consultardetalle: '#btnConsultaEstDiaCivil', modalDetalle: "#modalDetalleEstDiaCivil", modalReceptor: "#modalReceptorCivil" });
    competencias.push({ nombre: 'laboral', tabCompetencia: '#nuevocolapsador > li:nth-child(4) > a', fechaCompetencia: '#fechaEstDiaLab', cargandoCompetencia: '#loadPreEstDiaLaboral', tituloDetalle: '#thTableEstDiaLaboral > tr', detalle: '#verDetalleEstDiaLaboral > tr', consultardetalle: '#btnConsultaEstDiaLaboral', modalDetalle: "#modalDetalleEstDiaLaboral" });
    //competencias.push({ nombre: 'penal', tabCompetencia: '#nuevocolapsador > li:nth-child(5) > a', fechaCompetencia: '#fechaEstDiaPen', cargandoCompetencia: '#loadPreEstDiaPenal', tituloDetalle: '#thTableEstDiaPenal > tr', detalle: '#verDetalleEstDiaPenal > tr', consultardetalle: '#btnConsultaEstDiaPenal', modalDetalle: "#modalDetalleEstDiaPenal" });
    competencias.push({ nombre: 'cobranza', tabCompetencia: '#nuevocolapsador > li:nth-child(6) > a', fechaCompetencia: '#fechaEstDiaCob', cargandoCompetencia: '#loadPreEstDiaCobranza', tituloDetalle: '#thTableEstDiaCobranza > tr', detalle: '#verDetalleEstDiaCobranza > tr', consultardetalle: '#btnConsultaEstDiaCobranza', modalDetalle: "#modalDetalleEstDiaCobranza", modalReceptor: "#modalReceptorCobranza" });
    competencias.push({ nombre: 'familia', tabCompetencia: '#nuevocolapsador > li:nth-child(7) > a', fechaCompetencia: '#fechaEstDiaFam', cargandoCompetencia: '#loadPreEstDiaFamilia', tituloDetalle: '#thTableEstDiaFamilia > tr', detalle: '#verDetalleEstDiaFamilia > tr', consultardetalle: '#btnConsultaEstDiaFamilia', modalDetalle: "#modalDetalleEstDiaFamilia" });

    const competencia = competencias.find(c => c.nombre === peticion.competencia);;

    if (!competencia) {
        res.json({
            status: 400,
            msg: "competencia " + peticion.competencia + " no existe",
            data: []
        })
        return;

    }

    try {

        let document;
        if (peticion.competencia === 'suprema') {
            delete peticion.competencia;
            document = await doctoSupremaModel.findOne({ uuid: peticion.uuid });
        }
        if (peticion.competencia === 'apelaciones') {
            delete peticion.competencia;
            document = await doctoApelacionesModel.findOne({ uuid: peticion.uuid });
        }
        if (peticion.competencia === 'civil') {
            delete peticion.competencia;
            document = await doctoCivilesModel.findOne({ uuid: peticion.uuid });
        }
        if (peticion.competencia === 'laboral') {
            delete peticion.competencia;
            document = await doctoLaboralesModel.findOne({ uuid: peticion.uuid });
        }
        if (peticion.competencia === 'cobranza') {
            delete peticion.competencia;
            document = await doctoCobranzaModel.findOne({ uuid: peticion.uuid });
        }
        if (peticion.competencia === 'familia') {
            delete peticion.competencia;
            document = await doctoFamiliaModel.findOne({ uuid: peticion.uuid });
        }
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

    if (!peticion.competencia || peticion.competencia.length == 0) {
        res.json({
            status: 500,
            msg: "Error",
            data: "competencia es obligatoria"
        })
        return;

    }

    const competencias = [];
    competencias.push({ nombre: 'suprema', tabCompetencia: '#nuevocolapsador > li:nth-child(1) > a', fechaCompetencia: '#fechaEstDiaSup', cargandoCompetencia: '#loadPreEstDiaSuprema', tituloDetalle: '#thTableEstDiaSuprema > tr', detalle: '#verDetalleEstDiaSuprema > tr', consultardetalle: '#btnConsultaEstDiaSuprema', modalDetalle: "#modalDetalleEstDiaSuprema" });
    competencias.push({ nombre: 'apelaciones', tabCompetencia: '#nuevocolapsador > li:nth-child(2) > a', fechaCompetencia: '#fechaEstDiaApe', cargandoCompetencia: '#loadPreEstDiaApelacion', tituloDetalle: '#thTableEstDiaApelacion > tr', detalle: '#verDetalleEstDiaApelacion > tr', consultardetalle: '#btnConsultaEstDiaApelacion', modalDetalle: "#modalDetalleEstDiaApelaciones" });
    competencias.push({ nombre: 'civil', tabCompetencia: '#nuevocolapsador > li:nth-child(3) > a', fechaCompetencia: '#fechaEstDiaCiv', cargandoCompetencia: '#loadPreEstDiaCivil', tituloDetalle: '#thTableEstDiaCivil > tr', detalle: '#verDetalleEstDiaCivil > tr', consultardetalle: '#btnConsultaEstDiaCivil', modalDetalle: "#modalDetalleEstDiaCivil", modalReceptor: "#modalReceptorCivil" });
    competencias.push({ nombre: 'laboral', tabCompetencia: '#nuevocolapsador > li:nth-child(4) > a', fechaCompetencia: '#fechaEstDiaLab', cargandoCompetencia: '#loadPreEstDiaLaboral', tituloDetalle: '#thTableEstDiaLaboral > tr', detalle: '#verDetalleEstDiaLaboral > tr', consultardetalle: '#btnConsultaEstDiaLaboral', modalDetalle: "#modalDetalleEstDiaLaboral" });
    //competencias.push({ nombre: 'penal', tabCompetencia: '#nuevocolapsador > li:nth-child(5) > a', fechaCompetencia: '#fechaEstDiaPen', cargandoCompetencia: '#loadPreEstDiaPenal', tituloDetalle: '#thTableEstDiaPenal > tr', detalle: '#verDetalleEstDiaPenal > tr', consultardetalle: '#btnConsultaEstDiaPenal', modalDetalle: "#modalDetalleEstDiaPenal" });
    competencias.push({ nombre: 'cobranza', tabCompetencia: '#nuevocolapsador > li:nth-child(6) > a', fechaCompetencia: '#fechaEstDiaCob', cargandoCompetencia: '#loadPreEstDiaCobranza', tituloDetalle: '#thTableEstDiaCobranza > tr', detalle: '#verDetalleEstDiaCobranza > tr', consultardetalle: '#btnConsultaEstDiaCobranza', modalDetalle: "#modalDetalleEstDiaCobranza", modalReceptor: "#modalReceptorCobranza" });
    competencias.push({ nombre: 'familia', tabCompetencia: '#nuevocolapsador > li:nth-child(7) > a', fechaCompetencia: '#fechaEstDiaFam', cargandoCompetencia: '#loadPreEstDiaFamilia', tituloDetalle: '#thTableEstDiaFamilia > tr', detalle: '#verDetalleEstDiaFamilia > tr', consultardetalle: '#btnConsultaEstDiaFamilia', modalDetalle: "#modalDetalleEstDiaFamilia" });

    const competencia = competencias.find(c => c.nombre === peticion.competencia);;

    if (!competencia) {
        res.json({
            status: 400,
            msg: "competencia " + peticion.competencia + " no existe",
            data: []
        })
        return;

    }

    try {

        const retorno = [];

        let causas = [];
        if (peticion.competencia === 'suprema') {
            delete peticion.competencia;
            causas = await causaSupremaModel.find(peticion);
        }
        if (peticion.competencia === 'apelaciones') {
            delete peticion.competencia;
            causas = await causaApelacionesModel.find(peticion);;
        }
        if (peticion.competencia === 'civil') {
            delete peticion.competencia;
            causas = await causaCivilesModel.find(peticion);
        }
        if (peticion.competencia === 'laboral') {
            delete peticion.competencia;
            causas = await causaLaboralesModel.find(peticion);
        }
        if (peticion.competencia === 'cobranza') {
            delete peticion.competencia;
            causas = await causaCobranzaModel.find(peticion);
        }
        if (peticion.competencia === 'familia') {
            delete peticion.competencia;
            causas = await causaFamiliaModel.find(peticion);
        }
        if (causas && causas.length > 0) {
            for await (const causa of causas) {
                retorno.push(causa);
            }
        }
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

    if (!peticion.competencia || peticion.competencia.length == 0) {
        res.json({
            status: 500,
            msg: "Error",
            data: "competencia es obligatoria"
        })
        return;

    }

    const competencias = [];
    competencias.push({ nombre: 'suprema', tabCompetencia: '#nuevocolapsador > li:nth-child(1) > a', fechaCompetencia: '#fechaEstDiaSup', cargandoCompetencia: '#loadPreEstDiaSuprema', tituloDetalle: '#thTableEstDiaSuprema > tr', detalle: '#verDetalleEstDiaSuprema > tr', consultardetalle: '#btnConsultaEstDiaSuprema', modalDetalle: "#modalDetalleEstDiaSuprema" });
    competencias.push({ nombre: 'apelaciones', tabCompetencia: '#nuevocolapsador > li:nth-child(2) > a', fechaCompetencia: '#fechaEstDiaApe', cargandoCompetencia: '#loadPreEstDiaApelacion', tituloDetalle: '#thTableEstDiaApelacion > tr', detalle: '#verDetalleEstDiaApelacion > tr', consultardetalle: '#btnConsultaEstDiaApelacion', modalDetalle: "#modalDetalleEstDiaApelaciones" });
    competencias.push({ nombre: 'civil', tabCompetencia: '#nuevocolapsador > li:nth-child(3) > a', fechaCompetencia: '#fechaEstDiaCiv', cargandoCompetencia: '#loadPreEstDiaCivil', tituloDetalle: '#thTableEstDiaCivil > tr', detalle: '#verDetalleEstDiaCivil > tr', consultardetalle: '#btnConsultaEstDiaCivil', modalDetalle: "#modalDetalleEstDiaCivil", modalReceptor: "#modalReceptorCivil" });
    competencias.push({ nombre: 'laboral', tabCompetencia: '#nuevocolapsador > li:nth-child(4) > a', fechaCompetencia: '#fechaEstDiaLab', cargandoCompetencia: '#loadPreEstDiaLaboral', tituloDetalle: '#thTableEstDiaLaboral > tr', detalle: '#verDetalleEstDiaLaboral > tr', consultardetalle: '#btnConsultaEstDiaLaboral', modalDetalle: "#modalDetalleEstDiaLaboral" });
    //competencias.push({ nombre: 'penal', tabCompetencia: '#nuevocolapsador > li:nth-child(5) > a', fechaCompetencia: '#fechaEstDiaPen', cargandoCompetencia: '#loadPreEstDiaPenal', tituloDetalle: '#thTableEstDiaPenal > tr', detalle: '#verDetalleEstDiaPenal > tr', consultardetalle: '#btnConsultaEstDiaPenal', modalDetalle: "#modalDetalleEstDiaPenal" });
    competencias.push({ nombre: 'cobranza', tabCompetencia: '#nuevocolapsador > li:nth-child(6) > a', fechaCompetencia: '#fechaEstDiaCob', cargandoCompetencia: '#loadPreEstDiaCobranza', tituloDetalle: '#thTableEstDiaCobranza > tr', detalle: '#verDetalleEstDiaCobranza > tr', consultardetalle: '#btnConsultaEstDiaCobranza', modalDetalle: "#modalDetalleEstDiaCobranza", modalReceptor: "#modalReceptorCobranza" });
    competencias.push({ nombre: 'familia', tabCompetencia: '#nuevocolapsador > li:nth-child(7) > a', fechaCompetencia: '#fechaEstDiaFam', cargandoCompetencia: '#loadPreEstDiaFamilia', tituloDetalle: '#thTableEstDiaFamilia > tr', detalle: '#verDetalleEstDiaFamilia > tr', consultardetalle: '#btnConsultaEstDiaFamilia', modalDetalle: "#modalDetalleEstDiaFamilia" });

    const competencia = competencias.find(c => c.nombre === peticion.competencia);;

    if (!competencia) {
        res.json({
            status: 400,
            msg: "competencia " + peticion.competencia + " no existe",
            data: []
        })
        return;

    }

    try {
        let retorno;
        if (peticion.competencia === 'suprema') {
            retorno = await doctoSupremaModel.deleteMany({ "$where": "this.updated_at.toJSON().slice(0, 10) <= '" + peticion.fecha + "'" });
            retorno = await causaSupremaModel.deleteMany({ "$where": "this.updated_at.toJSON().slice(0, 10) <= '" + peticion.fecha + "'" });
        }
        if (peticion.competencia === 'apelaciones') {
            retorno = await doctoApelacionesModel.deleteMany({ "$where": "this.updated_at.toJSON().slice(0, 10) <= '" + peticion.fecha + "'" });
            retorno = await causaApelacionesModel.deleteMany({ "$where": "this.updated_at.toJSON().slice(0, 10) <= '" + peticion.fecha + "'" });
        }
        if (peticion.competencia === 'civil') {
            retorno = await doctoCivilesModel.deleteMany({ "$where": "this.updated_at.toJSON().slice(0, 10) <= '" + peticion.fecha + "'" });
            retorno = await causaCivilesModel.deleteMany({ "$where": "this.updated_at.toJSON().slice(0, 10) <= '" + peticion.fecha + "'" });
        }
        if (peticion.competencia === 'laboral') {
            retorno = await doctoLaboralesModel.deleteMany({ "$where": "this.updated_at.toJSON().slice(0, 10) <= '" + peticion.fecha + "'" });
            retorno = await causaLaboralesModel.deleteMany({ "$where": "this.updated_at.toJSON().slice(0, 10) <= '" + peticion.fecha + "'" });
        }
        if (peticion.competencia === 'cobranza') {
            retorno = await doctoCobranzaModel.deleteMany({ "$where": "this.updated_at.toJSON().slice(0, 10) <= '" + peticion.fecha + "'" });
            retorno = await causaCobranzaModel.deleteMany({ "$where": "this.updated_at.toJSON().slice(0, 10) <= '" + peticion.fecha + "'" });
        }
        if (peticion.competencia === 'familia') {
            retorno = await doctoFamiliaModel.deleteMany({ "$where": "this.updated_at.toJSON().slice(0, 10) <= '" + peticion.fecha + "'" });
            retorno = await causaFamiliaModel.deleteMany({ "$where": "this.updated_at.toJSON().slice(0, 10) <= '" + peticion.fecha + "'" });
        }
        res.json({
            status: 200,
            msg: `OK`,
            data: !retorno ? {} : retorno
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