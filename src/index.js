import libxmljs from "libxmljs";
import projections from "./projections.js";


export default function (kml, φ0) {
    const view = {
        minX: false,
        maxX: false,
        minY: false,
        maxY: false
    };
    const proj = projections.equirectangular;

    // TODO : work at Placemark level, and not Polygon level, so that I can
    // copy the Placemark data in the final SVG
    let kmlPolygons = [];
    const doc = libxmljs.parseXml(kml);

    // Find polygons anywhere
    const polygons = doc.find('//kml:Polygon', {kml: "http://www.opengis.net/kml/2.2"});

    if (polygons.length > 0) {
        for (var i = 0, l = polygons.length; i < l; i++) {
            let tempKmlPolygon = {
                data: {},
                points: []
            };

            // get coordinates
            let coords = polygons[i].find(".//kml:coordinates", {kml: "http://www.opengis.net/kml/2.2"})
                        .reduce(function(val, node) {
                                return val + node.text().trim();
                        }, "");
            let points = coords.split(' ');
            for (var j = 0, pl = points.length; j < pl; j++) {
                var point = points[j].split(',');

                // Apply the projection
                point[0] = proj.x(Number(point[0]), φ0);
                point[1] = proj.y(Number(point[1]));
                // 0: x, 1: y, 2: z
                // Store the smallest and biggest coords to find out what the viewport is
                if ((view.minX === false) || (Number(point[0]) < view.minX)) {
                    if (!isNaN(Number(point[0]))) {
                        view.minX = Number(point[0]);
                    }
                }
                if ((view.maxX === false) || (Number(point[0]) > view.maxX)) {
                    if (!isNaN(Number(point[0]))) {
                        view.maxX = Number(point[0]);
                    }
                }
                if ((view.minY === false) || (Number(point[1]) < view.minY)) {
                    if (!isNaN(Number(point[1]))) {
                        view.minY = Number(point[1]);
                    }
                }
                if ((view.maxY === false) || (Number(point[1]) > view.maxY)) {
                    if (!isNaN(Number(point[1]))) {
                        view.maxY = Number(point[1]);
                    }
                }
                tempKmlPolygon.points.push({
                    x: Number(point[0]),
                    y: Number(point[1]),
                    z: Number(point[2])
                });
            }

            kmlPolygons.push(tempKmlPolygon);
        }
    }

    // Remove negative values, we want (0,0) to be the top left corner, not the center
    const multiplier = 100; // work with bigger values
    let Xdiff = 0;
    if (view.minX < 0) {
        Xdiff = 0 - view.minX;
    } else if (view.minX > 0) {
        Xdiff = 0 - view.minX;
    }
    let Ydiff = 0;
    if (view.minY < 0) {
        Ydiff = 0 - view.minY;
    } else if (view.minY > 0) {
        Ydiff = 0 - view.minY;
    }

    const newBoundaries = {
        minX: (view.minX + Xdiff) * multiplier,
        maxX: (view.maxX + Xdiff) * multiplier,
        minY: (view.minY + Ydiff) * multiplier,
        maxY: (view.maxY + Ydiff) * multiplier
    };


    kmlPolygons = kmlPolygons.map((v) => {
        return {
            data: v.data,
            points: v.points.map((vv) => {
                return {
                    x: (vv.x + Xdiff) * multiplier,
                    y: (vv.y + Ydiff) * multiplier,
                    z: (vv.z)
                };
            })
        };
    });
    // output
    const svg = new libxmljs.Document();
    svg.setDtd('svg', "-//W3C//DTD SVG 1.0//EN", "http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd");

    let longest = newBoundaries.maxX;
    if (newBoundaries.maxX < newBoundaries.maxY) {
        longest = newBoundaries.maxY;
    }
    const g = svg.node("svg").attr({
        version: "1.0",
        id: "Calque_1",
        xmlns: "http://www.w3.org/2000/svg",
        "xmlns:xlink": "http://www.w3.org/1999/xlink",
        overflow: "visible",
        "xml:space": "preserve",
        width: "" + longest,
        height: "" + longest,
        viewBox: "0 0 " + longest + " " + longest
    })
        .node("g");
    kmlPolygons.map(function(v, k) {
        let pathData = "";
        v.points.map(function(vv, kk) {
            var command = "M"; // if this is the first point of the polygon, to a MoveTo command
            if (kk > 1) {
                command = "L"; // else, LineTo
            }
            pathData += " " + command + " ";
            pathData += vv.x + "," + vv.y;
        });
        pathData += " z";

        // TODO : pass Placemark data in custom attributes 'data-...'
        g.addChild(new libxmljs.Element(svg, "path").attr({
            id: "poly_" + k,
            d: pathData
        }));
    });
    return svg.toString();
};
