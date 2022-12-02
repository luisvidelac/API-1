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

| API | Método  | Uso | Parámetros |
| ------------- | ------------- | ------------- | ------------- |
| /api/estado_diario/obtener_estado | POST | Obtiene las causas del día anterior | usuario: usuario pdj, password: clave pdj |
| /api/consulta_diario/obtener_causa | POST  | Obtener las causas ya procesadas  | usuario: id usuario, uuid: uuid del documento |
| /api/consulta_diario/obtener_documento | POST  | Obtener el documento de una causa | uuid: id de documento obtenido de los metodos anteriores |
|/api/version | GET | Healthcheck | sin parametros |
