# API

## Installation

npm install 

## Installation

npm start

| API | Method  | Uso | Parametros |
| ------------- | ------------- | ------------- | ------------- |
| /api/estado_diario/obtener_estado | POST | Obtiene las causas del dia anterior | usuario: usuario pdj, password: clave pdj |
| /api/consulta_diario/obtener_causa | POST  | Obtener las causas ya procesadas  | usuario: id usuario, uuid: uuid del documento |
| /api/consulta_diario/obtener_documento | POST  | Obtener el documento de una causa | uuid: id de documento obtenido de los metodos anteriores |
|/api/version | GET | Healthcheck | sin parametros |
