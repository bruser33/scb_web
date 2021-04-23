var express = require('express');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var cors = require('cors');
const util = require('util');
const pdf = require('pdfkit');
const fs = require('fs');
var nodemailer = require('nodemailer');


var app = express();

app.use(cors());
app.use('/virtual', express.static('public'));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(bodyParser.json({limit: '50mb', extended: true}));

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'infocargoex@gmail.com',
        pass: 'maraton140000'
    }
});

var con = mysql.createConnection({
    host: "database-1.c0xqcoje0sna.us-west-1.rds.amazonaws.com",
    database: "scbExpress",
    user: "admin",
    password: "shinigami1"
});

function predicateBy(prop) {
    return function (a, b) {
        if (a[prop] > b[prop]) {
            return 1;
        } else if (a[prop] < b[prop]) {
            return -1;
        }
        return 0;
    }
}

function bubble(arr) {
    var len = arr.length;
    for (var i = 0; i < len; i++) {
        for (var j = 0; j < len - i - 1; j++) { // this was missing
            if (arr[i].destino === arr[j].destino && arr[i].cliente < arr[j].cliente) {
                var temp = arr[j];
                arr[j] = arr[i];
                arr[i] = temp;
            }
            f
        }
    }
    return arr;
}

function bubble2(arr) {
    var len = arr.length;
    for (var i = 0; i < len; i++) {
        for (var j = 0; j < len - i - 1; j++) { // this was missing
            if (arr[i].destino === arr[j].destino && arr[i].cliente === arr[j].cliente && arr[i].destinatario < arr[j].destinatario) {
                var temp = arr[j];
                arr[j] = arr[i];
                arr[i] = temp;
            }
        }
    }
    return arr;
}

function generatePdfAndSend(nombrecliente, tns, id, correo, proceso, estado, idcliente, diaActual, chofer, portalName, motivo) {
    if (proceso === 'ACCESO ANDEN') {
        console.log('datos ch0oferes', chofer + '--' + portalName);
    }
    var datetime = new Date();
    tns.sort(predicateBy("destino"));

    console.log('tns a imprimir ');
    console.log(tns);
    var bultos = tns.length;
    var ods = [];
    tns = bubble(tns);
    tns = bubble2(tns);
    console.log("tns ordenados");
    console.log(tns);
    for (let i in tns) {
        var aux = true;
        for (let j in ods) {
            if (tns[i].od === ods[j].od) {
                aux = false;
            }
        }
        if (aux) {
            ods.push(tns[i]);
        }
    }
    var doc = new pdf();
    var nombrepdf = "./manifiestos/" + id + ".pdf";
    const stream = doc.pipe(fs.createWriteStream(nombrepdf));
    doc.font('TitilliumWeb.ttf')
        .fontSize(23)
        .text('MANIFIESTO DE ' + proceso + ' Nº' + id, 150, 20)
        .fontSize(13)
        .text('CARGO EX TRANSCURRIER', 205, 55)
        .fontSize(13)
        .text(ods.length + ' ods', 480, 55)
        .text(diaActual, 220, 70)
        .text(bultos + ' bultos', 480, 70)
        .fontSize(13)
        .text(nombrecliente.substring(0, 28) + ' IDº ' + idcliente, 200, 90)
        .fontSize(11)
        .text('OD', 40, 140)
        .text('TN', 110, 140)
        .text('GUIA', 180, 140)
        .text('DESTINO', 300, 140)
        .text('BULTOS', 500, 140)
        .text('__________________________________________________________________________', 20, 150);
    if (proceso !== 'ETIQUETADO') {
        doc.text(estado, 460, 90)

    }
    var ejexod = 20;
    var ejextn = 100;
    var ejexguia = 160;
    var ejexdestino = 250;
    var ejexcomuna = 370;
    var ejexbultos = 510;
    var ejeyinfo = 170;
    var ejexlinea = 20;
    var ejeylinea = 180;
    var cantidadHojas = (bultos + 2) / 17;
    for (var i = 0; i <= tns.length; i++) {
        if (i % 16 === 0 && i > 0) {
            doc.addPage();
            var ejeyinfo = 90;
            var ejeylinea = 100;
        }
        if (i === tns.length) {
            if (tns[i].od === null || tns[i].od === "null") {
                tns[i].od = tns[i].OD_PAPEL;
            }
            ejextn += 200;
            doc.fontSize(8).fillColor('black')
                .text(chofer, ejexod, ejeyinfo)
                .text(portalName, ejextn, ejeyinfo)
            ejeyinfo += 20;
            ejeylinea += 30;
            doc.fontSize(8)
                .text('RESPONSABLE ENTREGA', ejexod, ejeyinfo)
                .text('RESPONSABLE RECEPCION', ejextn, ejeyinfo)
        } else if (tns[i].STATUS === 'false') {
            doc.fontSize(9).fillColor('red')
                .text((tns[i].od + '').substring(0, 11), ejexod, ejeyinfo)
                .text((tns[i].tn + '').substring(0, 9), ejextn, ejeyinfo)
                .text((tns[i].guia + '').substring(0, 17), ejexguia, ejeyinfo)
                .text((tns[i].direccion + '-' + tns[i].destino).substring(0, 54), ejexdestino, ejeyinfo)
                .text(tns[i].BULTOS, ejexbultos, ejeyinfo)
                .text('___________________________________________________________________________________________', ejexlinea, ejeylinea);
            ejeyinfo += 30;
            ejeylinea += 30;
        } else if (tns[i].STATUS === 'preview') {
            doc.fontSize(9).fillColor('blue')
                .text((tns[i].od + '').substring(0, 11), ejexod, ejeyinfo)
                .text((tns[i].tn + '').substring(0, 9), ejextn, ejeyinfo)
                .text((tns[i].guia + '').substring(0, 17), ejexguia, ejeyinfo)
                .text((tns[i].direccion + '-' + tns[i].destino).substring(0, 54), ejexdestino, ejeyinfo)
                .text(tns[i].BULTOS, ejexbultos, ejeyinfo)
                .text('___________________________________________________________________________________________', ejexlinea, ejeylinea);
            ejeyinfo += 30;
            ejeylinea += 30;
        } else {
            doc.fontSize(9).fillColor('black')
                .text((tns[i].od + '').substring(0, 11), ejexod, ejeyinfo)
                .text((tns[i].tn + '').substring(0, 9), ejextn, ejeyinfo)
                .text((tns[i].guia + '').substring(0, 17), ejexguia, ejeyinfo)
                .text((tns[i].direccion + '-' + tns[i].destino).substring(0, 54), ejexdestino, ejeyinfo)
                .text(tns[i].BULTOS, ejexbultos, ejeyinfo)
                .text('___________________________________________________________________________________________', ejexlinea, ejeylinea);
            ejeyinfo += 30;
            ejeylinea += 30;
        }
    }
    doc.end();
    var list = [correo, "jonathan.olaguibel@gmail.com"];
    if (estado === 'INCOMPLETO') {
        console.log('motivo es ', motivo);
        const mailOptions = {
            from: 'infocargoex@gmail.com', // sender address
            to: list, // list of receivers
            subject: 'MANIFIESTO ' + proceso + ' ' + diaActual, // Subject line
            html: '<p>Manifiesto de carga nº ' + id + ' - ' + proceso + ' con estado INCOMPLETO debido a : ' + motivo + '</p>',
            attachments: [
                {
                    filename: nombrepdf,
                    path: nombrepdf
                }
            ]
        };
        console.log(mailOptions);
        transporter.sendMail(mailOptions, function (err, info) {
            if (err)
                console.log(err)
            else {
                fs.unlinkSync(nombrepdf);
                console.log(info);
            }
        });
    } else {
        const mailOptions = {
            from: 'infocargoex@gmail.com', // sender address
            to: list, // list of receivers
            subject: 'MANIFIESTO ' + proceso + ' ' + diaActual, // Subject line
            html: '<p>Manifiesto de carga nº ' + id + ' - ' + proceso + '</p>',
            attachments: [
                {
                    filename: nombrepdf,
                    path: nombrepdf
                }
            ]
        };
        console.log(mailOptions);
        transporter.sendMail(mailOptions, function (err, info) {
            if (err)
                console.log(err)
            else {
                fs.unlinkSync(nombrepdf);
                console.log(info);
            }
        });
    }
}


con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
});

app.get('/', function (llamado, respuesta) {
    console.log('se hizo un llamado get');
    respuesta.send("hola desde express");
})

app.post('/clientes', function (llamado, respuesta) {
    var type = llamado.header('Content-Type');
    var api = llamado.header('X-API-KEY');

    respuesta.setHeader('Access-Control-Allow-Origin', '*');
    respuesta.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    respuesta.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    respuesta.setHeader('Access-Control-Allow-Credentials', true);
    console.log('type es' + type + 'api es ' + api);
    var consulta = "SELECT * FROM CLIENTES ";

    con.query(consulta, function (err, result, fields) {
        if (err) throw err;
        console.log(result);
        respuesta.send(result);
        respuesta.end();
    });

});

app.post('/estados', function (llamado, respuesta) {
    var type = llamado.header('Content-Type');
    var api = llamado.header('X-API-KEY');

    respuesta.setHeader('Access-Control-Allow-Origin', '*');
    respuesta.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    respuesta.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    respuesta.setHeader('Access-Control-Allow-Credentials', true);
    console.log('type es' + type + 'api es ' + api);
    var consulta = "SELECT * FROM ESTADOS WHERE CODIGO NOT IN (0) ";

    con.query(consulta, function (err, result, fields) {
        if (err) throw err;
        console.log(result);
        respuesta.send(result);
        respuesta.end();
    });

});

app.post('/gestiones', function (llamado, respuesta) {
    var type = llamado.header('Content-Type');
    var api = llamado.header('X-API-KEY');
    console.log('body', llamado.body);
    var fechai = llamado.body.fechai;
    var fechaf = llamado.body.fechaf;
    var idcliente = llamado.body.idcliente;
    respuesta.setHeader('Access-Control-Allow-Origin', '*');
    respuesta.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    respuesta.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    respuesta.setHeader('Access-Control-Allow-Credentials', true);

//  var consulta ="SELECT A.OD_PAPEL AS OD,  A.NOMBRE,   A.RUT,   SUBSTRING(FH_GESTION, 1, 10) AS FECHA,  A.FH_GESTION AS FECHA_HORA, (SELECT  DESCRIPCION FROM ESTADOS  WHERE  CODIGO = A.COD_ESTADO) AS ESTADO_DESCRIPCION,  A.TIPO_CERTIFICACION, A.LAT_TERRENO, A.LONG_TERRENO, A.TIPO_CERTIFICACION, A.MULTIENTREGA,  CONCAT(A.LAT_TERRENO, ',', A.LONG_TERRENO) AS GEOREFERENCIA,  (SELECT  RUT FROM CHOFERES WHERE COD_CHOFER = A.COD_CHOFER) AS CHOFER, (SELECT NOMBRE FROM CLIENTES  WHERE  ID =  "+idcliente+" ) AS CLIENTE, (SELECT NOMBRE FROM CHOFERES  WHERE COD_CHOFER = A.COD_CHOFER) AS CHOFER, (SELECT  NOMBRE FROM scbExpress.CIUDADES WHERE IATA = (SELECT CIUDAD FROM CHOFERES  WHERE COD_CHOFER = A.COD_CHOFER)) AS CIUDAD, A.DEC_CODE AS CODIGO_HUELLERO, A.MULTIENTREGA AS MULTIGESTION, A.ID_TELEFONO FROM `cargoEX`.`CERTIFICACIONES` A WHERE OD_PAPEL IN (SELECT ID_REFERENCIA  FROM scbExpress.ORDENES WHERE COD_CLIENTE = "+idcliente+" AND SUBSTR(FH_SYS, 1, 10) BETWEEN CAST('"+fechai+"' AS DATE) AND CAST('"+fechaf+"' AS DATE)) ORDER BY ID DESC";
    var consulta = "SELECT A.FH_SYS AS FECHA_CREACION, A.OD_PAPEL, (SELECT NOMBRE FROM CLIENTES WHERE ID = A.COD_CLIENTE) AS CLIENTE, \
    A.NOMBRE, \
    A.DIRECCION, \
    A.GUIA,(SELECT NOMBRE FROM CIUDADES WHERE IATA = A.COMUNA) AS CUIDAD_DESTINO,\
    (SELECT NOMBRE FROM CIUDADES WHERE IATA = A.COMUNA_ORIGEN) AS CUIDAD_ORIGEN,\
    (SELECT IATA_PADRE FROM CIUDADES WHERE IATA = A.COMUNA) AS AGENTE_RESPONSABLE,\
    A.TELEFONO,\
    A.MAIL,\
    A.PESO,\
    A.ALTO,\
    A.ANCHO,\
    A.LARGO,\
    A.TIPO_CARGA,\
    A.TIPO_NEGOCIO,\
    A.CANAL,\
    A.CENTRO_COSTO,\
    A.NUM_BOLETA, A.BULTOS,\
    (SELECT DESCRIPCION FROM ESTADOS WHERE CODIGO = B.COD_ESTADO) AS ESTADO,\
    B.NOMBRE AS NOMBRE_RECEPTOR,\
    B.RUT AS RUT_RECEPTOR,\
    B.FH_GESTION AS FECHA_EN_TERRENO,\
    B.FH_GESTION AS FECHA_TRANSMISION,\
    B.TIPO_CERTIFICACION,\
    B.NOTA,\
    (SELECT ID_MANIFIESTO FROM scbExpress.PICKING where OD = A.OD_PAPEL ORDER BY ID DESC LIMIT 1) AS ID_MANIFIESTO FROM\
    ORDENES A\
        LEFT JOIN\
    CERTIFICACIONES B ON A.OD_PAPEL = B.OD_PAPEL \
WHERE \
                A.COD_CLIENTE = " + idcliente + " \
AND \
    SUBSTR(A.FH_SYS, 1, 10) BETWEEN CAST('" + fechai + "' AS DATE) AND CAST('" + fechaf + "' AS DATE) ORDER BY A.ID, A.OD_PAPEL, A.COD_CLIENTE DESC ";
    console.log(consulta);
    con.query(consulta, function (err, result, fields) {
        if (err) throw err;

        console.log('entro a mostrar resultado');
        console.log(result);
        respuesta.send(result);
        respuesta.end();
    });

});

