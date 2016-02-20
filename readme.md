# kml-polygon-to-svg.js

Converts (flat) KML Polygons into SVG path elements.  
The main task is to convert coordinates from spherical to cartesian using equirectangular projection.

**NOT production ready ! At this point it's just a proof of concept.**

Don't use it for now, I have work to do before that :

 * define the scope of the project
 * write tests
 * convert Placemarks (with data and polygons) instead of converting Polygons only
 * figure out a simplification of the shapes to reduce file size (we don't need 10 decimals)
 * implement projections more precise than equirectangular
 * change the name ?

```js
var KPTS = require("../src/index.js");
var fs = require("fs");

var kmlFileName = "./65_v2.7.kml";
var outputFileName = "./output/output_2.svg";

var kml = fs.readFileSync(kmlFileName, 'utf8');

// pick a latitude (in deg) close to the center of the area you want to render
// In my case : 42.735
fs.writeFileSync(outputFileName, KPTS(kml, 42.735));
```