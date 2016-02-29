var KPTS = require("../dist/index.js").default;
var fs = require("fs");


var kmlFileName = "./paca.kml";
var outputFileName = "./output/output_2.svg";

var kml = fs.readFileSync(kmlFileName, 'utf8');
fs.writeFileSync(outputFileName, KPTS(kml)); // 42.735