app.post('/obtenerOrdenes', function (llamado, respuesta) {
    var type = llamado.header('Content-Type');
    var api = llamado.header('X-API-KEY');
    var fecha = llamado.body.fecha;
    respuesta.setHeader('Access-Control-Allow-Origin', '*');
    respuesta.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    respuesta.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    respuesta.setHeader('Access-Control-Allow-Credentials', true);

    var consulta = "SELECT OD_PAPEL,NOMBRE,RUT,DIRECCION,COMUNA,COMUNA_ORIGEN,BULTOS,ALTO,ANCHO,LARGO,PESO,LAT_ORIGEN AS latitude, LONG_ORIGEN AS longitude FROM scbExpress.ORDENES \
WHERE DATE_FORMAT(FH_SYS, '%Y %m %d') = DATE_FORMAT('" + fecha + "', '%Y %m %d') \
AND LONG_ORIGEN !=''";

    console.log(consulta);
    con.query(consulta, function (err, result, fields) {
        if (err) throw err;
        console.log(result);
        respuesta.send(result);
        respuesta.end();
    });

});

app.post('/login', function (llamado, respuesta) {
    var user = llamado.body.user;
    var pass = llamado.body.pass;
    console.log('llego a logear', user + "---" + pass);
    respuesta.setHeader('Access-Control-Allow-Origin', '*');
    respuesta.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    respuesta.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    respuesta.setHeader('Access-Control-Allow-Credentials', true);

    var consulta = "SELECT COD_CHOFER, NOMBRE, RUT FROM CHOFERES WHERE RUT='" + user + "' AND PASSWORD ='" + pass + "'";
    var consulta2 = "SELECT * from ESTADOS";
    var consulta3 = "SELECT * from CLIENTES";

    con.query(consulta, function (err, result, fields) {
        if (err) throw err;
        console.log(result);
        if (result.length > 0) {
            con.query(consulta2, function (err, result2, fields) {
                if (err) throw err;
                con.query(consulta3, function (err, result3, fields) {
                    if (err) throw err;
                    console.log({status: true, data: result[0], estados: result2, clientes: result3});
                    respuesta.send({status: true, data: result[0], estados: result2, clientes: result3});
                    ;
                    respuesta.end();
                });
            });
        } else {
            respuesta.send(false);
            ;
            respuesta.end();
        }
    });

});
app.post('/mantn', function (req, res) {

    var type = req.header('Content-Type');
    var api = req.header('X-API-KEY');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    let TN = req.body.tn
    if (api === '55IcsddHxiy2E3q653RpYtb') {
        var consulta = "SELECT\
          A.ID,\
          A.FH_SYS,\
          A.FH_CREACION,\
          A.FH_CIERRE,\
          A.COD_USUARIO,\
          A.PROCESO,\
          A.ID_CLIENTE,\
          A.ESTADO,\
          B.ID,\
          B.TN,\
          B.TN AS tn,\
          B.OD AS od,\
          B.ID_MANIFIESTO AS manifiesto,\
          B.FH_SYS,\
          CAST(CONCAT((SELECT\
                              COUNT(*)\
                          FROM\
                              PICKING\
                          WHERE\
                              OD = B.OD AND ID <= B.ID\
                                  AND ID_MANIFIESTO = B.ID_MANIFIESTO\
                          LIMIT 1),\
                      '/',\
                      (SELECT\
                              BULTOS\
                          FROM\
                              ORDENES\
                          WHERE\
                              OD = B.OD\
                          LIMIT 1))\
              AS CHAR) AS BULTOS,\
          (SELECT\
                  BULTOS\
              FROM\
                  ORDENES\
              WHERE\
                  OD = B.OD\
              LIMIT 1) AS bultos,\
          (SELECT\
                  COUNT(*)\
              FROM\
                  PICKING\
              WHERE\
                  ID_MANIFIESTO = B.ID_MANIFIESTO\
              LIMIT 1) AS TOTALTNS,\
          (SELECT\
                  CLIENTES.NOMBRE\
              FROM\
                  CLIENTES\
              WHERE\
                  CLIENTES.ID = ID_CLIENTE\
              LIMIT 1) AS NOMBRE_CLIENTE,\
          (SELECT\
                  CLIENTES.CORREO\
              FROM\
                  CLIENTES\
              WHERE\
                  CLIENTES.ID = ID_CLIENTE) AS EMAIL_CLIENTE,\
          (SELECT\
                  ALTO\
              FROM\
                  ORDENES\
              WHERE\
                  ORDENES.OD = B.OD\
              LIMIT 1) AS alto,\
          (SELECT\
                  ANCHO\
              FROM\
                  ORDENES\
              WHERE\
                  ORDENES.OD = B.OD\
              LIMIT 1) AS ancho,\
          (SELECT\
                  LARGO\
              FROM\
                  ORDENES\
              WHERE\
                  ORDENES.OD = B.OD\
              LIMIT 1) AS largo,\
          (SELECT\
                  NOMBRE\
              FROM\
                  ORDENES\
              WHERE\
                  ORDENES.OD = B.OD\
              LIMIT 1) AS destinatario,\
          (SELECT\
                  COMUNA\
              FROM\
                  ORDENES\
              WHERE\
                  ORDENES.OD = B.OD\
              LIMIT 1) AS destino,\
          (SELECT\
                  DIRECCION\
              FROM\
                  ORDENES\
              WHERE\
                  ORDENES.OD = B.OD\
              LIMIT 1) AS direccion,\
          (SELECT\
                  COMUNA_ORIGEN\
              FROM\
                  ORDENES\
              WHERE\
                  ORDENES.OD = B.OD\
              LIMIT 1) AS origen,\
          (SELECT\
                  PESO\
              FROM\
                  ORDENES\
              WHERE\
                  ORDENES.OD = B.OD\
              LIMIT 1) AS peso,\
          (SELECT\
                  TELEFONO\
              FROM\
                  ORDENES\
              WHERE\
                  ORDENES.OD = B.OD\
              LIMIT 1) AS telefono,\
      (SELECT\
                  GUIA\
              FROM\
                  ORDENES\
              WHERE\
                  ORDENES.OD = B.OD\
              LIMIT 1) AS guia\
      FROM\
          MANIFIESTO A,\
          PICKING B\
      WHERE\
          A.ID = B.ID_MANIFIESTO\
              AND B.ID_MANIFIESTO = (SELECT\
                  A.ID_MANIFIESTO\
              FROM\
                  PICKING A,\
                  MANIFIESTO B\
              WHERE\
      A.TN = " + TN + " AND A.ID_MANIFIESTO = B.ID\
                      AND B.PROCESO = 'INHOUSE'\
              ORDER BY A.ID DESC\
              LIMIT 1)\
              AND A.ID_CLIENTE = (SELECT\
                  ID_CLIENTE\
              FROM\
                  MANIFIESTO\
              WHERE\
                  ID = (SELECT\
                          ID_MANIFIESTO\
                      FROM\
                          PICKING\
                      WHERE\
                          TN = " + TN + "\
                      ORDER BY ID DESC\
                      LIMIT 1))\
      AND A.ESTADO = 'CERRADO' "

        console.log('consulta anden es ');
        console.log(consulta);
        con.query(consulta, function (err, resultado, fields) {
            if (err) return res.status(500).send({message: 'Error al realizar la peticion'});
            res.status(200).send(resultado);
        })
    }
});

app.post('/registrarGestion', function (llamado, respuesta) {
    var type = llamado.header('Content-Type');
    var api = llamado.header('X-API-KEY');
    var COD_CHOFER = llamado.body.COD_CHOFER;
    var NOMBRE = llamado.body.NOMBRE;
    var RUT = llamado.body.RUT;
    var LAT_ORIGEN = llamado.body.LAT_ORIGEN;
    var LONG_ORIGEN = llamado.body.LONG_ORIGEN;
    var LAT_TERRENO = llamado.body.LAT_TERRENO;
    var LONG_TERRENO = llamado.body.LONG_TERRENO;
    var OD_PAPEL = llamado.body.OD_PAPEL;
    var TN = llamado.body.TN;
    var NOTA = llamado.body.NOTA;
    var FOTO1 = llamado.body.FOTO1;
    var FOTO2 = llamado.body.FOTO2;
    var FOTO3 = llamado.body.FOTO3;
    var FH_GESTION = llamado.body.FH_GESTION;
    var COD_ESTADO = llamado.body.COD_ESTADO;
    var TIPO_CERTIFICACION = llamado.body.TIPO_CERTIFICACION;
    var MULTIENTREGA = llamado.body.MULTIENTREGA;
    var DEC_CODE = llamado.body.DEC_CODE;
    var ID_TELEFONO = llamado.body.ID_TELEFONO;
    var CONEXION = llamado.body.CONEXION;
    var CANAL = llamado.body.CANAL;
    var ID_CLIENTE = llamado.body.ID_CLIENTE;
    var ID_SUCURSAL = llamado.body.ID_SUCURSAL;
    var BULTOS = llamado.body.BULTOS;
    var TELEFONO = llamado.body.TELEFONO;
    var MAIL = llamado.body.MAIL;


    respuesta.setHeader('Access-Control-Allow-Origin', '*');
    respuesta.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    respuesta.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    respuesta.setHeader('Access-Control-Allow-Credentials', true);
    var consulta = "INSERT INTO CERTIFICACIONES (COD_CHOFER,NOMBRE,RUT,LAT_ORIGEN,LONG_ORIGEN,LAT_TERRENO,LONG_TERRENO,OD_PAPEL,TN,NOTA," +
        "FOTO1,FOTO2,FOTO3,FH_GESTION,COD_ESTADO,TIPO_CERTIFICACION,MULTIENTREGA,DEC_CODE,ID_TELEFONO,CONEXION,CANAL," +
        "ID_CLIENTE,ID_SUCURSAL,BULTOS,TELEFONO,MAIL) VALUES ('" + COD_CHOFER + "','" + NOMBRE + "','" + RUT + "','" + LAT_ORIGEN +
        "','" + LONG_ORIGEN + "','" +
        LAT_TERRENO + "','" + LONG_TERRENO + "','" + OD_PAPEL + "','" + TN + "','" + NOTA + "','" + FOTO1 + "','" + FOTO2 + "','" + FOTO3 +
        "','" +
        FH_GESTION + "','" + COD_ESTADO + "','" + TIPO_CERTIFICACION + "','" + MULTIENTREGA + "','" + DEC_CODE + "','" + ID_TELEFONO + "','" +
        CONEXION + "','" + CANAL + "','" +
        ID_CLIENTE + "','" + ID_SUCURSAL + "','" + BULTOS + "','" + TELEFONO + "','" + MAIL + "')";
    console.log("consulta  es" + consulta);
    var sqlLastId = "SELECT ID FROM CERTIFICACIONES WHERE FH_GESTION = '" + FH_GESTION + "' AND OD_PAPEL = " + OD_PAPEL;

    con.query(consulta, function (err, result, fields) {
        if (err) throw err;
        con.query(sqlLastId, function (err, result2, fields) {
            if (err) throw err;
            respuesta.send({success: true,ID_INSERCION:result2[0].ID,OD:OD_PAPEL,FH_GESTION:FH_GESTION});
            respuesta.end();
        });
    });
});

