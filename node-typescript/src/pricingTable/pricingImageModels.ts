


export let imageModelPrices = {
    "dall-e-3": {
      "standard": {
        "1024x1024": 0.04, //"$0.040 / image",
        "1024x1792": 0.08, //"$0.080 / image"
        "1792x1024": 0.08
      },
      "hd": {
        "1024x1024": 0.08, //"$0.080 / image",
        "1024x1792": 0.12, //"$0.120 / image"
        "1792x1024": 0.12
      }
    },
    "dall-e-2": {
      "standard": {
        "1024x1024": 0.02, //"$0.020 / image",
        "512x512": 0.018, //"$0.018 / image",
        "256x256": 0.016, //"$0.016 / image"
      }
    }
}

export function overwriteImageModelPrices(overwritePrices: any){
    imageModelPrices = mergeDeep(imageModelPrices, overwritePrices)
}
  
export function calculateCostImageModel(model: string, quality: string = "standard", size: string = "1024x1024") {
  
    const price = (imageModelPrices as any)[model]?.[quality]?.[size]
  
    if(!price) {
      console.warn(`Model ${model} not found in the image pricing table. Using default price of 0$`)
      return 0
    }
  
    return price
}


function mergeDeep(target : any, source : any) {
    const isObject = (obj : any) => obj && typeof obj === 'object';
  
    if (!isObject(target) || !isObject(source)) {
      return source;
    }
  
    Object.keys(source).forEach(key => {
      const targetValue = target[key];
      const sourceValue = source[key];
  
      if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
        target[key] = targetValue.concat(sourceValue);
      } else if (isObject(targetValue) && isObject(sourceValue)) {
        target[key] = mergeDeep(Object.assign({}, targetValue), sourceValue);
      } else {
        target[key] = sourceValue;
      }
    });
  
    return target;
  }