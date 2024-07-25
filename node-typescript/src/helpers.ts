import {encode} from 'gpt-tokenizer'



export function tokenCount(text: string) {
    return encode(text).length
    // return 1
}

// Function to check if all required arguments are provided and modify metrics and logs URLs
export function check(metrics_url : string, logs_url : string, metrics_username : number, logs_username : number, access_token : string) { // 
    const requiredParameters = ['metrics_url', 'logs_url', 'metrics_username', 'logs_username', 'access_token'];
    
    // Check if all required parameters exist
    // for (const param of requiredParameters) {
    //     if (!eval(param)) {
    //     throw new Error(`The "${param}" parameter is missing.`);
    //     }
    // }
    
    // Check if 'api/prom' is present in the metrics URL
    if (!metrics_url.includes('api/prom')) {
      throw new Error("Invalid metrics URL format. It should contain 'api/prom' in the URL.");
    }

    // Check if 'api/v1/push' is present in the logs URL
    if (!logs_url.includes('api/v1/push')) {
      throw new Error("Invalid logs URL format. It should contain 'loki/api/v1/push' in the URL.");
    }
  
    // Convert metrics_url to use the influx line protocol URL
    if (metrics_url.includes('prometheus')) {
      metrics_url = metrics_url.replace('prometheus', 'influx').replace('api/prom', 'api/v1/push/influx/write');
  
      // Special case exception for prometheus-us-central1
      if (metrics_url.includes('-us-central1')) {
        metrics_url = metrics_url.replace('-us-central1', '-prod-06-prod-us-central-0');
      }
    }

    // Return metrics_url and logs_url without the trailing slash
    return {
      metrics_url: metrics_url.endsWith('/') ? metrics_url.slice(0, -1) : metrics_url,
      logs_url: logs_url.endsWith('/') ? logs_url.slice(0, -1) : logs_url,
    };
}

// Define the pricing information for different models
// const modelPrices = {
//   "ada": [0.0004, 0.0004],
//   "text-ada-001": [0.0004, 0.0004],
//   "babbage": [0.0004, 0.0004],
//   "babbage-002": [0.0004, 0.0004],
//   "text-babbage-001": [0.0004, 0.0004],
//   "curie": [0.0020, 0.0020],
//   "text-curie-001": [0.0020, 0.0020],
//   "davinci": [0.0020, 0.0020],
//   "davinci-002": [0.0020, 0.0020],
//   "text-davinci-001": [0.0020, 0.0020],
//   "text-davinci-002": [0.0020, 0.0020],
//   "text-davinci-003": [0.0020, 0.0020],
//   "gpt-3.5-turbo": [0.0010, 0.0020],
//   "gpt-3.5-turbo-16k": [0.003, 0.004],
//   "gpt-3.5-turbo-instruct": [0.0015, 0.0020],
//   "gpt-4": [0.03, 0.06],
//   "gpt-gpt-4-32k": [0.06, 0.12],
//   "gpt-4-32k": [0.06, 0.12],
//   "gpt-4-1106-preview": [0.01, 0.03],
//   "gpt-4-1106-vision-preview": [0.01, 0.03],
//   "gpt-4o": [0.01, 0.02],
//   "gpt-4o-2024-05-13": [0.01, 0.02]
// };

const chatModelPrices = {
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

export type ChatModel = keyof typeof chatModelPrices

// Function to calculate the cost based on the model, prompt tokens, and sampled tokens
export function calculateCostChatModel(model : ChatModel, inputTokens : number, outputTokens : number) {
    
    
  const modelPrice = chatModelPrices[model]
  if(!modelPrice) {
    console.warn(`Model ${model} not found in the pricing table. Using default price of [0, 0] for both input and output tokens`)
  }
  // Use destructuring to get the promptPrice and sampledPrice
  const [inputPrice, outputPrice] = modelPrice || [0, 0];

  const inputTokenPrice = inputPrice / 1000000;  // $ per input token
  const outputTokenPrice = outputPrice / 1000000; // $ per output token

  const totalPrice = (inputTokens * inputTokenPrice) + (outputTokens * outputTokenPrice);

  return totalPrice;
}

export type Stream = {
  stream: {
    job: string,
    prompt: string,
    model: string,
    role: string,
    finish_reason: string,
    prompt_tokens: string,
    completion_tokens: string,
    total_tokens: string,
  },
  values: [string, string | null][]
}

export type Logs = {
  streams: Stream[]
}
// Function to send logs to the specified logs URL
export async function sendLogs(logs_url : string, logs_username : number, access_token : string, logs : Logs) {
  try {
      const response = await fetch(logs_url, {
          method: 'post',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Basic ${btoa(`${logs_username}:${access_token}`)}`,
          },
          body: JSON.stringify(logs),
          // timeout: 60000, // 60 seconds
          signal: AbortSignal.timeout(60000)
      });

      if (!response.ok) {
          throw new Error(`Error sending Logs: HTTP status ${response.status}`);
      }

      return response;
  } catch (err : any) {
      throw new Error(`Error sending Logs: ${err.message}`);
  }
}


export type Metrics = string[]

// Function to send metrics to the specified metrics URL
export async function sendMetrics(metrics_url : string, metrics_username : number, access_token : string, metrics : Metrics) {
    try {
      const body = metrics.join('\n');
      const response = await fetch(metrics_url, {
        method: 'post',
        headers: {
          'Content-Type': 'text/plain',
          'Authorization': `Bearer ${metrics_username}:${access_token}`,
        },
        body: body,
        // timeout: 60000, // 60 seconds
        signal: AbortSignal.timeout(60000)

      });
  
      if (!response.ok) {
        throw new Error(`Error sending Metrics: HTTP status ${response.status}`);
      }
  
      return response;
    } catch (err) {
      throw new Error(`Error sending Metrics: ${err}`);
    }
  }