app.post('/registrarCorreo', function (llamado, respuesta) {
    var type = llamado.header('Content-Type');
    var api = llamado.header('X-API-KEY');
    var correo = llamado.body.correo;
    var idcliente = llamado.body.idcliente;
    respuesta.setHeader('Access-Control-Allow-Origin', '*');
    respuesta.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    respuesta.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    respuesta.setHeader('Access-Control-Allow-Credentials', true);
    var consulta = "UPDATE CLIENTES SET CORREO='" + correo + "' WHERE ID=" + idcliente;
    con.query(consulta, function (err, result, fields) {
        if (err) throw err;
        respuesta.send(result);
        respuesta.end();
    });
});

function busquedaRecursiva(arrayreferencias, index, idcliente) {
    if (index < 0) {
        return '';
    }
    var idaux = arrayreferencias[index];
    var consultaIDReferencia = "SELECT OD_PAPEL FROM ID_REFERENCIA_ORDEN_CLIENTE WHERE ID_REFERENCIA = '" + idaux + "' AND COD_CLIENTE = " + idcliente;
    con.query(consultaIDReferencia, function (err, result, fields) {
        if (err) throw err;
        if (result.length > 0) {
            odaux = result[0].OD_PAPEL;
            return odaux;
        } else {
            busquedaRecursiva(arrayreferencias, index - 1, idcliente);
        }
    });
}

app.post('/insertarOrdenes', function (llamado, respuesta) {
    var api = llamado.header('X-API-KEY');
    var ordenes = llamado.body.ordenes;
    var idcliente = llamado.body.idcliente;
    respuesta.setHeader('Access-Control-Allow-Origin', '*');
    respuesta.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    respuesta.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    respuesta.setHeader('Access-Control-Allow-Credentials', true);
    console.log("ordenes son ", ordenes[0]);

    var diaActual2 = llamado.body.dia;
    var fecha = diaActual2.split(' ');
    var diaActual = fecha[0];

    var consulta1 = "SELECT NEXTVAL('OD') as od";

    for (var j = 0; j < ordenes.length; j++) {
        tVal = j;
        (function (j) {
            con.query(consulta1, function (err, result, fields) {
                if (err) throw err;
                var data = result;
                var id_referencia = ordenes[j].guia;
                var od = data[0].od;
                var nombre = ordenes[j].nombre;
                var rut = ordenes[j].rut;
                var direccion = ordenes[j].direccion;
                var comuna = ordenes[j].comuna;
                var latitudComuna = ordenes[j].lat_comuna;
                var longitudComuna = ordenes[j].lng_comuna;
                var telefono = ordenes[j].telefono;
                var mail = ordenes[j].mail;
                var refrigerado = ordenes[j].refrigerado;
                var nota = ordenes[j].nota + "REFRI:" + refrigerado;
                var bultos = ordenes[j].bultos;
                var peso = ordenes[j].peso;
                var alto = ordenes[j].alto;
                var ancho = ordenes[j].ancho;
                var largo = ordenes[j].largo;
                var origen = ordenes[j].origen;
                var tipo_carga = ordenes[j].tipo_carga;
                var centro_costo = ordenes[j].centro_costo;
                var cod_barra = ordenes[j].cod_barra;
                var num_boleta = ordenes[j].num_boleta;
                var valor = ordenes[j].valor;
                var tipo_orden = ordenes[j].tipo_orden;
                var tipo_negocio = ordenes[j].tipo_negocio;
                var canal = ordenes[j].canal;
                var insertaid = id_referencia.includes("-");
                var papel = ordenes[j].papel;
                if (insertaid) {
                    var arrayreferencias = id_referencia.split("-");
                    var index = arrayreferencias.length - 1;
                    var odaux = '';
                    var likesql = '';
                    for (var i = 0; i < arrayreferencias.length; i++) {
                        var idaux = arrayreferencias[i];
                        if (likesql.length > 2) {
                            likesql += ",'" + idaux + "'";
                        } else {
                            likesql = "'" + idaux + "'";
                        }
                    }
                    var consultaIDReferencia = "SELECT OD FROM ID_REFERENCIA_ORDEN_CLIENTE WHERE ID_REFERENCIA IN (" + likesql + ") AND COD_CLIENTE = " + idcliente;
                    con.query(consultaIDReferencia, function (err, result, fields) {
                        if (err) throw err;
                        if (result.length > 0) {
                            odaux = result[0].OD;
                            var deleteIdreferencia = "DELETE FROM ID_REFERENCIA_ORDEN_CLIENTE WHERE OD = '" + odaux + "' AND COD_CLIENTE = " + idcliente;
                            con.query(deleteIdreferencia, function (err, result, fields) {
                                if (err) throw err;
                                var consultaUpdateOrden = "update ORDENES SET FH_UPDATE ='" + diaActual2 + "' ,FH_DIGITACION ='" + diaActual + "' , COD_CLIENTE = " + idcliente + ", ID_REFERENCIA = '" + id_referencia + "', GUIA = '" + id_referencia + "', NOMBRE = '" + nombre + "' \
                    , RUT = '" + rut + "', DIRECCION ='" + direccion + "',COMUNA ='" + comuna + "', LAT_ORIGEN='" + latitudComuna + "',LONG_ORIGEN = '" + longitudComuna + "', NOTA = '" + nota + "' \
                    , TELEFONO = '" + telefono + "', MAIL = '" + mail + "', BULTOS = '" + bultos + "', ALTO ='" + alto + "' , ANCHO= '" + ancho + "', LARGO= '" + largo + "', PESO= '" + peso + "' \
                    , TIPO_CARGA= '" + tipo_carga + "', CENTRO_COSTO='" + centro_costo + "', COD_BARRA='" + cod_barra + "', NUM_BOLETA='" + num_boleta + "', VALOR='" + valor + "', TIPO_ORDEN='" + tipo_orden + "', TIPO_NEGOCIO='" + tipo_negocio + "', CANAL='" + canal + "', COMUNA_ORIGEN='" + origen + "' \
                      Where OD= '" + odaux + "' AND COD_CLIENTE = " + idcliente;
                                con.query(consultaUpdateOrden, function (err, result, fields) {
                                    if (err) throw err;
                                    for (var i = 0; i < arrayreferencias.length; i++) {
                                        var consulta6 = "INSERT INTO ID_REFERENCIA_ORDEN_CLIENTE (ID_REFERENCIA, OD, OD_PAPEL, COD_CLIENTE) VALUES ('" + arrayreferencias[i] + "','" + odaux + "','" + papel + "','" + idcliente + "')";
                                        con.query(consulta6, function (err, result, fields) {
                                            if (err) throw err;
                                        });
                                    }
                                });
                            });
                            /*  for ( var i = 0; i < arrayreferencias.length ; i++ ) {
                    val = i ;
                      (function(i){
                        var idaux = arrayreferencias[i];
                          var deleteIdreferencia = "DELETE FROM ID_REFERENCIA_ORDEN_CLIENTE WHERE ID_REFERENCIA = '"+idaux+"' AND COD_CLIENTE = "+idcliente ;
                          con.query(deleteIdreferencia, function (err, result, fields) {
                          if (err) throw err;
                          });
                      })(val);
                  } */


                        } else {
                            //creo nueva ordenes
                            //inserto guias
                            //  console.log('llego a insercion de orden asi');
                            var consulta5 = "INSERT INTO ORDENES ( FH_DIGITACION, COD_CLIENTE, ID_REFERENCIA,GUIA, OD, OD_PAPEL, NOMBRE, RUT, DIRECCION, COMUNA, LONG_ORIGEN, LAT_ORIGEN, NOTA, \
                                TELEFONO, MAIL, BULTOS, ALTO, ANCHO, LARGO, PESO, TIPO_CARGA, CENTRO_COSTO, TIPO_NEGOCIO, CANAL, \
                                COD_BARRA, NUM_BOLETA, VALOR, TIPO_ORDEN, COMUNA_ORIGEN )\
                                VALUES ( '" + diaActual + "'," + idcliente + ",'" + id_referencia + "','" + id_referencia + "','" + od + "','" + papel + "','" + nombre + "','" + rut + "','" + direccion + "','" + comuna + "','" + latitudComuna + "','" + longitudComuna + "','" + nota + "','" + telefono + "','" + mail + "','" + bultos + "','" + alto + "','" + ancho + "','" + largo + "','" + peso + "','" + tipo_carga + "','" + centro_costo + "','" + tipo_negocio + "','" + canal + "','" + cod_barra + "','" + num_boleta + "','" + valor + "','" + tipo_orden + "','" + origen + "')";
                            con.query(consulta5, function (err, result, fields) {
                                if (err) throw err;
                                for (var i = 0; i < arrayreferencias.length; i++) {

                                    var consulta6 = "INSERT INTO ID_REFERENCIA_ORDEN_CLIENTE (ID_REFERENCIA, OD, OD_PAPEL, COD_CLIENTE) VALUES ('" + arrayreferencias[i] + "','" + od + "','" + papel + "','" + idcliente + "')";
                                    //    console.log('consulta de insercion referencia');
                                    con.query(consulta6, function (err, result, fields) {
                                        if (err) throw err;
                                    });
                                }
                            });
                        }

                    });
                    /*      for ( var i = 0; i < arrayreferencias.length ; i++ ) {
                val = i ;
                  odaux= (function(i){
                  var idaux = arrayreferencias[i];
                  var consultaIDReferencia = "SELECT OD_PAPEL FROM ID_REFERENCIA_ORDEN_CLIENTE WHERE ID_REFERENCIA = '"+idaux+"' AND COD_CLIENTE = "+idcliente ;
                    con.query(consultaIDReferencia, function (err, result, fields) {
                    if (err) throw err;

                      if(result.length >0){
                        odaux=result[0].OD_PAPEL;
                        console.log('od aux esta dentro del select');
                        console.log(odaux);
                        return odaux;
                      }

                    });
                })(val);
            }  */
                } else {
                    var odaux = '';
                    var consultaIDReferencia = "SELECT OD FROM ID_REFERENCIA_ORDEN_CLIENTE WHERE ID_REFERENCIA = '" + id_referencia + "' AND COD_CLIENTE = " + idcliente;
                    console.log(consultaIDReferencia);
                    con.query(consultaIDReferencia, function (err, result, fields) {
                        if (err) throw err;
                        if (result.length > 0) {
                            console.log('entro por mayor a 0 ');
                            console.log(result);
                            odaux = result[0].OD;
                            console.log(odaux);
                            var deleteIdreferencia = "DELETE FROM ID_REFERENCIA_ORDEN_CLIENTE WHERE ID_REFERENCIA = '" + id_referencia + "' AND COD_CLIENTE = " + idcliente;
                            console.log(deleteIdreferencia);
                            con.query(deleteIdreferencia, function (err, result, fields) {
                                if (err) throw err;
                                var consultaUpdateOrden = "update ORDENES SET FH_UPDATE ='" + diaActual2 + "' ,FH_DIGITACION ='" + diaActual + "' , COD_CLIENTE = " + idcliente + ", ID_REFERENCIA = '" + id_referencia + "', GUIA = '" + id_referencia + "', NOMBRE = '" + nombre + "' \
                  , RUT = '" + rut + "', DIRECCION ='" + direccion + "',COMUNA ='" + comuna + "', LAT_ORIGEN='" + latitudComuna + "',LONG_ORIGEN = '" + longitudComuna + "', NOTA = '" + nota + "' \
                  , TELEFONO = '" + telefono + "', MAIL = '" + mail + "', BULTOS = '" + bultos + "', ALTO ='" + alto + "' , ANCHO= '" + ancho + "', LARGO= '" + largo + "', PESO= '" + peso + "' \
                  , TIPO_CARGA= '" + tipo_carga + "', CENTRO_COSTO='" + centro_costo + "', TIPO_NEGOCIO='" + tipo_negocio + "', CANAL='" + canal + "', COD_BARRA='" + cod_barra + "', NUM_BOLETA='" + num_boleta + "', VALOR='" + valor + "', TIPO_ORDEN='" + tipo_orden + "', COMUNA_ORIGEN='" + origen + "', OD_PAPEL='" + papel + "' \
                    Where OD= '" + odaux + "' AND COD_CLIENTE = " + idcliente;
                                console.log(consultaUpdateOrden);
                                con.query(consultaUpdateOrden, function (err, result, fields) {
                                    if (err) throw err;

                                    var consulta6 = "INSERT INTO ID_REFERENCIA_ORDEN_CLIENTE (ID_REFERENCIA, OD, OD_PAPEL, COD_CLIENTE) VALUES ('" + id_referencia + "','" + odaux + "','" + papel + "','" + idcliente + "')";
                                    console.log('consulta de insercion referencia');
                                    console.log(consulta6);
                                    con.query(consulta6, function (err, result, fields) {
                                        if (err) throw err;
                                    });


                                });
                            });


                        } else {
                            // mismo codigo solo sin for
                            //    console.log('menor que 0 osea nueva orden');
                            var consulta5 = "INSERT INTO ORDENES ( FH_DIGITACION, COD_CLIENTE, ID_REFERENCIA, GUIA, OD, OD_PAPEL, NOMBRE, RUT, DIRECCION, COMUNA, LONG_ORIGEN, LAT_ORIGEN, NOTA, \
                          TELEFONO, MAIL, BULTOS, ALTO, ANCHO, LARGO, PESO, TIPO_CARGA, CENTRO_COSTO, TIPO_NEGOCIO, CANAL, \
                          COD_BARRA, NUM_BOLETA, VALOR, TIPO_ORDEN, COMUNA_ORIGEN )\
                          VALUES ( '" + diaActual + "'," + idcliente + ",'" + id_referencia + "','" + id_referencia + "','" + od + "','" + papel + "','" + nombre + "','" + rut + "','" + direccion + "','" + comuna + "','" + latitudComuna + "','" + longitudComuna + "','" + nota + "','" + telefono + "','" + mail + "','" + bultos + "','" + alto + "','" + ancho + "','" + largo + "','" + peso + "','" + tipo_carga + "','" + centro_costo + "','" + tipo_negocio + "','" + canal + "','" + cod_barra + "','" + num_boleta + "','" + valor + "','" + tipo_orden + "','" + origen + "')";

                            con.query(consulta5, function (err, result, fields) {
                                if (err) throw err;

                            });
                            var consulta6 = "INSERT INTO ID_REFERENCIA_ORDEN_CLIENTE (ID_REFERENCIA, OD, OD_PAPEL, COD_CLIENTE) VALUES ('" + id_referencia + "','" + od + "','" + papel + "','" + idcliente + "')";
                            con.query(consulta6, function (err, result, fields) {
                                if (err) throw err;
                            });

                        }


                    });

                }


                if (j === ordenes.length - 1) {
                    console.log('va a responder');
                    respuesta.send('true');
                    respuesta.end();
                }
            });
        })(tVal);


    }
});

