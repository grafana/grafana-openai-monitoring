
import OpenAI from "openai"
import { tokenCount, sendMetrics, sendLogs } from "./helpers.js"
import { calculateCostImageModel } from "./pricingTable/pricingImageModels.js"

export type DalleMonitorFunctionProps = {
    originalFunction: (params : any, options : any) => any,
    logPrompt: boolean,
    job: string,
    validatedURL: {metrics_url: string, logs_url: string},
    metrics_username: number,
    logs_username: number,
    logs_url: string
    access_token: string,
}
export function dalleMonitorFunction({originalFunction, logPrompt, job, access_token, logs_url, logs_username, metrics_username, validatedURL} : DalleMonitorFunctionProps) {


    return async (params : any, options : any) => {

        const start = performance.now();

        // Call original method
        const response = await originalFunction(params, options) as Promise<OpenAI.Images.ImagesResponse>;
        const end = performance.now();
        const duration = (end - start) / 1000;


        const cost = calculateCostImageModel(params.model as string, params.quality as string || undefined, params.size as string || undefined);

        const logs = {
            streams: [
                {
                stream: {
                    job: job,
                    prompt: logPrompt ? params.prompt : "no data",
                    model: params.model,
                    size: params.size || "1024x1024",
                    quality: params.quality || "standard",
                    prompt_tokens: tokenCount(params.prompt || "").toString(),
                    num_images: (params.n || 1).toString(),
                },
                values: [
                    [
                        (Math.floor(Date.now() / 1000) * 1000000000).toString(),
                        logPrompt ? params.prompt : "no data",
                    ],
                ],
                },
            ],
        };

        // @ts-ignore
        sendLogs(logs_url, logs_username, access_token, logs)
        .catch((error : any) => {
            console.warn(error.message);
        })

        const metrics = [
            `openai,job=${job},source=node_chatv2,model=${params.model || "dall-e-2"} requestDuration=${duration}`,
            `openai,job=${job},source=node_chatv2,model=${params.model || "dall-e-2"} usageCost=${cost}`,
        ];
        if(typeof params.prompt == "string") {
            metrics.push(
                `openai,job=${job},source=node_chatv2,model=${params.model || "dall-e-2"} promptTokens=${tokenCount(params.prompt)}`,
            )
        }

        sendMetrics(validatedURL.metrics_url, metrics_username, access_token, metrics)
        .catch((error : any) => {
            console.warn(error);
        });

        return response
    }
}
