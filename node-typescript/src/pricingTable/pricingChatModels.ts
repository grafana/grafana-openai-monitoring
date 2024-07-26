
export let chatModelPrices = {
    "gpt-4o": [5, 15],
    "gpt-4o-2024-05-13": [5, 15],

    "gpt-4o-mini": [0.15, 0.6],
    "gpt-4o-mini-2024-07-18": [0.15, 0.6],

    "gpt-4-turbo": [10, 30],
    "gpt-4-turbo-2024-04-09": [10, 30],
    "gpt-4": [30, 60],
    "gpt-4-32k": [60, 120],
    "gpt-4-0125-preview": [10, 30],
    "gpt-4-1106-preview": [10, 30],
    "gpt-4-vision-preview": [10, 30],
    "gpt-3.5-turbo-0125": [0.5, 1.5],
    "gpt-3.5-turbo-instruct": [0.5, 2],
    "gpt-3.5-turbo-1106": [1, 2],
    "gpt-3.5-turbo-0613": [1.5, 2],
    "gpt-3.5-turbo-16k-0613": [3, 4],
    "gpt-3.5-turbo-0301": [1.5, 2],
    "davinci-002": [2, 2],
    "babbage-002": [0.4, 0.4],
}

export function overwriteChatModelPrices(prices : {[key: string]: [number, number]}) {
    chatModelPrices = {...chatModelPrices, ...prices}
}

export type ChatModel = keyof typeof chatModelPrices

// Function to calculate the cost based on the model, prompt tokens, and sampled tokens
export function calculateCostChatModel(model : ChatModel, inputTokens : number, outputTokens : number) {
    
    
    const modelPrice = chatModelPrices[model]
    if(!modelPrice) {
        console.warn(`Model ${model} not found in the pricing table. Using default price of [0, 0] $ for both input and output tokens`)
    }
    // Use destructuring to get the promptPrice and sampledPrice
    const [inputPrice, outputPrice] = modelPrice || [0, 0];

    const inputTokenPrice = inputPrice / 1000000;  // $ per input token
    const outputTokenPrice = outputPrice / 1000000; // $ per output token

    const totalPrice = (inputTokens * inputTokenPrice) + (outputTokens * outputTokenPrice);

    return totalPrice;
}