app.post('/crearOrden', function (llamado, respuesta) {
    var type = llamado.header('Content-Type');
    var api = llamado.header('X-API-KEY');
    var od = llamado.body.od;
    var idcliente = llamado.body.idcliente;
    var nombre = llamado.body.nombre;
    var rut = llamado.body.rut;
    var direccion = llamado.body.direccion;
    var comuna = llamado.body.comuna;
    var orden = llamado.body.orden;
    var telefono = llamado.body.telefono;
    var mail = llamado.body.mail;
    var guia = llamado.body.guia;
    var largo = llamado.body.largo;
    var alto = llamado.body.alto;
    var ancho = llamado.body.ancho;
    var peso = llamado.body.peso;
    var codigoBarra = llamado.body.codigobarra;
    var boleta = llamado.body.boleta;
    var comunaOrigen = llamado.body.comunaorigen;
    var nota = llamado.body.nota;

    respuesta.setHeader('Access-Control-Allow-Origin', '*');
    respuesta.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    respuesta.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    respuesta.setHeader('Access-Control-Allow-Credentials', true);

    var consulta = "INSERT INTO ORDENES ( NOMBRE, RUT, DIRECCION, COMUNA, LONG_ORIGEN, LAT_ORIGEN, NOTA, TELEFONO, MAIL, GUIA, BULTOS, ALTO, ANCHO, LARGO, PESO, TIPO_CARGA, CENTRO_COSTO, TIPO_NEGOCIO, CANAL, COD_BARRA, NUM_BOLETA, VALOR, TIPO_ORDEN, COMUNA_ORIGEN, FH_DIGITACION, COD_CLIENTE, ID_REFERENCIA, OD_PAPELCIUDADESCIUDADES) VALUES ( '" + nombre + "','" + rut + "','" + direccion + "','" + comuna + "','" + od + "' )";

    con.query(consulta, function (err, result, fields) {
        if (err) throw err;
        console.log(result);
        respuesta.send(result);
        respuesta.end();
    });
});
app.post('/validarAccesoAnden', function (llamado, respuesta) {
    var type = llamado.header('Content-Type');
    var api = llamado.header('X-API-KEY');
    var tn = llamado.body.tn;

    respuesta.setHeader('Access-Control-Allow-Origin', '*');
    respuesta.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    respuesta.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    respuesta.setHeader('Access-Control-Allow-Credentials', true);

    var consulta = "SELECT TN FROM PICKING WHERE( TN = '" + tn + "' AND TN IN (SELECT TN FROM PICKING A,\
MANIFIESTO B WHERE A.ID_MANIFIESTO = B.ID AND B.PROCESO IN ('ACCESOANDEN') ));";

    con.query(consulta, function (err, result, fields) {
        if (err) throw err;
        console.log(result);
        respuesta.send(result);
        respuesta.end();
    });
});

app.post('/traerIncompletos', function (llamado, respuesta) {
    var type = llamado.header('Content-Type');
    var api = llamado.header('X-API-KEY');
    var tn = llamado.body.tn;

    respuesta.setHeader('Access-Control-Allow-Origin', '*');
    respuesta.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    respuesta.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    respuesta.setHeader('Access-Control-Allow-Credentials', true);

    var consulta = "SELECT TN \
FROM \
  PICKING \
WHERE \
  ID_MANIFIESTO = (SELECT \
          AA.ID_MANIFIESTO \
      FROM \
          PICKING AA,\
          MANIFIESTO BB \
      WHERE \
          AA.TN =" + tn + " \
              AND AA.ID_MANIFIESTO = BB.ID \
              AND BB.PROCESO = 'INHOUSE' \
      ORDER BY AA.ID DESC \
      LIMIT 1) \
      AND TN NOT IN (SELECT A.TN \
      FROM \
          PICKING A, \
          MANIFIESTO B \
      WHERE \
          A.ID_MANIFIESTO = B.ID \
              AND B.PROCESO = 'ACCESOANDEN')";
    console.log(consulta);
    con.query(consulta, function (err, result, fields) {
        if (err) throw err;
        console.log(result);
        respuesta.send(result);
        respuesta.end();
    });
});


app.post('/cerrarManifiestoAccesoAnden', function (llamado, respuesta) {
    var type = llamado.header('Content-Type');
    var api = llamado.header('X-API-KEY');
    var id = 0;
    var idcliente = llamado.body.idcliente;
    var tns = llamado.body.tns;
    var nombrecliente = llamado.body.nombrecliente;
    var correo = llamado.body.correo;
    var estado = llamado.body.estado;
    var portal = llamado.body.portal;
    var chofer = llamado.body.chofer;
    var codChofer = llamado.body.codigoChofer;
    var motivo = llamado.body.motivo;
    console.log(portal);
    console.log('chofer', chofer);
    console.log('codChofer', codChofer);
    respuesta.setHeader('Access-Control-Allow-Origin', '*');
    respuesta.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    respuesta.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    respuesta.setHeader('Access-Control-Allow-Credentials', true);
    var diaActual = llamado.body.dia;
    var consulta = "SELECT CREARMANIFIESTO('" + diaActual + "', '" + id + "', 'ACCESOANDEN', '" + idcliente + "') AS MANIFIESTO";
    let aux = [];
    for (let tn of tns) {
        if (tn.STATUS === 'true') {
            aux.push(tn);
        }
    }
    con.query(consulta, function (err, result, fields) {
        if (err) throw err;
        console.log(result);
        var manifiesto = result[0].MANIFIESTO;
        var bultos = aux.length;
        console.log('paso por creacion de manifiesto  de manifiesto');
        var consulta2 = "UPDATE MANIFIESTO SET ESTADO = '" + estado + "', FH_CIERRE = NOW(), COD_OPERADOR_ENTRADA =" + portal + ", COD_CHOFER_ENTRADA =" + codChofer + ", NOMBRE_CHOFER_ENTRADA ='" + chofer + "' WHERE ID = " + manifiesto;
        var consulta3 = "SELECT name from users where id = " + portal;

        for (var j = 0; j < bultos; j++) {
            tVal = j;
            var consulta1 = "INSERT INTO PICKING (TN, OD, ID_MANIFIESTO) VALUES ( " + aux[j].TN + " , " + aux[j].od + ", " + manifiesto + ")";
            console.log('consulta de insercion pocking');
            console.log(consulta1);
            (function (val, bultos) {
                con.query(consulta1, function (err, result, fields) {
                    if (err) throw err;
                    var data = result;
                    if (val === (bultos - 1)) {
                        console.log(consulta3);
                        con.query(consulta3, function (err, result, fields) {
                            if (err) throw err;
                            console.log(result);
                            var portalName = result[0].name;
                            con.query(consulta2, function (err, result, fields) {
                                if (err) throw err;
                                console.log('actualizo manifiesto a cerrado');
                                respuesta.send('true');
                                respuesta.end();
                                generatePdfAndSend(nombrecliente, tns, manifiesto, correo, 'ACCESO ANDEN', estado, idcliente, diaActual, chofer, portalName, motivo);
                            });
                        });
                    }
                });
            })(tVal, bultos);
        }

    });
});
app.post('/cerrarManifiestoAgente', function (llamado, respuesta) {
    var type = llamado.header('Content-Type');
    var api = llamado.header('X-API-KEY');
    var id = 0;
    var idcliente = llamado.body.idcliente;
    var tns = llamado.body.tns;
    var nombrecliente = llamado.body.nombrecliente;
    var correo = "pedro.luis.rico43@gmail.com";
    var estado = llamado.body.estado;
    var portal = llamado.body.portal;
    var chofer = llamado.body.chofer;
    var codChofer = llamado.body.codigoChofer;
    var motivo = llamado.body.motivo;
    var diaActual = llamado.body.dia;
    console.log('tns es ', tns);
    console.log(portal);
    console.log('chofer', chofer);
    console.log('codChofer', codChofer);
    respuesta.setHeader('Access-Control-Allow-Origin', '*');
    respuesta.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    respuesta.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    respuesta.setHeader('Access-Control-Allow-Credentials', true);
    var consulta = "SELECT CREARMANIFIESTO('" + diaActual + "', '" + id + "', 'AGENTE', '" + idcliente + "') AS MANIFIESTO";
    var consulta3 = "SELECT name from users where id = " + portal;
    con.query(consulta, function (err, result, fields) {
        if (err) throw err;
        console.log(result);
        var manifiesto = result[0].MANIFIESTO;
        console.log('paso por creacion de manifiesto  de manifiesto');
        var consulta2 = "UPDATE MANIFIESTO SET ESTADO = '" + estado + "', FH_CIERRE = NOW(), COD_OPERADOR_ENTRADA =" + portal + ", COD_CHOFER_ENTRADA =" + codChofer + ", NOMBRE_CHOFER_ENTRADA ='" + chofer + "' WHERE ID = " + manifiesto;
        console.log('VA A INSERTAR PICKING', tns);
        console.log(tns.length);
        let bultos = tns.length;
        for (var j = 0; j < tns.length; j++) {
            console.log('indice', j);
            tVal = j;
            var consulta1 = "INSERT INTO PICKING (TN, OD, ID_MANIFIESTO) VALUES ( " + tns[j].TN + " , " + tns[j].OD_PAPEL + ", " + manifiesto + ")";
            console.log('consulta de insercion pocking');
            console.log(consulta1);

            (function (val, bultos) {
                con.query(consulta1, function (err, result, fields) {
                    if (err) throw err;
                    var data = result;
                    if (val === (bultos - 1)) {
                        var portalName = "ANDEN";
                        generatePdfAndSend(nombrecliente, tns, manifiesto, correo, 'AGENTE', estado, idcliente, diaActual, chofer, portalName, motivo);
                        respuesta.send('true');
                        respuesta.end();
                        /*   con.query(consulta2, function (err, result, fields) {
                                   if (err) throw err;
                                   console.log('actualizo manifiesto a cerrado');
                                   respuesta.send('true');
                                   respuesta.end();
                               });  */
                    }
                });
            })(tVal, bultos);
        }

    });
});
app.post('/cerrarManifiestoSalidaAnden', function (llamado, respuesta) {
    var type = llamado.header('Content-Type');
    var api = llamado.header('X-API-KEY');
    var id = 0;
    var idcliente = llamado.body.idcliente;
    var tns = llamado.body.tns;
    var nombrecliente = llamado.body.nombrecliente;
    var correo = "pedro.luis.rico43@gmail.com";
    var estado = llamado.body.estado;
    var portal = llamado.body.portal;
    var chofer = llamado.body.chofer;
    var codChofer = llamado.body.codigoChofer;
    var motivo = llamado.body.motivo;
    var diaActual = llamado.body.dia;
    console.log('tns es ', tns);
    console.log(portal);
    console.log('chofer', chofer);
    console.log('codChofer', codChofer);
    respuesta.setHeader('Access-Control-Allow-Origin', '*');
    respuesta.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    respuesta.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    respuesta.setHeader('Access-Control-Allow-Credentials', true);
    var consulta = "SELECT CREARMANIFIESTO('" + diaActual + "', '" + id + "', 'SALIDA', '" + idcliente + "') AS MANIFIESTO";
    var consulta3 = "SELECT name from users where id = " + portal;
    con.query(consulta, function (err, result, fields) {
        if (err) throw err;
        console.log(result);
        var manifiesto = result[0].MANIFIESTO;
        console.log('paso por creacion de manifiesto  de manifiesto');
        var consulta2 = "UPDATE MANIFIESTO SET ESTADO = '" + estado + "', FH_CIERRE = NOW(), COD_OPERADOR_ENTRADA =" + portal + ", COD_CHOFER_ENTRADA =" + codChofer + ", NOMBRE_CHOFER_ENTRADA ='" + chofer + "' WHERE ID = " + manifiesto;
        console.log('VA A INSERTAR PICKING', tns);
        console.log(tns.length);
        let bultos = tns.length;
        for (var j = 0; j < tns.length; j++) {
            console.log('indice', j);
            tVal = j;
            var consulta1 = "INSERT INTO PICKING (TN, OD, ID_MANIFIESTO) VALUES ( " + tns[j].TN + " , " + tns[j].OD_PAPEL + ", " + manifiesto + ")";
            console.log('consulta de insercion pocking');
            console.log(consulta1);

            (function (val, bultos) {
                con.query(consulta1, function (err, result, fields) {
                    if (err) throw err;
                    var data = result;
                    if (val === (bultos - 1)) {
                        var portalName = "ANDEN";
                        generatePdfAndSend(nombrecliente, tns, manifiesto, correo, 'SALIDA', estado, idcliente, diaActual, chofer, portalName, motivo);
                        respuesta.send('true');
                        respuesta.end();
                        /*   con.query(consulta2, function (err, result, fields) {
                                if (err) throw err;
                                console.log('actualizo manifiesto a cerrado');
                                respuesta.send('true');
                                respuesta.end();
                            });  */
                    }
                });
            })(tVal, bultos);
        }

    });
});
app.post('/getManifiesto', function (llamado, respuesta) {
    var type = llamado.header('Content-Type');
    var api = llamado.header('X-API-KEY');
    var od = llamado.body.od;
    var idcliente = llamado.body.idcliente;
    console.log('id cliente es');
    console.log(idcliente);
    respuesta.setHeader('Access-Control-Allow-Origin', '*');
    respuesta.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    respuesta.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    respuesta.setHeader('Access-Control-Allow-Credentials', true);
    var datetime = new Date();
    console.log('va a mostrar fecha');
    var dia = agregarUnidad(datetime.getDate());
    var mes = agregarUnidad(datetime.getMonth() + 1);
    var hora = agregarUnidad(datetime.getHours());
    var minutos = agregarUnidad(datetime.getMinutes());
    var segundos = agregarUnidad(datetime.getSeconds());
    var diaActual = datetime.getFullYear() + '-' + mes + '-' + dia + ' ' + hora + ':' + minutos + ':' + segundos;
    var consulta = "SELECT CREARMANIFIESTO('" + diaActual + "', '" + od + "', 'INHOUSE', '" + idcliente + "') AS MANIFIESTO";
    console.log(consulta);
    con.query(consulta, function (err, result, fields) {
        if (err) throw err;
        console.log(result);
        respuesta.send(result);
        respuesta.end();
    });
});
app.post('/manifiestos', function (llamado, respuesta) {
    var type = llamado.header('Content-Type');
    var api = llamado.header('X-API-KEY');
    var idcliente = llamado.body.idcliente;
    var fechai = llamado.body.fechai;
    var fechaf = llamado.body.fechaf;
    respuesta.setHeader('Access-Control-Allow-Origin', '*');
    respuesta.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    respuesta.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    respuesta.setHeader('Access-Control-Allow-Credentials', true);
    var consulta = "SELECT* FROM MANIFIESTO WHERE ID_CLIENTE = '" + idcliente + "' AND SUBSTRING(FH_CIERRE, 1, 10) BETWEEN CAST('" + fechai + "' AS DATE) AND CAST('" + fechaf + "' AS DATE) AND ESTADO = 'CERRADO' AND PROCESO = 'INHOUSE'";
    console.log(consulta)
    con.query(consulta, function (err, result, fields) {
        if (err) throw err;
        console.log('true');
        respuesta.send(result);
        respuesta.end();

    });
});

