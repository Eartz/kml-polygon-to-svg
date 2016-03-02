var KPTS = require("../dist/index.js").default;
var fs = require("fs");


var kmlFileName = "./paca.kml";
var outputFileName = "./output_paca_4.svg";

var kml = fs.readFileSync(kmlFileName, 'utf8');
fs.writeFileSync(outputFileName, KPTS(kml, {
    filterAttributes: function(data) {
        return (data.name === "INSEE_COM");
    },
    round: 1,
    withId: false,
    precision: 0,
    simplification: true,
    simplificationTolerance: 0.1,
    coordsTransform: function(point, view, formatFunc) {
        point.y = formatFunc(view.maxY - point.y); // hozaxial symmetry
        return point;
    }
}).replace(/\n/mg, "")


); // 42.735