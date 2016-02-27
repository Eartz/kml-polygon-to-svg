export const EARTH_RADIUS = 6371; // Earth radius in km

export const degToRad = (degrees) => {
  return degrees * Math.PI / 180;
};

// equirectangular projection :
// x = r λ cos(φ0)
// y = r φ
// where λ = longitude, φ = latitude, φ0 = latitude close to the center, r = earth radius
export const equirectangular = {
    x: (λ, φ0) => {
        return EARTH_RADIUS * degToRad(λ) * Math.cos(degToRad(φ0));
    },
    y: (φ) => {
        return EARTH_RADIUS * degToRad(φ);
    }
};
// http://paulbourke.net/geometry/transformationprojection/
// mercator :
// x = longitude / pi
// y = ln((1 + sin(latitude))/(1 - sin(latitude))) / (4 pi)
export const sphericalMercator = {
    x: (λ) => λ,
    y: (φ) => {
        return 180 / Math.PI * Math.log(Math.tan(Math.PI / 4 + φ * (Math.PI / 180) / 2));
    }
};

// http://wiki.openstreetmap.org/wiki/Mercator#JavaScript
// ellipticalMercator (true)
const r_major = 6378137.000;
const r_minor = 6356752.3142;
export const ellipticalMercator = {
    x: (λ) => {
        return r_major * degToRad(λ);
    },
    y: (φ) => {
        if (φ > 89.5) {
            φ = 89.5;
        }
        if (φ < -89.5) {
            φ = -89.5;
        }
        const temp = r_minor / r_major;
        const es = 1.0 - (temp * temp);
        const eccent = Math.sqrt(es);
        const phi = degToRad(φ);
        const sinphi = Math.sin(phi);
        let con = eccent * sinphi;
        const com = 0.5 * eccent;
        con = Math.pow((1.0 - con) / (1.0 + con), com);
        const ts = Math.tan(0.5 * (Math.PI * 0.5 - phi)) / con;
        const y = 0 - r_major * Math.log(ts);
        return y;
    }
};

export default {
    equirectangular: equirectangular,
    mercator: sphericalMercator,
    sphericalMercator: sphericalMercator,
    ellipticalMercator: ellipticalMercator,
    degToRad: degToRad,
    EARTH_RADIUS: EARTH_RADIUS
};