app.post('/impresionmasiva', function (llamado, respuesta) {
    var type = llamado.header('Content-Type');
    var api = llamado.header('X-API-KEY');

    var manifiesto = llamado.body.manifiesto;
    respuesta.setHeader('Access-Control-Allow-Origin', '*');
    respuesta.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    respuesta.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    respuesta.setHeader('Access-Control-Allow-Credentials', true);
    var datetime = new Date();
    var dia = agregarUnidad(datetime.getDate());
    var mes = agregarUnidad(datetime.getMonth() + 1);
    var hora = agregarUnidad(datetime.getHours());
    var minutos = agregarUnidad(datetime.getMinutes());
    var segundos = agregarUnidad(datetime.getSeconds());
    var diaActual = datetime.getFullYear() + '-' + mes + '-' + dia + ' ' + hora + ':' + minutos + ':' + segundos;
    var consulta1 = "SELECT NEXTVAL('TN') as tn";
    var consulta = "SELECT C.* FROM PICKING A, MANIFIESTO B, ORDENES C WHERE A.ID_MANIFIESTO = B.ID AND (A.OD = C.OD OR A.OD=C.OD_PAPEL) AND A.ID_MANIFIESTO = " + manifiesto + " AND B.ESTADO = 'CERRADO' GROUP BY A.TN ORDER BY C.ID DESC";
    console.log("antes consulta 1", consulta);
    con.query(consulta, function (err, result, fields) {
        if (err) throw err;
        console.log("paso consulta 1", consulta);
        var ods = result;
        var size = ods.length;
        console.log("paso consulta 1", result.length);
        console.log("resultado", ods);
        for (var i = 0; i < ods.length; i++) {
            tVal = i;
            var bultos = ods[i].BULTOS;
            var od = ods[i].OD;
            var numeroImpresiones = ods[i].NUMERO_IMPRESIONES_ETIQUETA + 1;
            var consultaActualizacion = "UPDATE ORDENES SET FH_IMPRESION_ETIQUETA = '" + diaActual + "',NUMERO_IMPRESIONES_ETIQUETA = " + numeroImpresiones + " WHERE OD =" + ods[i].OD_PAPEL;
            console.log('actualizacion es');
            console.log(consultaActualizacion);
            con.query(consultaActualizacion, function (err, result, fields) {
                if (err) throw err;
            });
            (function (i, bultos, od, size) {
                var consulta2 = "SELECT * FROM PICKING A, ID_REFERENCIA_ORDEN_CLIENTE B, MANIFIESTO C WHERE (B.ID_REFERENCIA = " + ods[i].OD_PAPEL + "   OR A.OD = " + ods[i].OD_PAPEL + " ) AND A.OD = B.OD_PAPEL AND A.ID_MANIFIESTO = C.ID AND C.PROCESO = 'INHOUSE' group by TN";
                //   console.log(consulta2);
                con.query(consulta2, function (err, result, fields) {
                    if (err) throw err;
                    var tns = result;
                    var output = [];
                    var cantidadTns = tns.length;
                    if (cantidadTns > 0) {
                        console.log('tns igual');
                        /*
                 var deletePicking = "DELETE FROM PICKING WHERE OD = '"+od+"'"  ;
                 console.log(deletePicking);
                     con.query(deletePicking, function (err, result, fields) {
                     if (err) throw err;
                   }); */
                        for (var j = 0; j < cantidadTns; j++) {
                            output.push({id: tns[j].TN, tn: tns[j].TN, manifiesto: manifiesto});
                            if (j === (cantidadTns - 1)) {
                                ods[i]['TNS'] = output;
                                if (i === (size - 1)) {
                                    respuesta.send(ods);
                                    respuesta.end();
                                }
                            }
                        }
                        //eliminar od
                        //agregar tn nuevo
                        //   console.log(consulta2);
                        //     console.log(tns);
                        /*
                  for ( var j = 0; j < cantidadTns ; j++ ) {
                         var consulta4 = "UPDATE scbExpress.PICKING SET ID_MANIFIESTO = "+manifiesto+" WHERE TN = "+tns[j].TN;
                         console.log(consulta4);
                             con.query(consulta4, function (err, result, fields) {
                             if (err) throw err;
                             console.log(tns[j]);
                           });
                           output.push({tn:tns[j].TN,manifiesto:manifiesto});
                           if(output.length === bultos){
                             ods[i]['TNS']=output;
                             if(i === (size-1 )){
                                    respuesta.send(ods);
                                    respuesta.end();
                                }
                           }
                     }
                      */
                    } else {
                        /*
                     console.log('llego a primera insercion');
                   for ( var j = cantidadTns; j < bultos ; j++ ) {
                           tVal = j;
                          (function(val,bultos){
                             con.query(consulta1, function (err, result, fields) {
                             if (err) throw err;
                                 var data = result;
                                 const tn=data[0].tn;
                                 output.push({id:tn,tn:tn,manifiesto:manifiesto});
                                 var consulta5 = "INSERT INTO PICKING (TN, OD, ID_MANIFIESTO) VALUES ( "+tn+" , "+od+", "+manifiesto+")";
                                 con.query(consulta5, function (err, result, fields) {
                                 if (err) throw err;
                               });
                                 if(val === (bultos - 1 )){
                                   ods[i]['TNS']=output;
                                   if(i === (size-1 )){
                                          respuesta.send(ods);
                                          respuesta.end();
                                      }
                                 }
                               });
                           })(tVal,bultos,size);
                         }
                         */
                    }

                });
            })(tVal, bultos, od, size);
        }
        // respuesta.send(result);
        // respuesta.end();
    });
});

