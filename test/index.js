var KPTS = require("../dist/index.js").default;
var fs = require("fs");


var kmlFileName = "./reunion_departement.kml";
var outputFileName = "./reunion_departements.svg";

let communesDataTransform = function(name, value) {
    if (name === "INSEE_COM") {
        return {
            name: "insee",
            value: value
        };
    }
    return { name, value };
};
let deptDataTransform = function(name, value) {
    if (name === "CODE_DEPT") {
        return {
            name: "dept",
            value: value
        };
    }
    return { name, value };
};

var kml = fs.readFileSync(kmlFileName, 'utf8');
fs.writeFileSync(outputFileName, KPTS(kml, {
    filterAttributes: function(data) {
        return (data.name === "CODE_DEPT");
    },
    dataTransform: deptDataTransform,
    round: 1,
    withId: false,
    precision: 0,
    simplification: true,
    simplificationTolerance: 0.1,
    coordsTransform: function(point, view, formatFunc) {
        point.y = formatFunc(view.maxY - point.y); // hozaxial symmetry
        // point.x = 80 + point.x;
        return point;
    }
}).replace(/\n/mg, "")


); // 42.735