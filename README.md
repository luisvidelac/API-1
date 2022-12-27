# API

## Instalación

```bash
npm install o npm i
```

## Variables de entorno .env

```javascript
.env
PORT="3000"
MONGO_URL="mongodb://localhost:27017/pjud"
```

## Mongo String de Conexión y puerto

```javascript
index.js
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true })
    .then(() => {
        console.log('mongo conectado');
    });

app.listen(process.env.PORT, () => {
    console.log('app up! port:', process.env.PORT);
})
    
```

## Ejecución Normal

```bash
npm start 
```

## Ejecución con PM2
```bash
npm i -g pm2
pm2 start index.js --name pjud
pm2 startup
sudo env PATH=$PATH:/home/gespron/.nvm/versions/node/v18.12.1/bin /home/gespron/.nvm/versions/node/v18.12.1/lib/node_modules/pm2/bin/pm2 startup systemd -u gespron --hp /home/gespron
pm2 save
```

## Reinicio servicio PM2
```bash
# obtiene id de proceso
pm2 ls 
# reinicia proceso desde el id obtenido
pm2 restart <id>
```

## Servicio MongoDB
```bash
sudo systemctl status mongod // revisa estado de la base de datos
sudo systemctl start mongod // sube de la base de datos
sudo systemctl stop mongod // sube de la base de datos

sudo systemctl enable mongod // configura el servicio arriba al reiniciar la maquina
sudo systemctl disable mongod // configura el servicio abajo al reiniciar la maquina
```

## Create Index MongoDB

```bash
db.getCollection('causas').createIndex(
  {
    "Rol" : 1,
    "Caratulado" : 1,
    "Tribunal" : 1
},
   {
     name: "find_causas"
   }
);

db.getCollection('causas').createIndex(
  {
    "updated_at" : 1
},
   {
     name: "updated_at_causas"
   }
);

db.getCollection('doctos').createIndex(
  {
    "Rol" : 1,
    "Caratulado" : 1,
    "Tribunal" : 1,
    "usuarios" : 1
},
   {
     name: "find_doctos"
   }
);

db.getCollection('doctos').createIndex(
  {
    "uuid" : 1
},
   {
     name: "uuid_doctos"
   }
);
```

## Resumen APIs

### Documentación Swagger 
```bash
http://localhost:3000/api-doc

```

| API | Método  | Uso | Parámetros | 
| ------------- | ------------- | ------------- | ------------- | 
| /api/estado_diario/obtener_estado | POST | Obtiene las causas del día anterior | usuario: usuario PJUD, password: clave PJUD, receptor: true (opcional), fecha: dd/mm/yyyy fecha consulta estado diario ej: "31/12/2022" (opcional), competencia ej: "civil" |
| /api/consulta_diario/obtener_causa | POST  | Obtener las causas ya procesadas  | usuario: id usuario, uuid: uuid del documento, competencia ej: "civil" |'
| /api/consulta_diario/obtener_documento | POST  | Obtener el documento de una causa | uuid: id de documento obtenido de los metodos anteriores, competencia ej: "civil" |
| /api/consulta_diario/eliminar_causa | POST  | Eliminar las causas y documentos desde la fecha y anteriores | fecha: desde la eliminación de causas y documentos desde fecha y anteriores yyyy-mm-dd, competencia ej: "civil" |
|/api/version | GET | Healthcheck | sin parametros |

## Ejemplos bodys

{ 'competencia': 'suprema' }
{ 'competencia': 'apelaciones' }
{ 'competencia': 'civil', 'receptor': true } // receptor es opcional
{ 'competencia': 'laboral' }
{ 'competencia': 'cobranza', 'receptor': true } // receptor es opcional
{ 'competencia': 'familia' }

## Ejemplos curls

curl --location --request POST 'http://localhost:3000/api/estado_diario/obtener_estado' \
--header 'Content-Type: application/json' \
--data-raw '{"usuario": "usuario", "password": "password", "receptor": false, "fecha": "31/12/2022", "competencia": "civil" }'

 curl --location --request POST 'http://localhost:3000/api/consulta_diario/obtener_causa' \
--header 'Content-Type: application/json' \
--data-raw '{ "uuid": "9c99094f-fcf3-425f-ae30-b468552f42d2", "usuario": "usuario", "competencia": "civil" }

curl --location --request POST 'http://localhost:3000/api/consulta_diario/obtener_documento' \
--header 'Content-Type: application/json' \
--data-raw '{
    "uuid": "44e5ce0a-ee73-456c-b481-d0fd384b1e44", "competencia": "civil"
}'

curl --location --request POST 'http://localhost:3000/api/consulta_diario/eliminar_causa' \
--header 'Content-Type: application/json' \
--data-raw '{"fecha":"2022-12-31"}'

curl --location --request GET 'http://localhost:3000/api/version'