app.post('/impresionmasiva2', function (llamado, respuesta) {
    var type = llamado.header('Content-Type');
    var api = llamado.header('X-API-KEY');
    var idcliente = llamado.body.idcliente;
    var fechai = llamado.body.fechai;
    var fechaf = llamado.body.fechaf;
    var manifiesto = llamado.body.manifiesto;
    respuesta.setHeader('Access-Control-Allow-Origin', '*');
    respuesta.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    respuesta.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    respuesta.setHeader('Access-Control-Allow-Credentials', true);
    var datetime = new Date();
    var dia = agregarUnidad(datetime.getDate());
    var mes = agregarUnidad(datetime.getMonth() + 1);
    var hora = agregarUnidad(datetime.getHours());
    var minutos = agregarUnidad(datetime.getMinutes());
    var segundos = agregarUnidad(datetime.getSeconds());
    var diaActual = datetime.getFullYear() + '-' + mes + '-' + dia + ' ' + hora + ':' + minutos + ':' + segundos;

    var consulta1 = "SELECT NEXTVAL('TN') as tn";
    var consulta = "SELECT* FROM ORDENES WHERE COD_CLIENTE = '" + idcliente + "' AND FH_DIGITACION BETWEEN CAST('" + fechai + "' AS DATE) AND CAST('" + fechaf + "' AS DATE)";
    con.query(consulta, function (err, result, fields) {
        if (err) throw err;
        var ods = result;
        var size = ods.length;

        for (var i = 0; i < ods.length; i++) {
            tVal = i;
            var bultos = ods[i].BULTOS;
            var od = ods[i].OD;
            var numeroImpresiones = ods[i].NUMERO_IMPRESIONES_ETIQUETA + 1;
            var consultaActualizacion = "UPDATE ORDENES SET FH_IMPRESION_ETIQUETA = '" + diaActual + "',NUMERO_IMPRESIONES_ETIQUETA = " + numeroImpresiones + " WHERE OD =" + ods[i].OD;
            console.log('actualizacion es');
            console.log(consultaActualizacion);
            con.query(consultaActualizacion, function (err, result, fields) {
                if (err) throw err;
            });
            (function (i, bultos, od, size) {
                var consulta2 = "SELECT * FROM PICKING A, ID_REFERENCIA_ORDEN_CLIENTE B, MANIFIESTO C WHERE (B.ID_REFERENCIA = " + ods[i].OD + "   OR A.OD = " + ods[i].OD + " ) AND A.OD = B.OD_PAPEL AND A.ID_MANIFIESTO = C.ID AND C.PROCESO = 'INHOUSE' group by TN";
                //   console.log(consulta2);
                con.query(consulta2, function (err, result, fields) {
                    if (err) throw err;
                    var tns = result;
                    var output = [];
                    var cantidadTns = tns.length;

                    if (cantidadTns > 0) {
                        console.log('tns igual');
                        var deletePicking = "DELETE FROM PICKING WHERE OD = '" + od + "'";
                        console.log(deletePicking);
                        con.query(deletePicking, function (err, result, fields) {
                            if (err) throw err;

                        });
                        for (var j = 0; j < bultos; j++) {
                            tVal = j;
                            (function (val, bultos) {
                                con.query(consulta1, function (err, result, fields) {
                                    if (err) throw err;
                                    var data = result;
                                    const tn = data[0].tn;
                                    output.push({id: tn, tn: tn, manifiesto: manifiesto});
                                    var consulta5 = "INSERT INTO PICKING (TN, OD, ID_MANIFIESTO) VALUES ( " + tn + " , " + od + ", " + manifiesto + ")";
                                    con.query(consulta5, function (err, result, fields) {
                                        if (err) throw err;
                                    });
                                    if (val === (bultos - 1)) {
                                        ods[i]['TNS'] = output;
                                        if (i === (size - 1)) {
                                            respuesta.send(ods);
                                            respuesta.end();
                                        }
                                    }
                                });
                            })(tVal, bultos, size);
                        }
                        //eliminar od
                        //agregar tn nuevo
                        //   console.log(consulta2);
                        //     console.log(tns);
                        /*
                for ( var j = 0; j < cantidadTns ; j++ ) {
                       var consulta4 = "UPDATE scbExpress.PICKING SET ID_MANIFIESTO = "+manifiesto+" WHERE TN = "+tns[j].TN;
                       console.log(consulta4);
                           con.query(consulta4, function (err, result, fields) {
                           if (err) throw err;
                           console.log(tns[j]);
                         });
                         output.push({tn:tns[j].TN,manifiesto:manifiesto});
                         if(output.length === bultos){
                           ods[i]['TNS']=output;
                           if(i === (size-1 )){
                                  respuesta.send(ods);
                                  respuesta.end();
                              }
                         }
                   }
                    */
                    } else {
                        console.log('llego a primera insercion');
                        for (var j = cantidadTns; j < bultos; j++) {
                            tVal = j;
                            (function (val, bultos) {
                                con.query(consulta1, function (err, result, fields) {
                                    if (err) throw err;
                                    var data = result;
                                    const tn = data[0].tn;
                                    output.push({id: tn, tn: tn, manifiesto: manifiesto});
                                    var consulta5 = "INSERT INTO PICKING (TN, OD, ID_MANIFIESTO) VALUES ( " + tn + " , " + od + ", " + manifiesto + ")";
                                    con.query(consulta5, function (err, result, fields) {
                                        if (err) throw err;
                                    });
                                    if (val === (bultos - 1)) {
                                        ods[i]['TNS'] = output;
                                        if (i === (size - 1)) {
                                            respuesta.send(ods);
                                            respuesta.end();
                                        }
                                    }
                                });
                            })(tVal, bultos, size);
                        }
                    }

                });
            })(tVal, bultos, od, size);
        }
        // respuesta.send(result);
        // respuesta.end();
    });
});

app.post('/getTn', function (llamado, respuesta) {
    var type = llamado.header('Content-Type');
    var api = llamado.header('X-API-KEY');
    var bultos = llamado.body.bultos;
    var od = llamado.body.od;
    console.log('od de servicio en tn ');
    console.log(od);
    console.log("body", llamado);
    var idcliente = llamado.body.idcliente;
    var manifiesto = llamado.body.manifiesto;
    respuesta.setHeader('Access-Control-Allow-Origin', '*');
    respuesta.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    respuesta.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    respuesta.setHeader('Access-Control-Allow-Credentials', true);
    var datetime = new Date();
    var dia = agregarUnidad(datetime.getDate());
    var mes = agregarUnidad(datetime.getMonth() + 1);
    var hora = agregarUnidad(datetime.getHours());
    var minutos = agregarUnidad(datetime.getMinutes());
    var segundos = agregarUnidad(datetime.getSeconds());
    var diaActual = datetime.getFullYear() + '-' + mes + '-' + dia + ' ' + hora + ':' + minutos + ':' + segundos;
    var consulta1 = "SELECT NEXTVAL('TN') as tn";
    var consulta2 = "SELECT * FROM PICKING A, ID_REFERENCIA_ORDEN_CLIENTE B, MANIFIESTO C WHERE (B.ID_REFERENCIA = " + od + "   OR A.OD = " + od + " ) AND A.OD = B.OD_PAPEL AND A.ID_MANIFIESTO = C.ID AND C.PROCESO = 'INHOUSE' GROUP BY TN ";
    console.log('va a mostar la consulta2 de pickin');
    console.log(consulta2);
    con.query(consulta2, function (err, result, fields) {
        if (err) throw err;

        var tns = result;
        var output = [];

        var cantidadTns = tns.length;
        //  var cantidadTnsAux=cantidadTns;
        console.log('va a mostrar tns en update');
        console.log(tns);
        console.log(tns.length);
        console.log(bultos);

        if (cantidadTns > 0) {
            for (var j = 0; j < cantidadTns; j++) {
                console.log(tns[j]);

                output.push({id: tns[j].ID, tn: tns[j].TN, manifiesto: manifiesto});
                var consulta4 = "UPDATE scbExpress.PICKING SET ID_MANIFIESTO = " + manifiesto + " WHERE TN = " + tns[j].TN;
                console.log(consulta4);
                con.query(consulta4, function (err, result, fields) {
                    if (err) throw err;
                });

            }

        }
        console.log(output);
        if (output.length === bultos) {
            respuesta.send(output);
            respuesta.end();
        } else {
            for (var j = cantidadTns; j < bultos; j++) {
                tVal = j;
                (function (val, bultos) {
                    con.query(consulta1, function (err, result, fields) {
                        if (err) throw err;
                        var data = result;
                        const tn = data[0].tn;
                        output.push({id: tn, tn: tn, manifiesto: manifiesto});
                        var consulta5 = "INSERT INTO PICKING (TN, OD, ID_MANIFIESTO) VALUES ( " + tn + " , " + od + ", " + manifiesto + ")";
                        con.query(consulta5, function (err, result, fields) {
                            if (err) throw err;
                        });
                        if (val === (bultos - 1)) {
                            respuesta.send(output);
                            respuesta.end();
                        }
                    });
                })(tVal, bultos);
            }
        }

    });

});

function agregarUnidad(num) {
    //console.log('tamaño es'+ num.toString().length);
    if (num.toString().length === 1) {
        return ('0' + num);
    } else {
        return num;
    }
}

app.post('/getCentroCosto', function (llamado, respuesta) {
    var type = llamado.header('Content-Type');
    var api = llamado.header('X-API-KEY');
    var idcliente = llamado.body.idcliente;

    respuesta.setHeader('Access-Control-Allow-Origin', '*');
    respuesta.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    respuesta.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    respuesta.setHeader('Access-Control-Allow-Credentials', true);
    var consulta = "select * from CENTRO_COSTO where COD_CLIENTE = " + idcliente;
    console.log(consulta);

    con.query(consulta, function (err, result, fields) {
        if (err) throw err;
        console.log('true');
        respuesta.send(result);
        respuesta.end();

    });
});

app.post('/getChoferes', function (llamado, respuesta) {
    var type = llamado.header('Content-Type');
    var api = llamado.header('X-API-KEY');

    respuesta.setHeader('Access-Control-Allow-Origin', '*');
    respuesta.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    respuesta.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    respuesta.setHeader('Access-Control-Allow-Credentials', true);
    var consulta = "select COD_CHOFER,NOMBRE from CHOFERES ";
    console.log(consulta);

    con.query(consulta, function (err, result, fields) {
        if (err) throw err;
        console.log('true');
        respuesta.send(result);
        respuesta.end();

    });
});

app.post('/cerrarManifiesto', function (llamado, respuesta) {
    var type = llamado.header('Content-Type');
    var api = llamado.header('X-API-KEY');
    var id = llamado.body.idmanifiesto;
    var correo = llamado.body.correocliente;
    var tns = llamado.body.tns;
    var nombrecliente = llamado.body.nombrecliente;
    var idCliente = llamado.body.idcliente;
    var diaActual = llamado.body.dia;
    console.log('correo es');
    console.log(correo);
    console.log('tns son ');
    console.log(tns);
    console.log('nombre cliente es');
    console.log(nombrecliente);
    respuesta.setHeader('Access-Control-Allow-Origin', '*');
    respuesta.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    respuesta.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    respuesta.setHeader('Access-Control-Allow-Credentials', true);
    var consulta2 = "UPDATE MANIFIESTO SET ESTADO = 'CERRADO', FH_CIERRE = NOW() WHERE ID = " + id;
    console.log(consulta2);
    con.query(consulta2, function (err, result, fields) {
        if (err) throw err;
        console.log('true');
        respuesta.send('true');
        respuesta.end();
        generatePdfAndSend(nombrecliente, tns, id, correo, 'ETIQUETADO', 'COMPLETO', idCliente, diaActual, '', '', '');

    });
});

app.post('/validarOd', function (llamado, respuesta) {
    var type = llamado.header('Content-Type');
    var api = llamado.header('X-API-KEY');
    var od = llamado.body.od;
    var idcliente = llamado.body.idcliente;
    respuesta.setHeader('Access-Control-Allow-Origin', '*');
    respuesta.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    respuesta.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    respuesta.setHeader('Access-Control-Allow-Credentials', true);
    consulta = "SELECT A.ID, A.OD, A.OD_PAPEL, A.NOTA, A.COD_BARRA, A.NUM_BOLETA, A.ID_REFERENCIA, A.DIRECCION, A.COMUNA AS DESTINO, A.NOMBRE AS DESTINATARIO, A.TELEFONO, A.COD_CLIENTE, A.COMUNA_ORIGEN, A.BULTOS, A.LARGO, A.ANCHO, A.ALTO, A.PESO,A.TIPO_ORDEN,A.NUMERO_IMPRESIONES_ETIQUETA FROM ORDENES A, ID_REFERENCIA_ORDEN_CLIENTE B WHERE A.OD_PAPEL = B.OD_PAPEL  AND (B.ID_REFERENCIA = '" + od + "' OR B.OD_PAPEL = '" + od + "' OR A.COD_BARRA = '" + od + "') AND A.COD_CLIENTE =" + idcliente + " GROUP BY B.OD_PAPEL LIMIT 1";

    console.log('consulta validacion od');
    console.log(consulta);
    /*  if (isNaN(od)) {
    console.log('This is not number');
    respuesta.send('false');
    respuesta.end();
}
else{ */
    console.log('This is number');
    con.query(consulta, function (err, result, fields) {
        if (err) throw err;
        var data = result;

        if (data.length === 0) {
            var rta = [];
            rta.push('false');
            rta.push('No se encuentra informado numero de guia o numero de od');
            respuesta.send(rta);
            respuesta.end();
        } else {

            for (var j in data) {
                data[j]['PADRE'] = '';
            }
            var datetime = new Date();
            var dia = agregarUnidad(datetime.getDate());
            var mes = agregarUnidad(datetime.getMonth() + 1);
            var hora = agregarUnidad(datetime.getHours());
            var minutos = agregarUnidad(datetime.getMinutes());
            var segundos = agregarUnidad(datetime.getSeconds());
            var diaActual = datetime.getFullYear() + '-' + mes + '-' + dia + ' ' + hora + ':' + minutos + ':' + segundos;
            var numeroImpresiones = data[0].NUMERO_IMPRESIONES_ETIQUETA + 1;

            var consultaActualizacion = "UPDATE ORDENES SET FH_IMPRESION_ETIQUETA = '" + diaActual + "',NUMERO_IMPRESIONES_ETIQUETA = " + numeroImpresiones + " WHERE OD =" + data[0].OD;
            console.log('actualizacion es');
            console.log(consultaActualizacion);
            con.query(consultaActualizacion, function (err, result, fields) {
                if (err) throw err;
                //  respuesta.send(data);
                //  respuesta.end();
            });
            var consulta2 = "SELECT \
        COUNT(*) AS CERRADO \
        FROM \
        scbExpress.PICKING A, MANIFIESTO B \
        WHERE \
        OD = " + data[0].OD + " \
        AND \
        ESTADO = 'CERRADO' \
        AND \
        B.ID = A.ID_MANIFIESTO \
        GROUP BY OD \
        LIMIT 1";
            con.query(consulta2, function (err, result, fields) {
                if (err) throw err;
                var data2 = result;
                if (data2.length === 0) {
                    console.log('respondio dato');
                    console.log(data);
                    respuesta.send(data);
                    respuesta.end();
                } else {
                    var rta = [];
                    rta.push('false');
                    rta.push('Esta od ya pertenece a un manifiesto cerrado');
                    respuesta.send(rta);
                    respuesta.end();
                }
            });

        }
    });
// }
});

