const LEGACY_SQUARE_BORDER_SIZE = 14142.135623730952;
const AREA_MATCHED_CIRCLE_DIAMETER = 2 * Math.sqrt(
    LEGACY_SQUARE_BORDER_SIZE * LEGACY_SQUARE_BORDER_SIZE / Math.PI
);

module.exports = Object.freeze({
    circularArena: true,
    borderWidth: AREA_MATCHED_CIRCLE_DIAMETER,
    borderHeight: AREA_MATCHED_CIRCLE_DIAMETER,

    // Keep tiny cells quick, but slightly calmer than the stock clone defaults.
    playerSpeed: 0.96,

    // Public Agar.io references describe recombine as 30s plus a mass factor.
    playerRecombineTime: 30,
    playerRecombineMassFactor: 50,

    // Agar.io ejecting loses about 18 mass and creates about 13 mass.
    ejectSize: Math.sqrt(13 * 100),
    ejectSizeLoss: Math.sqrt(18 * 100),

    // Agar.io reference behavior: a normal split travels about 12 grid spaces.
    splitVelocity: 600
});
