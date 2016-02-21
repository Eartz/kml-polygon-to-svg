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

export default {
    equirectangular: equirectangular,
    degToRad: degToRad,
    EARTH_RADIUS: EARTH_RADIUS
};