app.post('/regionesHuella', function (llamado, respuesta) {
    var type = llamado.header('Content-Type');
    var api = llamado.header('X-API-KEY');
    var region = llamado.body.region;
    var fechai = llamado.body.fechai;
    var fechaf = llamado.body.fechaf;
    //  console.log('region llego con'+region);
    respuesta.setHeader('Access-Control-Allow-Origin', '*');
    respuesta.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    respuesta.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    respuesta.setHeader('Access-Control-Allow-Credentials', true);
    // Consultas para seleccion de una sola region
    var consulta1 = "SELECT CHOFERES.COD_CHOFER,CHOFERES.NOMBRE,COUNT(*) AS TOTAL FROM CHOFERES INNER JOIN CERTIFICACIONES ON CERTIFICACIONES.COD_CHOFER = CHOFERES.COD_CHOFER AND CHOFERES.CIUDAD='" + region + "' AND CERTIFICACIONES.COD_ESTADO IN (0) AND STR_TO_DATE(SUBSTRING(FH_GESTION,1,10), '%d/%m/%Y') <= STR_TO_DATE('" + fechaf + "', '%d/%m/%Y')AND STR_TO_DATE(SUBSTRING(FH_GESTION,1,10), '%d/%m/%Y') >= STR_TO_DATE('" + fechai + "', '%d/%m/%Y') AND CHOFERES.COD_CHOFER NOT IN (1205, 1202, 1201, 1200) GROUP BY CHOFERES.COD_CHOFER ORDER BY TOTAL DESC";
    var consulta2 = "SELECT CHOFERES.COD_CHOFER,COUNT(*) AS BIO  FROM CHOFERES INNER JOIN CERTIFICACIONES ON CERTIFICACIONES.COD_CHOFER = CHOFERES.COD_CHOFER AND CHOFERES.CIUDAD='" + region + "' AND CERTIFICACIONES.DEC_CODE <> 'FALSE' AND CERTIFICACIONES.COD_ESTADO IN (0)  AND STR_TO_DATE(SUBSTRING(FH_GESTION,1,10), '%d/%m/%Y') <= STR_TO_DATE('" + fechaf + "', '%d/%m/%Y')AND STR_TO_DATE(SUBSTRING(FH_GESTION,1,10), '%d/%m/%Y') >= STR_TO_DATE('" + fechai + "', '%d/%m/%Y') AND CHOFERES.COD_CHOFER NOT IN (1205, 1202, 1201, 1200) GROUP BY CHOFERES.COD_CHOFER";
    // consultas para todos
    var consulta3 = "SELECT CHOFERES.COD_CHOFER,CHOFERES.NOMBRE,CHOFERES.CIUDAD, COUNT(*) AS TOTAL FROM CHOFERES INNER JOIN CERTIFICACIONES ON CERTIFICACIONES.COD_CHOFER = CHOFERES.COD_CHOFER AND CERTIFICACIONES.COD_ESTADO IN (0) AND STR_TO_DATE(SUBSTRING(FH_GESTION,1,10), '%d/%m/%Y') <= STR_TO_DATE('" + fechaf + "', '%d/%m/%Y')AND STR_TO_DATE(SUBSTRING(FH_GESTION,1,10), '%d/%m/%Y') >= STR_TO_DATE('" + fechai + "', '%d/%m/%Y') AND CHOFERES.COD_CHOFER NOT IN (1205, 1202, 1201, 1200) GROUP BY CHOFERES.COD_CHOFER ORDER BY  CHOFERES.CIUDAD,TOTAL DESC";
    var consulta4 = "SELECT CHOFERES.COD_CHOFER,CHOFERES.CIUDAD, COUNT(*) AS BIO  FROM CHOFERES INNER JOIN CERTIFICACIONES ON CERTIFICACIONES.COD_CHOFER = CHOFERES.COD_CHOFER AND CERTIFICACIONES.DEC_CODE <> 'FALSE' AND CERTIFICACIONES.COD_ESTADO IN (0) AND STR_TO_DATE(SUBSTRING(FH_GESTION,1,10), '%d/%m/%Y') <= STR_TO_DATE('" + fechaf + "', '%d/%m/%Y')AND STR_TO_DATE(SUBSTRING(FH_GESTION,1,10), '%d/%m/%Y') >= STR_TO_DATE('" + fechai + "', '%d/%m/%Y') AND CHOFERES.COD_CHOFER NOT IN (1205, 1202, 1201, 1200) GROUP BY CHOFERES.COD_CHOFER";
    // consulta para todos con intentos
    var consulta5 = "SELECT CHOFERES.COD_CHOFER,CHOFERES.CIUDAD, COUNT(*) AS INTENTOS FROM CHOFERES INNER JOIN CERTIFICACIONES ON CERTIFICACIONES.COD_CHOFER = CHOFERES.COD_CHOFER AND CERTIFICACIONES.DEC_CODE = 'FALSE' AND CERTIFICACIONES.COD_ESTADO IN (0) AND STR_TO_DATE(SUBSTRING(FH_GESTION,1,10), '%d/%m/%Y') <= STR_TO_DATE('" + fechaf + "', '%d/%m/%Y')AND STR_TO_DATE(SUBSTRING(FH_GESTION,1,10), '%d/%m/%Y') >= STR_TO_DATE('" + fechai + "', '%d/%m/%Y') AND (SUBSTRING(CERTIFICACIONES.NOTA, -5, 5) LIKE '%(902)%' OR SUBSTRING(CERTIFICACIONES.NOTA, -5, 5) LIKE '%(903)%' OR SUBSTRING(CERTIFICACIONES.NOTA, -5, 5) LIKE '%(904)%' OR SUBSTRING(CERTIFICACIONES.NOTA, -5, 5) LIKE '%(200)%' OR SUBSTRING(CERTIFICACIONES.NOTA, -5, 5) LIKE '%(201)%' OR SUBSTRING(CERTIFICACIONES.NOTA, -5, 5) LIKE '%(203)%' OR SUBSTRING(CERTIFICACIONES.NOTA, -5, 5) LIKE '%(214)%' ) AND CHOFERES.COD_CHOFER NOT IN (1205, 1202, 1201, 1200) GROUP BY CHOFERES.COD_CHOFER";
    //consulta individual con intentos
    var consulta6 = "SELECT CHOFERES.COD_CHOFER,CHOFERES.CIUDAD, COUNT(*) AS INTENTOS FROM CHOFERES INNER JOIN CERTIFICACIONES ON CERTIFICACIONES.COD_CHOFER = CHOFERES.COD_CHOFER AND CHOFERES.CIUDAD='" + region + "' AND CERTIFICACIONES.DEC_CODE = 'FALSE' AND CERTIFICACIONES.COD_ESTADO IN (0) AND STR_TO_DATE(SUBSTRING(FH_GESTION,1,10), '%d/%m/%Y') <= STR_TO_DATE('" + fechaf + "', '%d/%m/%Y')AND STR_TO_DATE(SUBSTRING(FH_GESTION,1,10), '%d/%m/%Y') >= STR_TO_DATE('" + fechai + "', '%d/%m/%Y') AND (SUBSTRING(CERTIFICACIONES.NOTA, -5, 5) LIKE '%(902)%' OR SUBSTRING(CERTIFICACIONES.NOTA, -5, 5) LIKE '%(903)%' OR SUBSTRING(CERTIFICACIONES.NOTA, -5, 5) LIKE '%(904)%' OR SUBSTRING(CERTIFICACIONES.NOTA, -5, 5) LIKE '%(200)%' OR SUBSTRING(CERTIFICACIONES.NOTA, -5, 5) LIKE '%(201)%' OR SUBSTRING(CERTIFICACIONES.NOTA, -5, 5) LIKE '%(203)%' OR SUBSTRING(CERTIFICACIONES.NOTA, -5, 5) LIKE '%(214)%' ) AND CHOFERES.COD_CHOFER NOT IN (1205, 1202, 1201, 1200) GROUP BY CHOFERES.COD_CHOFER";
    // consulta de todas las regiones con entregas solo de b2c, con este valor restado del total, tendre el numero b2c y cargo ex
    var sqlOrdenesB2c = "SELECT  CHOFERES.COD_CHOFER, CHOFERES.NOMBRE,  CHOFERES.CIUDAD, COUNT(*) AS B2C FROM CHOFERES INNER JOIN CERTIFICACIONES ON CERTIFICACIONES.COD_CHOFER = CHOFERES.COD_CHOFER INNER JOIN ORDENES ON    CERTIFICACIONES.OD_PAPEL = ORDENES.OD_PAPEL AND   ORDENES.COD_CLIENTE = 350 AND   CERTIFICACIONES.COD_ESTADO IN (0) AND   STR_TO_DATE(SUBSTRING(FH_GESTION,1,10), '%d/%m/%Y') <= STR_TO_DATE('" + fechaf + "', '%d/%m/%Y') AND   STR_TO_DATE(SUBSTRING(FH_GESTION,1,10), '%d/%m/%Y') >= STR_TO_DATE('" + fechai + "', '%d/%m/%Y') AND CHOFERES.COD_CHOFER NOT IN (1205, 1202, 1201, 1200) GROUP BY CHOFERES.COD_CHOFER ORDER BY  CHOFERES.CIUDAD,B2C DESC";
    // consulta de 1 region con ordenes b2c
    var sqlOrdenesIB2c = "SELECT  CHOFERES.COD_CHOFER, CHOFERES.NOMBRE,  CHOFERES.CIUDAD, COUNT(*) AS B2C FROM CHOFERES INNER JOIN CERTIFICACIONES ON CERTIFICACIONES.COD_CHOFER = CHOFERES.COD_CHOFER INNER JOIN ORDENES ON    CERTIFICACIONES.OD_PAPEL = ORDENES.OD_PAPEL AND CHOFERES.CIUDAD='" + region + "'AND ORDENES.COD_CLIENTE = 350 AND   CERTIFICACIONES.COD_ESTADO IN (0) AND   STR_TO_DATE(SUBSTRING(FH_GESTION,1,10), '%d/%m/%Y') <= STR_TO_DATE('" + fechaf + "', '%d/%m/%Y') AND   STR_TO_DATE(SUBSTRING(FH_GESTION,1,10), '%d/%m/%Y') >= STR_TO_DATE('" + fechai + "', '%d/%m/%Y') AND CHOFERES.COD_CHOFER NOT IN (1205, 1202, 1201, 1200) GROUP BY CHOFERES.COD_CHOFER ORDER BY  CHOFERES.CIUDAD,B2C DESC";
    // consulta de biometria con b2c en todas las regiones
    var sqlOrdenesB2cBio = "SELECT  CHOFERES.COD_CHOFER, CHOFERES.NOMBRE,  CHOFERES.CIUDAD, COUNT(*) AS B2CBIO FROM CHOFERES INNER JOIN CERTIFICACIONES ON CERTIFICACIONES.COD_CHOFER = CHOFERES.COD_CHOFER INNER JOIN ORDENES ON CERTIFICACIONES.OD_PAPEL = ORDENES.OD_PAPEL AND CERTIFICACIONES.DEC_CODE <> 'FALSE' AND ORDENES.COD_CLIENTE = 350 AND   CERTIFICACIONES.COD_ESTADO IN (0) AND   STR_TO_DATE(SUBSTRING(FH_GESTION,1,10), '%d/%m/%Y') <= STR_TO_DATE('" + fechaf + "', '%d/%m/%Y') AND   STR_TO_DATE(SUBSTRING(FH_GESTION,1,10), '%d/%m/%Y') >= STR_TO_DATE('" + fechai + "', '%d/%m/%Y') AND CHOFERES.COD_CHOFER NOT IN (1205, 1202, 1201, 1200) GROUP BY CHOFERES.COD_CHOFER ORDER BY  CHOFERES.CIUDAD,B2CBIO DESC";
    // consulta de 1 region con ordenes b2cy biometria
    var sqlOrdenesIB2cBio = "SELECT  CHOFERES.COD_CHOFER, CHOFERES.NOMBRE,  CHOFERES.CIUDAD, COUNT(*) AS B2CBIO FROM CHOFERES INNER JOIN CERTIFICACIONES ON CERTIFICACIONES.COD_CHOFER = CHOFERES.COD_CHOFER INNER JOIN ORDENES ON CERTIFICACIONES.OD_PAPEL = ORDENES.OD_PAPEL AND CERTIFICACIONES.DEC_CODE <> 'FALSE' AND CHOFERES.CIUDAD='" + region + "'AND ORDENES.COD_CLIENTE = 350 AND   CERTIFICACIONES.COD_ESTADO IN (0) AND   STR_TO_DATE(SUBSTRING(FH_GESTION,1,10), '%d/%m/%Y') <= STR_TO_DATE('" + fechaf + "', '%d/%m/%Y') AND   STR_TO_DATE(SUBSTRING(FH_GESTION,1,10), '%d/%m/%Y') >= STR_TO_DATE('" + fechai + "', '%d/%m/%Y') AND CHOFERES.COD_CHOFER NOT IN (1205, 1202, 1201, 1200) GROUP BY CHOFERES.COD_CHOFER ORDER BY  CHOFERES.CIUDAD,B2CBIO DESC";
    //consulta de intentos de biometria con b2c en todas las regiones
    var sqlOrdenesB2cBioIntentos = "SELECT  CHOFERES.COD_CHOFER, CHOFERES.NOMBRE,  CHOFERES.CIUDAD, COUNT(*) AS B2CBIOI FROM CHOFERES INNER JOIN CERTIFICACIONES ON CERTIFICACIONES.COD_CHOFER = CHOFERES.COD_CHOFER INNER JOIN ORDENES ON CERTIFICACIONES.OD_PAPEL = ORDENES.OD_PAPEL AND CERTIFICACIONES.DEC_CODE = 'FALSE' AND ORDENES.COD_CLIENTE = 350 AND   CERTIFICACIONES.COD_ESTADO IN (0) AND   STR_TO_DATE(SUBSTRING(FH_GESTION,1,10), '%d/%m/%Y') <= STR_TO_DATE('" + fechaf + "', '%d/%m/%Y') AND   STR_TO_DATE(SUBSTRING(FH_GESTION,1,10), '%d/%m/%Y') >= STR_TO_DATE('" + fechai + "', '%d/%m/%Y') AND (SUBSTRING(CERTIFICACIONES.NOTA, -5, 5) LIKE '%(902)%' OR SUBSTRING(CERTIFICACIONES.NOTA, -5, 5) LIKE '%(903)%' OR SUBSTRING(CERTIFICACIONES.NOTA, -5, 5) LIKE '%(904)%' OR SUBSTRING(CERTIFICACIONES.NOTA, -5, 5) LIKE '%(200)%' OR SUBSTRING(CERTIFICACIONES.NOTA, -5, 5) LIKE '%(201)%' OR SUBSTRING(CERTIFICACIONES.NOTA, -5, 5) LIKE '%(203)%' OR SUBSTRING(CERTIFICACIONES.NOTA, -5, 5) LIKE '%(214)%' )  AND CHOFERES.COD_CHOFER NOT IN (1205, 1202, 1201, 1200) GROUP BY CHOFERES.COD_CHOFER ORDER BY  CHOFERES.CIUDAD,B2CBIOI DESC";
    // consulta de 1 region con ordenes b2cy biometria
    var sqlOrdenesIB2cBioIntentos = "SELECT  CHOFERES.COD_CHOFER, CHOFERES.NOMBRE,  CHOFERES.CIUDAD, COUNT(*) AS B2CBIOI FROM CHOFERES INNER JOIN CERTIFICACIONES ON CERTIFICACIONES.COD_CHOFER = CHOFERES.COD_CHOFER INNER JOIN ORDENES ON CERTIFICACIONES.OD_PAPEL = ORDENES.OD_PAPEL AND CERTIFICACIONES.DEC_CODE = 'FALSE' AND CHOFERES.CIUDAD='" + region + "'AND ORDENES.COD_CLIENTE = 350 AND   CERTIFICACIONES.COD_ESTADO IN (0) AND   STR_TO_DATE(SUBSTRING(FH_GESTION,1,10), '%d/%m/%Y') <= STR_TO_DATE('" + fechaf + "', '%d/%m/%Y') AND  STR_TO_DATE(SUBSTRING(FH_GESTION,1,10), '%d/%m/%Y') >= STR_TO_DATE('" + fechai + "', '%d/%m/%Y') AND (SUBSTRING(CERTIFICACIONES.NOTA, -5, 5) LIKE '%(902)%' OR SUBSTRING(CERTIFICACIONES.NOTA, -5, 5) LIKE '%(903)%' OR SUBSTRING(CERTIFICACIONES.NOTA, -5, 5) LIKE '%(904)%' OR SUBSTRING(CERTIFICACIONES.NOTA, -5, 5) LIKE '%(200)%' OR SUBSTRING(CERTIFICACIONES.NOTA, -5, 5) LIKE '%(201)%' OR SUBSTRING(CERTIFICACIONES.NOTA, -5, 5) LIKE '%(203)%' OR SUBSTRING(CERTIFICACIONES.NOTA, -5, 5) LIKE '%(214)%' ) AND CHOFERES.COD_CHOFER NOT IN (1205, 1202, 1201, 1200) GROUP BY CHOFERES.COD_CHOFER ORDER BY  CHOFERES.CIUDAD,B2CBIOI DESC";
    console.log('sql intnetos total b2c es --->' + sqlOrdenesB2cBioIntentos);
    console.log('sql intentos individual b2c es--->' + sqlOrdenesIB2cBioIntentos);
    if (api === '55IcsddHxiy2E3q653RpYtb') {
        if (region !== 'todos') {
            //    console.log('entro por uno');
            //  console.log(consulta6);

            con.query(consulta1, function (err, result, fields) {
                if (err) throw err;
                con.query(consulta2, function (err, result2, fields) {
                    if (err) throw err;
                    for (var i in result) {
                        var aux = 'false';
                        for (var j in result2) {
                            if (result[i].COD_CHOFER === result2[j].COD_CHOFER) {
                                result[i]['BIO'] = result2[j].BIO;
                                aux = 'true';
                            }
                        }
                        if (aux === 'false') {
                            result[i]['BIO'] = 0;
                        }
                    }
                    con.query(consulta6, function (err, result3, fields) {
                        if (err) throw err;
                        for (var i in result) {
                            var aux = 'false';
                            for (var j in result3) {
                                if (result[i].COD_CHOFER === result3[j].COD_CHOFER) {
                                    result[i]['INTENTOS'] = result3[j].INTENTOS;
                                    aux = 'true';
                                }
                            }
                            if (aux === 'false') {
                                result[i]['INTENTOS'] = 0;
                            }
                        }
                        con.query(sqlOrdenesIB2c, function (err, result4, fields) {
                            if (err) throw err;
                            for (var i in result) {
                                var aux = 'false';
                                for (var j in result4) {
                                    if (result[i].COD_CHOFER === result4[j].COD_CHOFER) {
                                        result[i]['B2C'] = result4[j].B2C;
                                        aux = 'true';
                                    }
                                }
                                if (aux === 'false') {
                                    result[i]['B2C'] = 0;
                                }
                            }
                            con.query(sqlOrdenesIB2cBio, function (err, result5, fields) {
                                if (err) throw err;
                                for (var i in result) {
                                    var aux = 'false';
                                    for (var j in result5) {
                                        if (result[i].COD_CHOFER === result5[j].COD_CHOFER) {
                                            result[i]['B2CBIO'] = result5[j].B2CBIO;
                                            aux = 'true';
                                        }
                                    }
                                    if (aux === 'false') {
                                        result[i]['B2CBIO'] = 0;
                                    }
                                }
                                con.query(sqlOrdenesIB2cBioIntentos, function (err, result6, fields) {
                                    if (err) throw err;
                                    for (var i in result) {
                                        var aux = 'false';
                                        for (var j in result6) {
                                            if (result[i].COD_CHOFER === result6[j].COD_CHOFER) {
                                                result[i]['B2CBIOI'] = result6[j].B2CBIOI;
                                                aux = 'true';
                                            }
                                        }
                                        if (aux === 'false') {
                                            result[i]['B2CBIOI'] = 0;
                                        }
                                    }
                                    console.log(result);
                                    respuesta.send(result);
                                    respuesta.end();
                                });
                            });
                        });
                    });
                });


            });
        } else {
            console.log('entro por todos');
            con.query(consulta3, function (err, result, fields) {
                if (err) throw err;
                con.query(consulta4, function (err, result2, fields) {
                    if (err) throw err;
                    for (var i in result) {
                        var aux = 'false';
                        for (var j in result2) {
                            if (result[i].COD_CHOFER === result2[j].COD_CHOFER) {
                                result[i]['BIO'] = result2[j].BIO;
                                aux = 'true';
                            }
                        }
                        if (aux === 'false') {
                            result[i]['BIO'] = 0;
                        }
                    }
                    con.query(consulta5, function (err, result3, fields) {
                        if (err) throw err;
                        for (var i in result) {
                            var aux = 'false';
                            for (var j in result3) {
                                if (result[i].COD_CHOFER === result3[j].COD_CHOFER) {
                                    result[i]['INTENTOS'] = result3[j].INTENTOS;
                                    aux = 'true';
                                }
                            }
                            if (aux === 'false') {
                                result[i]['INTENTOS'] = 0;
                            }
                        }
                        con.query(sqlOrdenesB2c, function (err, result4, fields) {
                            if (err) throw err;
                            for (var i in result) {
                                var aux = 'false';
                                for (var j in result4) {
                                    if (result[i].COD_CHOFER === result4[j].COD_CHOFER) {
                                        result[i]['B2C'] = result4[j].B2C;
                                        aux = 'true';
                                    }
                                }
                                if (aux === 'false') {
                                    result[i]['B2C'] = 0;
                                }
                            }
                            con.query(sqlOrdenesB2cBio, function (err, result5, fields) {
                                if (err) throw err;
                                for (var i in result) {
                                    var aux = 'false';
                                    for (var j in result5) {
                                        if (result[i].COD_CHOFER === result5[j].COD_CHOFER) {
                                            result[i]['B2CBIO'] = result5[j].B2CBIO;
                                            aux = 'true';
                                        }
                                    }
                                    if (aux === 'false') {
                                        result[i]['B2CBIO'] = 0;
                                    }
                                }
                                con.query(sqlOrdenesB2cBioIntentos, function (err, result6, fields) {
                                    if (err) throw err;
                                    for (var i in result) {
                                        var aux = 'false';
                                        for (var j in result6) {
                                            if (result[i].COD_CHOFER === result6[j].COD_CHOFER) {
                                                result[i]['B2CBIOI'] = result6[j].B2CBIOI;
                                                aux = 'true';
                                            }
                                        }
                                        if (aux === 'false') {
                                            result[i]['B2CBIOI'] = 0;
                                        }
                                    }
                                    console.log(result);
                                    respuesta.send(result);
                                    respuesta.end();
                                });
                            });

                        });
                    });

                });
            });
        }

    } else {
        respuesta.send('false');
    }

});

app.post('/testsqlserver', function (llamado, respuesta) {
    var type = llamado.header('Content-Type');
    var api = llamado.header('X-API-KEY');
    if (type === 'application/json' && api === '55IcsddHxiy2E3q653RpYtb') {
        var request = new mssql.Request();

        request.query('select * from ciudades', function (err, recordset) {
            if (err) console.log(err)
            // send records as a response
            respuesta.send(recordset);
        });
    } else {
        respuesta.send('false');
    }
});

app.listen(5000, function () {
    console.log('escuchando en puerto 5000');
})
