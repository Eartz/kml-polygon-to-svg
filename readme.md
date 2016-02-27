# kml-polygon-to-svg.js

This tool can convert KML files containing Placemarks and Polygons into SVG path elements.  
The main task is to convert coordinates from spherical to cartesian using a projection.

## Usage :

```js
var KPTS = require("../dist/index.js");
var fs = require("fs");

var kmlFileName = "./input.kml";
var outputFileName = "./output.svg";

var kml = fs.readFileSync(kmlFileName, 'utf8');

fs.writeFileSync(outputFileName, KPTS(kml));
```

This tool will also look for `<Data>` elements in Placemarks and will add them as attributes to the path elements in the output.
By default, the name of the Data element is prefixed by "data-", which helps avoid conflicts but is not standard (as of SVG 1.1). You can override the prefix with the `dataPrefix` option, which you can use to use a prefix such as `"mynamespace:"` if you want to add your namespace (you will have to declare your namespace in the `svg` tag).  



The standard spherical mercator projection is used by default.  
Other projections are implemented :  
 
 * equirectangular : very simple but usually not recommended. You will have to provide a latitude close to the center of the area you want to project  
 * elliptical mercator : more precise than spherical mercator, but heavier.    

 ```js
 KPTS(kml, {
    projection: "equirectangular",
    φ0: 42.01
 });
 KPTS(kml, {
    projection: "ellipticalMercator"
 });
 ```


## TODO

 * write tests  
 * refactor viewport calculation (ugly right now)  
 * provide options to transform coordinates and extended data with custom functions  
 * include an example  
