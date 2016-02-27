var KPTS = require("../dist/index.js").default;
var fs = require("fs");


var kmlFileName = "./65_v2.7.kml";
var outputFileName = "./output/output_2.svg";

var kml = fs.readFileSync(kmlFileName, 'utf8');
fs.writeFileSync(outputFileName, KPTS(kml)); // 42.735