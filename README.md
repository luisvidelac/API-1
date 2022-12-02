# API

## Instalación

```bash
npm install 
```

## Mongo String de Conexión

```javascript
mongoose.connect("mongodb://localhost:27017/pdj", { useNewUrlParser: true })
    .then(() => {
        console.log('mongo conectado');
    });
```

## Ejecución

```bash
npm start 
```

## Resumen APIs

| API | Método  | Uso | Parámetros |Ejemplo | 
| ------------- | ------------- | ------------- | ------------- | ------------- |
| /api/estado_diario/obtener_estado | POST | Obtiene las causas del día anterior | usuario: usuario pdj, password: clave pdj |curl --location --request POST 'http://localhost:3000/api/estado_diario/obtener_estado' \
--header 'Content-Type: application/json' \
--data-raw '{"usuario": "usuario", "password": "password"}'
| /api/consulta_diario/obtener_causa | POST  | Obtener las causas ya procesadas  | usuario: id usuario, uuid: uuid del documento | curl --location --request POST 'http://localhost:3000/api/consulta_diario/obtener_causa' \
--header 'Content-Type: application/json' \
--data-raw '{ "uuid": "9c99094f-fcf3-425f-ae30-b468552f42d2", "usuario": "usuario" }'
| /api/consulta_diario/obtener_documento | POST  | Obtener el documento de una causa | uuid: id de documento obtenido de los metodos anteriores |curl --location --request POST 'http://localhost:3000/api/consulta_diario/obtener_documento' \
--header 'Content-Type: application/json' \
--data-raw '{
    "uuid": "44e5ce0a-ee73-456c-b481-d0fd384b1e44"
}'
|/api/version | GET | Healthcheck | sin parametros |
