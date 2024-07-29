export function calculateVisionModelCostDetail(width : number, height : number, fixedCost = 85, tileCost = 170, millionTokenPrice = 5, numDecimals = 6) {
    // Calculate token price
    const tokenPrice = millionTokenPrice / 1e6;

    // Helper functions to adjust dimensions
    function adjustDimension(value : number, max : number) {
        return value > max ? max : value;
    }

    // Initial Resize
    let t = width > 2048 || height > 2048 ? (width > height ? 2048 : Math.round((width / height) * 2048)) : width;
    let r = width > 2048 || height > 2048 ? (width > height ? Math.round(2048 / (width / height)) : 2048) : height;

    // Further Resize
    let a = t > 768 || r > 768 ? (t < r ? Math.min(768, t) : Math.round((t / r) * Math.min(768, r))) : t;
    let i = t > 768 || r > 768 ? (t < r ? Math.round(Math.min(768, t) / (t / r)) : Math.min(768, r)) : r;

    // Tiles Calculation
    let l = 1 + Math.ceil((i - 512) / 512);
    let o = 1 + Math.ceil((a - 512) / 512);
    let c = l * o;

    // Cost Calculation
    let d = fixedCost + c * tileCost;
    let g = d * tokenPrice;
    let totalPrice = parseFloat(g.toFixed(numDecimals));

    return {
        initialResizeWidth: t,
        initialResizeHeight: r,
        furtherResizeWidth: a,
        furtherResizeHeight: i,
        verticalTiles: l,
        horizontalTiles: o,
        totalTiles: c,
        totalTokens: d,
        totalPrice: totalPrice
    };
}

