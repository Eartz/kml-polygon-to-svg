var KPTS = require("../src/index.js");
var fs = require("fs");


var kmlFileName = "./gedre_polygon.kml";
var kml = fs.readFileSync(kmlFileName, 'utf8');

console.log(KPTS(kml, 42.735)); // 42.735