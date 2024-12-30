import { Console } from 'console';
import {
    check,
    sendLogs,
    sendMetrics,
    Logs, 
    tokenCount,
    getTextContentFromMessage,
    getInputTextFromMessages,
    getImagesFromMessages,
     
} from './helpers.js'

import {
    calculateCostChatModel,
    calculateCostImageModel,
    overwriteChatModelPrices,
    overwriteImageModelPrices,
    ChatModel,
    calculateVisionCostForImages
} from './pricingTable/index.js'

import OpenAI from 'openai';
import { ChatCompletionChunk, ChatCompletionContentPart, ChatCompletionContentPartText, ChatCompletion } from 'openai/resources/chat/completions';
import { Stream } from 'openai/streaming';
import { dalleMonitorFunction } from './dall-e-monitor.js';



export type Options = {
    metrics_url: string,
    logs_url: string,
    metrics_username: number,
    logs_username: number,
    access_token: string,
    log_prompt?: boolean,
    log_response?: boolean,

    overwrite_chat_model_price?: {[key: string]: [number, number]},
    overwrite_image_model_price?: {[key: string]: {[key: string]: {[key: string]: number}}}
}

export function monitor(openai: OpenAI, {
    metrics_url, 
    access_token, 
    logs_url, 
    logs_username, 
    metrics_username,
    log_prompt = true,
    log_response = true,

    overwrite_chat_model_price = {},
    overwrite_image_model_price = {}

}: Options) {

    overwriteChatModelPrices(overwrite_chat_model_price)
    overwriteImageModelPrices(overwrite_image_model_price)

    const validatedURL = check(metrics_url, logs_url, metrics_username, logs_username, access_token) // 


    // const originalBetaCreate = openai.chat.completions.create.bind(openai.beta.chat.completions) as any
    // @ts-ignore
    openai.beta.chat.completions.parse = async function(...args) {
        // const response = await openai.beta.chat.completions._client.chat.completions.create(args[0], {
        const response = await openai.chat.completions.create(args[0], {
            ...args[1],
            headers: {
                ...args[1]?.headers,
                'X-Stainless-Helper-Method': 'beta.chat.completions.parse',
            }
        })
        

        return {
            ...response,
            choices: response.choices.map((choice) => ({
                ...choice,
                message: {
                    ...choice.message,
                    parsed: JSON.parse(choice.message.content as string)
                }
            }))
        } as OpenAI.Chat.Completions.ChatCompletion & {
            _request_id?: string | null;
        }
    }


    
    const originalCreate = openai.chat.completions.create.bind(openai.chat.completions) as any 
    //@ts-ignore 
    openai.chat.completions.create = async function(params, options) {  


        const promptText = getTextContentFromMessage(params.messages?.at(-1)!)

        const inputTokens = getInputTextFromMessages(params.messages)

        const images = getImagesFromMessages(params.messages)
        

        if(params.stream){
            const start = performance.now();
            const response = await originalCreate(params, options) as Stream<ChatCompletionChunk>;
            
            const [stream1, stream2] = response.tee();
            (async function() {
                // const promptTokens = tokenCount(promptText);
                const promptTokens = tokenCount(inputTokens);
                let completionTokens = 0;

                const chunks = []

                let firstChunkTime = -1

                for await(const chunk of stream2){
                    if(firstChunkTime == -1)
                        firstChunkTime = performance.now();
                    completionTokens++
                    chunks.push(chunk)
                }
                
                const end = performance.now();
                const duration = (firstChunkTime - start) / 1000;
                const endDuration = (end - start) / 1000;

                const content = chunks.map((chunk) => chunk.choices[0].delta.content).join('')

                const cost = calculateCostChatModel(
                    params.model as ChatModel, 
                    promptTokens, 
                    completionTokens
                ) + (await calculateVisionCostForImages(images))
                    

                const logs = {
                    streams: [
                        {
                        stream: {
                            job: 'integrations/openai',
                            prompt: log_prompt ? promptText : "no data",
                            model: chunks[0].model,
                            role: "assistant",
                            finish_reason: chunks.at(-1)!.choices[0].finish_reason,
                            prompt_tokens: promptTokens.toString(),
                            completion_tokens: completionTokens.toString(),
                            total_tokens: (promptTokens + completionTokens).toString(),
                            attached_images: images.length.toString(),

                        },
                        values: [
                            [
                                (Math.floor(Date.now() / 1000) * 1000000000).toString(),
                                log_response ? content : "no data",
                            ],
                        ],
                        },
                    ],
                } as Logs;

                // Send logs to the specified logs URL
                sendLogs(logs_url, logs_username, access_token, logs)
                .catch((error) => {
                    console.warn(error.message);
                });
                // Prepare metrics to be sent
                const metrics = [
                    `openai,job=integrations/openai,source=node_chatv2,model=${chunks[0].model} completionTokens=${completionTokens}`,
                    `openai,job=integrations/openai,source=node_chatv2,model=${chunks[0].model} promptTokens=${promptTokens}`,
                    `openai,job=integrations/openai,source=node_chatv2,model=${chunks[0].model} totalTokens=${promptTokens+completionTokens}`,
                    `openai,job=integrations/openai,source=node_chatv2,model=${chunks[0].model} requestDuration=${duration}`,
                    `openai,job=integrations/openai,source=node_chatv2,model=${chunks[0].model} requestEndDuration=${endDuration}`,
                    `openai,job=integrations/openai,source=node_chatv2,model=${chunks[0].model} usageCost=${cost}`,
                    `openai,job=integrations/openai,source=node_chatv2,model=${chunks[0].model} images=${images?.length || 0}`,
                    
                ];
        
                sendMetrics(validatedURL.metrics_url, metrics_username, access_token, metrics)
                .catch((error) => {
                    console.warn(error.message);
                });

            })()


            return stream1
        }

        const start = performance.now();

        // Call original method
        const response = await originalCreate(params, options) as ChatCompletion;
        const end = performance.now();
        const duration = (end - start) / 1000;

         // Calculate the cost based on the response's usage
        const cost = calculateCostChatModel(
            params.model as ChatModel, 
            response.usage!.prompt_tokens, 
            response.usage!.completion_tokens
        ) + (await calculateVisionCostForImages(images))
            

        // Prepare logs to be sent
        const logs = {
            streams: [
                {
                stream: {
                    job: 'integrations/openai',
                    prompt: log_prompt ? promptText : "no data",
                    model: response.model,
                    role: response.choices[0].message.role,
                    finish_reason: response.choices[0].finish_reason,
                    prompt_tokens: response.usage!.prompt_tokens.toString(),
                    completion_tokens: response.usage!.completion_tokens.toString(),
                    total_tokens: response.usage!.total_tokens.toString(),
                    attached_images: images.length.toString(),
                },
                values: [
                    [
                    (Math.floor(Date.now() / 1000) * 1000000000).toString(),
                    log_response ? response.choices[0].message.content : "no data",
                    ],
                ],
                },
            ],
        } as Logs;

        // Send logs to the specified logs URL
        sendLogs(logs_url, logs_username, access_token, logs)
        .catch((error) => {
            console.warn(error.message);
        });
        // Prepare metrics to be sent
        const metrics = [
        `openai,job=integrations/openai,source=node_chatv2,model=${response.model} completionTokens=${response.usage!.completion_tokens}`,
        `openai,job=integrations/openai,source=node_chatv2,model=${response.model} promptTokens=${response.usage!.prompt_tokens}`,
        `openai,job=integrations/openai,source=node_chatv2,model=${response.model} totalTokens=${response.usage!.total_tokens}`,
        `openai,job=integrations/openai,source=node_chatv2,model=${response.model} requestDuration=${duration}`,
        // Do not send when using no stream ?
        `openai,job=integrations/openai,source=node_chatv2,model=${response.model} requestEndDuration=${duration}`,

        `openai,job=integrations/openai,source=node_chatv2,model=${response.model} usageCost=${cost}`,
        `openai,job=integrations/openai,source=node_chatv2,model=${response.model} images=${images?.length || 0}`,
        ];

        sendMetrics(validatedURL.metrics_url, metrics_username, access_token, metrics)
        .catch((error) => {
            console.warn(error.message);
        });


        return response;
    } 


    const originalImageGenerate = openai.images.generate.bind(openai.images) as
    (params: any, options: any) => Promise<any>;

    const monitorImageGenerateFunction = dalleMonitorFunction({
        originalFunction: originalImageGenerate,
        logPrompt: log_prompt,
        job: 'integrations/openai/imagegeneration',
        access_token,
        logs_url,
        logs_username,
        metrics_username,
        validatedURL
    })

    // @ts-ignore
    openai.images.generate = monitorImageGenerateFunction

    const originalImageCreateVariation = openai.images.createVariation.bind(openai.images) as
    (params: any, options: any) => Promise<any>;

    const monitorImageCreateVariationFunction = dalleMonitorFunction({
        originalFunction: originalImageCreateVariation,
        logPrompt: log_prompt,
        job: 'integrations/openai/imagevariation',
        access_token,
        logs_url,
        logs_username,
        metrics_username,
        validatedURL
    })

    // @ts-ignore
    openai.images.createVariation = monitorImageCreateVariationFunction

    const originalImageEdit = openai.images.edit.bind(openai.images) as
    (params: any, options: any) => Promise<any>;

    const monitorImageEditFunction = dalleMonitorFunction({
        originalFunction: originalImageEdit,
        logPrompt: log_prompt,
        job: 'integrations/openai/imageedit',
        access_token,
        logs_url,
        logs_username,
        metrics_username,
        validatedURL
    })

    // @ts-ignore
    openai.images.edit = monitorImageEditFunction
}