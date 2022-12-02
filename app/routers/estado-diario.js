const express = require("express");
const router = express.Router();
const puppeteer = require('puppeteer-extra');
const config = require("../config");
const https = require('https');
const causaModel = require("../models/causamodel");
const doctoModel = require('../models/doctomodel');

const hidden = require('puppeteer-extra-plugin-stealth');

const { executablePath } = require('puppeteer');
const { resolve } = require("path");
const { time } = require("console");
const { title, exit } = require("process");

const { v4: uuidv4 } = require('uuid');

router.get("/*", (req, res) => {
    res.json(config.version);
});

router.post("/obtener_estado", async(req, res) => {
    const peticion = req.body;

    if (!peticion.usuario || peticion.usuario.length == 0) {
        res.json({
            status: 3011,
            msg: "nombre de usuario es obligatorio",
            data: []
        })
        return;

    }

    if (!peticion.password || peticion.password.length == 0) {
        res.json({
            status: 3012,
            msg: "contraseña es obligatorio",
            data: []
        })
        return;
    }
    const usuario = peticion.usuario;

    peticion.fecha = peticion.fecha ? new Date(parseInt(peticion.fecha.split(config.separatorDate)[2]), parseInt(peticion.fecha.split(config.separatorDate)[1]) - 1, parseInt(peticion.fecha.split(config.separatorDate)[0])) : new Date();
    let a = [{ day: 'numeric' }, { month: 'numeric' }, { year: 'numeric' }];
    let resta = -1;
    if (peticion.fecha.getDay() === 1) {
        resta = -3;
    } else if (peticion.fecha.getDay() === 0) {
        resta = -2;
    }
    peticion.fecha = join(sumarDias(peticion.fecha, resta), a, config.separatorDate);

    const start = process.hrtime();

    puppeteer.use(hidden());
    let browser = await puppeteer.launch({
        ignoreHTTPSErrors: true,
        executablePath: executablePath(),
        ...config.launchConf
    });

    const page = await browser.newPage();
    await page.setCacheEnabled(false);
    await page.setDefaultTimeout(config.timeout);
    await page.setDefaultNavigationTimeout(config.timeout);

    await page.setViewport({
        width: 1920,
        height: 1280,
        deviceScaleFactor: 1,
    });

    try {
        let reintento = 0;
        while (true) {
            try {
                await page.goto(config.targeturi, {
                    waitUntil: 'networkidle0',
                });

                await validateLogin(page);
                await page.waitForSelector('#verDetalleEstDiaCivil > tr');
                break;
            } catch (error) {
                reintento++;
                if (reintento > 3) {
                    break;
                } else {
                    continue;
                }

            }
        }
        if (reintento > 3) {
            throw Error("no se pudo conectar")
        }
        let rows = await page.$$('#verDetalleEstDiaCivil > tr');

        let causas = [];
        if (rows.length > 1) {

            let causaTitle = await titulosCausas(page);
            let { cantCausas, paginas } = await cantidadPaginas(page);

            console.log('cantidad de paginas:', paginas);
            console.log('cantidad de causas:', cantCausas);

            let result = [];
            if (paginas === 1) {
                console.log("pagina:", paginas, "de:", paginas);

                result = await getCausas(page, causaTitle, paginas, usuario);

                causas = causas.concat(result);
                insertUpdateCausas(causas);
            } else {
                console.log("pagina:", 1, "de:", paginas);
                for await (let num of asyncGenerator(paginas)) {
                    try {
                        result = await getCausas(page, causaTitle, num, usuario);
                        await insertUpdateCausas(result);
                        causas = causas.concat(result);
                        await page.waitForSelector('#verDetalleEstDiaCivil > tr:nth-child(' + (result.length + 1) + ') > td > nav > ul');
                        await page.evaluate(function(num) {
                            pagina(num + 1, 3);
                        }, num);

                        result = await loop(page, causaTitle, num, usuario);
                    } catch (error) {
                        await page.screenshot({ path: './error.png', fullPage: true });
                        console.log(error);
                        throw error;
                    }
                    console.log("pagina:", num + 1, "de:", paginas);

                }
                await insertUpdateCausas(result);
                causas = causas.concat(result);
            }

            console.log('causas resultantes:', causas.length);

            if (cantCausas != causas.length) {
                throw Error("no se cargaron todas las causas");
            }

            await page.setDefaultTimeout(config.maxTimeout);
            await page.setDefaultNavigationTimeout(config.maxTimeout);

            causas = await getCausasBD(peticion.usuario);

            causas = await getCausasModal(page, causas, paginas, causaTitle, peticion.usuario);

            await insertUpdateCausas(causas);

            await deepReplace(causas, 'url');

        }

        const end = parseHrtimeToSeconds(process.hrtime(start))
        console.info(`Tiempo de ejecución ${end} ms`);

        await page.evaluate(function() {
            salir();
        });
        await browser.close();
        res.json({
            status: 200,
            msg: `OK`,
            data: causas
        })

    } catch (error) {
        await page.screenshot({ path: './error.png', fullPage: true })
        console.log(error);
        await page.evaluate(function() {
            salir();
        });
        await browser.close();
        res.json({
            status: 500,
            msg: `Error`,
            data: error.message
        })

    } finally {
        return;
    }

    async function insertUpdateCausas(causas) {
        const causaUpdate = causas.map(causa => ({
            updateOne: {
                filter: {
                    Rol: causa.Rol,
                    Caratulado: causa.Caratulado,
                    Tribunal: causa.Tribunal
                },
                update: {
                    $set: causa,
                    $setOnInsert: {
                        created_at: Date.now()
                    }
                },
                upsert: true
            }
        }));

        return await causaModel.bulkWrite(causaUpdate);
    }

    async function deleteDoctos(doctos) {
        const doctoDelete = doctos.map(docto => ({
            deleteMany: {
                filter: {
                    Rol: docto.Rol,
                    Caratulado: docto.Caratulado,
                    Tribunal: docto.Tribunal,
                    usuario: docto.usuario
                }
            }
        }));

        return await doctoModel.bulkWrite(doctoDelete);
    }

    async function insertUpdateDoctos(doctos) {
        const doctoUpdate = doctos.map(docto => ({
            updateOne: {
                filter: {
                    uuid: docto.uuid,
                },
                update: {
                    $set: docto,
                    $setOnInsert: {
                        created_at: Date.now()
                    }
                },
                upsert: true
            }
        }));

        return await doctoModel.bulkWrite(doctoUpdate);
    }


    async function getCausasBD(usuario) {
        retorno = [];
        let consulta = {};
        if (usuario) {
            consulta['usuario'] = usuario;
        }
        /*if (where) {
            consulta['$where'] = "this.cuadernos.length === 0";
        }*/
        const causas = await causaModel.find(consulta);
        for await (const causa of causas) {
            retorno.push({ Detalle: causa.Detalle, Rol: causa.Rol, Fecha: causa.Fecha, Caratulado: causa.Caratulado, Tribunal: causa.Tribunal });
        }
        return retorno;
    }

    async function validateLogin(page) {
        if (page.url() === config.targeturi) {
            await loginEstadoDiario(page);
            await loadEstadoDiario(page);
            await consultaEstadoDiario(page);
            return false;
            /*} else {
                await page.evaluate(() => {
                    location.reload(true)
                });
                await loadEstadoDiario(page);
                await consultaEstadoDiario(page);*/
        }
        return true;
    }

    async function loginEstadoDiario(page) {
        await page.waitForSelector('#page-wrapper > section.banner > div > div.container.hidden-xs > div > div:nth-child(1) > div > button:nth-child(1)');
        await page.click('#page-wrapper > section.banner > div > div.container.hidden-xs > div > div:nth-child(1) > div > button:nth-child(1)');

        await page.waitForSelector('#btnSegClave')
        await page.click('#btnSegClave')
        await timeout(2000);

        await page.waitForSelector('#rut');
        await page.focus('#rut');
        await page.keyboard.type(peticion.usuario);

        await page.waitForSelector('#password')
        await page.focus('#password');
        await page.keyboard.type(peticion.password);

        await page.waitForSelector('#btnSegundaClaveIngresar')
        await page.click('#btnSegundaClaveIngresar')

        /*
        await page.waitForSelector('#myDropdown > a:nth-child(1)')
        await page.click('#myDropdown > a:nth-child(1)')

        await timeout(2000);

        await page.waitForSelector('#uname');
        await page.focus('#uname');
        await page.keyboard.type('rut clave unica');

        await page.waitForSelector('#pword')
        await page.focus('#pword');
        await page.keyboard.type('pass word clave unica');

        await page.waitForSelector('#login-submit')
        await page.click('#login-submit')
        await timeout(5000);
*/
    }

    async function loadEstadoDiario(page) {
        let reintento = 0;
        while (true) {
            try {
                await page.waitForXPath('//*[@id="sidebar"]/ul/li[4]/a');
                const elements = await page.$x('//*[@id="sidebar"]/ul/li[4]/a');
                await elements[0].click();

                await page.waitForSelector('#nuevocolapsador > li:nth-child(3) > a');
                await page.click('#nuevocolapsador > li:nth-child(3) > a');
                try {
                    await page.waitForSelector("#loadPreEstDiaCivil");
                    await page.waitForSelector("#loadPreEstDiaCivil", {
                        hidden: true
                    });
                } catch (error) {

                }
                break;
            } catch (error) {
                reintento++;
                if (reintento > 3) {
                    throw error;
                }
            }
        }
    }

    async function consultaEstadoDiario(page) {

        await page.waitForSelector('#fechaEstDiaCiv');
        const valor = await page.$eval("#fechaEstDiaCiv", (input) => {
            return input.getAttribute("value")
        })
        if (valor != peticion.fecha) {
            await page.$eval('#fechaEstDiaCiv', el => el.value = '');
            try {
                await page.waitForSelector("#loadPreEstDiaCivil");
                await page.waitForSelector("#loadPreEstDiaCivil", {
                    hidden: true
                })
            } catch (error) {

            }
            await page.waitForSelector('#btnConsultaEstDiaCivil', { visible: true });

            await page.click('#btnConsultaEstDiaCivil');
            try {
                await page.waitForSelector("#loadPreEstDiaCivil");
                await page.waitForSelector("#loadPreEstDiaCivil", {
                    hidden: true
                })
            } catch (error) {

            }
            await page.waitForSelector('#fechaEstDiaCiv', { visible: true });
            await page.type('#fechaEstDiaCiv', peticion.fecha, { delay: 10 });
            try {
                await page.waitForSelector("#loadPreEstDiaCivil");
                await page.waitForSelector("#loadPreEstDiaCivil", {
                    hidden: true
                });
            } catch (error) {

            }
            await page.waitForSelector('#btnConsultaEstDiaCivil', { visible: true });
            await page.click('#btnConsultaEstDiaCivil');
        }

        try {
            await page.waitForSelector("#loadPreEstDiaCivil");
            await page.waitForSelector("#loadPreEstDiaCivil", {
                hidden: true
            });
        } catch (error) {

        }
    }

    async function refreshDetalle(page, paginas, causaTitle, usuario, dataRows, result) {
        let rowpage = [];
        let causas = [];
        if (paginas === 1) {
            console.log("pagina:", paginas, "de:", paginas);

            rowpage = await getCausas(page, causaTitle, paginas, usuario);

            causas = causas.concat(rowpage);


        } else {
            console.log("pagina:", 1, "de:", paginas);
            for await (let num of asyncGenerator(paginas)) {
                try {

                    rowpage = await getCausas(page, causaTitle, num, usuario);
                    causas = causas.concat(rowpage);
                    await page.waitForSelector('#verDetalleEstDiaCivil > tr:nth-child(' + (rowpage.length + 1) + ') > td > nav > ul');
                    await page.evaluate(function(num) {
                        pagina(num + 1, 3);
                    }, num);

                    rowpage = await loop(page, causaTitle, num, usuario);
                } catch (error) {
                    await page.screenshot({ path: './error.png', fullPage: true });
                    console.log(error);
                    throw error;
                }
                console.log("pagina:", num + 1, "de:", paginas);

            }
            causas = causas.concat(rowpage);
        }
        const retorno = [];
        for await (let causa of result) {
            let procesado = dataRows.filter(c => c.Rol === causa.Rol && c.Caratulado === causa.Caratulado && c.Tribunal === causa.Tribunal);
            let detalle = causas.filter(c => c.Rol === causa.Rol && c.Caratulado === causa.Caratulado && c.Tribunal === causa.Tribunal);
            if (detalle.length > 0 && procesado.length === 0) {
                causa.Detalle = detalle[0].Detalle;
                retorno.push(causa);
            }
        }

        return retorno;
    }

    async function getCausasModal(page, result, paginas, causaTitle, usuario) {
        let dataRows = []
        let i = 1;
        const total = result.length;
        while (true) {
            let reload = false;
            for await (const causa of result) {
                await validateLogin(page);
                console.log('procesando causa ', i, ' de ', total, ' detalle ', causa);
                await deleteDoctos([causa]);
                const modalContent = await openRowModal(causa, usuario);
                if (modalContent === "Causa No Disponible") {
                    throw Error("Causa No Disponible");
                }
                if (modalContent.length === 0) {
                    reload = true;
                    break;
                }
                modalContent.updated_at = Date.now();
                await insertUpdateCausas([modalContent]);
                dataRows.push(modalContent)
                i++;
            }
            if (reload) {
                await page.evaluate(() => {
                    location.reload(true)
                });
                await loadEstadoDiario(page);
                await consultaEstadoDiario(page);
                result = await refreshDetalle(page, paginas, causaTitle, usuario, dataRows, result);
                continue;
            }
            break;
        }
        return dataRows;
    }

    async function loop(page, causaTitle, num, usuario) {
        let retorno = [];
        let reintento = 0;
        while (true) {
            try {
                try {
                    await page.waitForSelector('#verDetalleEstDiaCivil > tr');
                    const causasPagina = await page.$$eval('#verDetalleEstDiaCivil > tr', el => el.length);
                    await page.waitForSelector('#verDetalleEstDiaCivil > tr:nth-child(' + causasPagina + ') > td > nav > div > b', { timeout: 1000 });
                    if (causasPagina > 1) {
                        let pagina = '0';
                        let element = await page.$('#verDetalleEstDiaCivil > tr:nth-child(' + causasPagina + ') > td > nav > ul > li.page-item.active > span')
                        pagina = await page.evaluate(el => el.textContent, element)
                        if (parseInt(pagina) === (num + 1)) {
                            retorno = await getCausas(page, causaTitle, num, usuario);
                            break;
                        }

                    }
                } catch (error) {
                    if (page.url() === config.targeturi) {
                        throw error;
                    }
                    continue;
                }
            } catch (error) {
                await page.screenshot({ path: './error.png', fullPage: true });
                reintento++;
                if (reintento > 3) {
                    throw error;
                }
                if (!await validateLogin(page)) {
                    await page.evaluate(function(num) {
                        pagina(num + 1, 3);
                    }, num);
                    continue;
                };
            }
        }
        return retorno;
    }

    async function timeout(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function* asyncGenerator(paginas) {
        let i = 1;
        while (i < paginas) {
            yield i++;
        }
    }

    async function getCausas(page, causaTitle, num, usuario) {
        try {
            let result = [];
            let reintento = 0;
            while (true) {
                try {
                    try {
                        await page.waitForSelector("#loadPreEstDiaCivil");
                        await page.waitForSelector("#loadPreEstDiaCivil", {
                            hidden: true
                        });
                    } catch (error) {

                    }

                    await page.waitForSelector('#verDetalleEstDiaCivil > tr', { visible: true });
                    result = await page.$$eval('#verDetalleEstDiaCivil > tr', rows => {
                        return Array.from(rows, row => {
                            const columns = row.querySelectorAll('td');
                            return Array.from(columns, col => {
                                const link = col.querySelector("a")
                                if (link) {
                                    return link.getAttribute("onclick")
                                } else {
                                    return col.innerText.trim()
                                }
                            })
                        });
                    });
                    break;
                } catch (error) {
                    reintento++;
                    if (reintento > 3) {
                        throw error;
                    }
                    try {
                        if (!await validateLogin(page)) {
                            await page.evaluate(function(num) {
                                pagina(num, 3);
                            }, num);
                            continue;
                        };
                    } catch (error) {
                        throw error;
                    }

                }
            }

            if (result[result.length - 1] && result[result.length - 1].length < 5) {
                result.splice(result.length - 1);
            }
            let causas = [];

            for await (const row of result) {
                let causa = {};
                for await (const [i, title] of causaTitle.entries()) {
                    causa[title] = row[i];
                }
                causa.uuid = uuidv4();
                causa.usuario = usuario;
                causas.push(causa);
            }
            return causas;
            //return result;
        } catch (error) {
            await page.screenshot({ path: './error.png', fullPage: true })
            console.log("error en getCausas:", error);
            throw error;
        }

    }

    async function openRowModal(row, usuario) {
        try {
            let expirado = false;
            //let modalData = []
            //const selector = `#verDetalleEstDiaCivil > tr:nth-child(${i}) > td:nth-child(1) > a[onclick="${row[0]}"]`;

            /*const selector = `#verDetalleEstDiaCivil > tr:nth-child(${i}) > td:nth-child(1) > a`;
            await page.waitForSelector(selector, {
                visible: true
            });*/
            let intentos = 0;

            const modalSelector = '#modalDetalleEstDiaCivil';

            //await page.click(selector);

            while (true) {
                try {
                    await page.evaluate(`${row['Detalle']}`);

                    try {
                        await page.waitForSelector(".imgLoad", {
                            hidden: true
                        })
                    } catch (error) {

                    }

                    try {
                        await page.waitForSelector(`${modalSelector} .tab-content table tr`, {
                            visible: true
                        });

                    } catch (error) {
                        for (let cont = 1; cont <= 3; cont++) {
                            try {
                                await page.waitForSelector('body > div.sweet-alert.showSweetAlert.visible > p', { timeout: 1000 });
                                let element = await page.$('body > div.sweet-alert.showSweetAlert.visible > p');
                                let value = await page.evaluate(el => el.textContent, element);
                                if (value === 'El vinculo ha expirado, por favor consulte nuevamente.') {
                                    expirado = true;
                                    return [];
                                }
                                if (value === 'Causa No Disponible.') {
                                    return "Causa No Disponible";
                                }
                            } catch (error) {

                            }
                            await timeout(1000);
                        }

                    }

                    /* cuando no puede abrir la causa

                    await page.waitForSelector(modalSelector, {
                        visible: true
                    });
                    try {
                        await page.waitForSelector('body > div.sweet-alert.showSweetAlert.visible > div.sa-button-container > div > button', { timeout: 500 });

                        const selectAll = await page.$$('body > div.sweet-alert.showSweetAlert.visible > div.sa-button-container > div > button');
                        if (selectAll.length > 0) {
                            //await selectAll[0].click();
                            intentos = 4;
                            break;
                        }
                    } catch (error) {

                    }

                    */

                    /* const buttonHandle = await page.$$eval(selector, buttons => Array.from(buttons, btn => btn.getAttribute("href")))
                    const modalSelector = `${buttonHandle[0]}`
                     
                        await page.waitForSelector(modalSelector, {
                            visible: true
                        })
                     
                        */
                    let cuaderno = await getModalCombo(modalSelector, row, usuario);
                    //modalData.push(cuaderno);
                    await page.waitForSelector(`${modalSelector} button.close`, {
                        visible: true
                    });
                    await page.click(`${modalSelector} button.close`);

                    row['cuadernos'] = cuaderno;
                    delete row['Detalle'];
                    break;
                } catch (error) {
                    await page.screenshot({ path: './error.png', fullPage: true });
                    while (true) {
                        try {
                            await validateLogin(page);
                            break;
                        } catch (err) {
                            await page.screenshot({ path: './error.png', fullPage: true });
                            intentos++;
                            if (intentos > 3) {
                                break;
                            }
                        }
                    }
                }
                if (intentos > 3) {

                    break;
                }

            }
            if (intentos > 3) {
                throw "nunca cargo";
            }

            return row || [];
        } catch (error) {
            await page.screenshot({ path: './error.png', fullPage: true })
            console.log("error en causa:", row, "error:", error);
            throw error;
            //await page.screenshot({ path: './error.png', fullPage: true })
            //await browser.close();
            //res.json({
            //    status: 3017,
            //    msg: `OK`,
            //    data: error.message
            //})

        }
        //finally {
        //    return;
        //}

    }

    async function getModalCombo(modalSelector, detcausa, usuario) {

        try {
            let opt = 0
            let selector = []
            let totalOptions = []
            do {
                let optSelcted
                let optionsTabs

                const comboSelector = `${modalSelector} select option`
                await page.waitForSelector(`${modalSelector}`, {
                    visible: true
                });

                selector = await page.$$eval(comboSelector, options => {
                    return Array.from(options, option => {
                        return {
                            label: option.innerHTML.trim(),
                            value: option.getAttribute("value"),
                        }
                    })
                })

                if (selector.length >= 1) {
                    optSelcted = selector[opt]
                }

                if (selector.length > 1) {
                    await page.waitForSelector(`${modalSelector} select `, {
                        visible: true
                    });

                    await page.select(`${modalSelector} select `, optSelcted.value)
                    try {
                        await page.waitForSelector(".imgLoad", {
                            hidden: true
                        })
                    } catch (error) {

                    }
                }

                await page.waitForSelector(`${modalSelector} .tab-content table tr`, {
                    visible: true
                })

                const tabsSelector = `${modalSelector} .modal-content .modal-body .tab-content .tab-pane`
                const tabContent = await page.$$eval(tabsSelector, panes => {
                    return Array.from(panes, pane => {
                        const rowstitle = pane.querySelectorAll("table thead tr");
                        const datatitle = Array.from(rowstitle, row => {
                            const cols = row.querySelectorAll("th");
                            return Array.from(cols, col => {
                                return col.textContent.trim()
                            })
                        })
                        const rows = pane.querySelectorAll("table tbody tr");
                        const data = Array.from(rows, row => {
                            const cols = row.querySelectorAll("td");
                            return Array.from(cols, col => {
                                const docs = col.querySelectorAll("form");
                                if (docs.length > 0) {
                                    const pdfs = [];

                                    docs.forEach(doc => {
                                        const url = doc.getAttribute("action");
                                        const name = doc.querySelector("input").name;
                                        const pdf = doc.querySelector("input").value;
                                        pdfs.push({ url: url + "?" + name + "=" + pdf });
                                    })
                                    return pdfs;
                                } else {
                                    const texto = col.textContent.trim()
                                    return texto
                                }
                            })
                        })

                        return {
                            tab: pane.getAttribute("id"),
                            data,
                            datatitle
                        }
                    })
                })

                let tabs = {};
                for await (const tab of tabContent) {
                    let causas = [];
                    for await (const row of tab.data) {
                        let causa = {};
                        for await (const [i, title] of tab.datatitle[0].entries()) {
                            if (title === 'Doc.') {
                                let pdfs = [];
                                for await (const doc of row[i]) {
                                    //pdfs.push({ url: config.url + doc.url });
                                    let uuid = uuidv4();
                                    let base64encoding = await getBase64FromUrl(config.url + doc.url);
                                    let doctos = [];
                                    let docto = { uuid: uuid, url: config.url + doc.url, contentype: base64encoding.split('|')[0], base64: base64encoding.split('|')[1], Rol: detcausa.Rol, Caratulado: detcausa.Caratulado, Tribunal: detcausa.Tribunal, usuario: usuario };
                                    doctos.push(docto)
                                    await insertUpdateDoctos(doctos);
                                    pdfs.push({ uuid: uuid, url: config.url + doc.url })
                                }
                                causa[title] = pdfs;
                            } else {
                                causa[title] = row[i];
                            }
                        }
                        causas.push(causa);
                    }
                    tabs[tab.tab] = causas;
                }

                if (selector.length >= 1) {
                    optionsTabs = {
                        cuaderno: optSelcted != undefined ? optSelcted.label : "no encontrado",
                        //data: tabContent
                        data: tabs
                    }
                } else {
                    optionsTabs = {
                        //data: tabContent
                        data: tabs
                    }
                }
                totalOptions.push(optionsTabs);
                opt++
            } while (opt < selector.length);

            return totalOptions;
        } catch (error) {
            await page.screenshot({ path: './error.png', fullPage: true })
            console.log("error en getModalCombo:", modalSelector, "error:", error);
            //await page.screenshot({ path: './error.png', fullPage: true })
            //await browser.close();
            /*res.json({
                status: 3017,
                msg: `OK`,
                data: error.message
            })*/
            throw error;

        }

    }

    async function deepReplace(obj, keyName) {
        obj.forEach(async key => {
            if (key === 'cuadernos') {
                delete obj['cuadernos'];
            }
            if (key === keyName) {
                delete obj['contentype'];
                delete obj['base64'];
                delete obj['url'];
            } else if (Array.isArray(obj[key])) {
                obj[key].forEach(async member => await deepReplace(member, keyName));
            } else if (typeof obj[key] === "object") {
                await deepReplace(obj[key], keyName);
            }
        });
    };

    async function getBase64FromUrl(url) {
        return new Promise(async(resolve, reject) => {
            https.get(url, (resp) => {
                let data = '';
                resp.setEncoding('base64');
                data += resp.headers["content-type"] + '|';
                resp.on('data', (base64) => {
                    data += base64;
                });
                resp.on('end', () => {
                    resolve(data);
                });
            }).on('error', (e) => {
                reject(e);
            });
        });
    }

    async function cantidadPaginas(page) {

        const causas = await page.$$eval('#verDetalleEstDiaCivil > tr', el => el.length);
        let paginas = 0;
        let cantCausas = 0;
        if (causas > 1) {
            await page.waitForSelector('#verDetalleEstDiaCivil > tr:nth-child(' + causas + ') > td > nav > div > b');
            let element = await page.$('#verDetalleEstDiaCivil > tr:nth-child(' + causas + ') > td > nav > div > b')
            cantCausas = await page.evaluate(el => el.textContent, element)
            if (cantCausas % 15 === 0) {
                paginas = Math.trunc(cantCausas / 15);
            } else {
                paginas = Math.trunc(cantCausas / 15) + 1;
            }

        }
        return { cantCausas: cantCausas, paginas: paginas };
    }

    function parseHrtimeToSeconds(hrtime) {
        var seconds = (hrtime[0] + (hrtime[1] / 1e9)).toFixed(3);
        return seconds;
    }

    function join(t, a, s) {
        function format(m) {
            let f = new Intl.DateTimeFormat('en', m);
            return f.format(t);
        }
        return a.map(format).join(s);
    }

    function sumarDias(fecha, dias) {
        fecha.setDate(fecha.getDate() + dias);
        return fecha;
    }

    async function titulosCausas(page) {
        await page.waitForSelector('#thTableEstDiaCivil > tr', { visible: true });
        const titleLength = await page.$$eval('#thTableEstDiaCivil > tr > th', el => el.length);
        let titles = [];

        if (titleLength > 1) {
            titles.push('Detalle');
            for (let i = 2; i <= titleLength; i++) {
                titles.push(await page.evaluate(el => el.innerText, await page.$(`#thTableEstDiaCivil > tr > th:nth-child(${i})`)));
            }
        }
        return titles;
    }

})

module.exports = router