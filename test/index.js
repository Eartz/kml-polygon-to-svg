var KPTS = require("../dist/index.js").default;
var fs = require("fs");


var kmlFileName = "./reunion_communes.kml";
var outputFileName = "./reunion_communes.svg";

var kml = fs.readFileSync(kmlFileName, 'utf8');
fs.writeFileSync(outputFileName, KPTS(kml, {
    filterAttributes: function(data) {
        return (data.name === "INSEE_COM");
    },
    dataTransform: function(name, value) {
        if (name === "INSEE_COM") {
            return {
                name: "insee",
                value: value
            };
        }
        return { name, value };
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