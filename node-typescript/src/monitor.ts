import {
    check,
    calculateCost,
    sendLogs,
    sendMetrics,
    Logs, 
    Model,
    tokenCount,
     
} from './helpers.js'

import OpenAI from 'openai';
import { ChatCompletionChunk, ChatCompletionContentPart, ChatCompletionContentPartText, ChatCompletion } from 'openai/resources';
import { Stream } from 'openai/streaming';



export type Options = {
    metrics_url: string,
    logs_url: string,
    metrics_username: number,
    logs_username: number,
    access_token: string,
}

export function monitor(openai: OpenAI, options: Options) {
    const {
        metrics_url,
        logs_url,
        metrics_username,
        logs_username,
        access_token
    } = options;
    const validatedURL = check(metrics_url, logs_url, metrics_username, logs_username, access_token) // 

    // Save original method
    const originalCreate = openai.chat.completions.create;


    // @ts-ignore : monkey patching
    openai.chat.completions.create = async function(params, options) {  
        
        if(params.stream){

            const start = performance.now();
            const response = await originalCreate.call(this, params, options) as Stream<ChatCompletionChunk>;
            
            (async function() {
                    // let promptMessage = params.messages[0].content;
                // TODO
                // Shouldnt it be params.messages[-1] to get the latest prompt from the array??????
                const promptMessage = params.messages[0];
                const text = promptMessage.content as string || ((promptMessage.content as ChatCompletionContentPart[])
                    .find(p => p.type =="text") as ChatCompletionContentPartText).text || "";


                const promptTokens = tokenCount(text);
                let completionTokens = 0;

                const chunks = []

                let firstChunkTime = -1

                for await(const chunk of response){
                    if(firstChunkTime == -1)
                        firstChunkTime = performance.now();
                    completionTokens++
                    chunks.push(chunk)
                }
                
                const end = performance.now();
                const duration = (firstChunkTime - start) / 1000;
                const endDuration = (end - start) / 1000;

                const content = chunks.map((chunk) => chunk.choices[0].delta.content).join('')

                const cost = calculateCost(params.model as Model, promptTokens, completionTokens);
                const logs = {
                    streams: [
                        {
                        stream: {
                            job: 'integrations/openai',
                            prompt: params.messages[0].content,
                            model: chunks[0].model,
                            role: "assistant",
                            finish_reason: chunks[chunks.length - 1].choices[0].finish_reason,
                            prompt_tokens: promptTokens.toString(),
                            completion_tokens: completionTokens.toString(),
                            total_tokens: (promptTokens + completionTokens).toString(),
                        },
                        values: [
                            [
                                (Math.floor(Date.now() / 1000) * 1000000000).toString(),
                                content,
                            ],
                        ],
                        },
                    ],
                } as Logs;

                // Send logs to the specified logs URL
                sendLogs(logs_url, logs_username, access_token, logs);

                // Prepare metrics to be sent
                const metrics = [
                    // Metric to track the number of completion tokens used in the response
                    `openai,job=integrations/openai,source=node_chatv2,model=${chunks[0].model} completionTokens=${completionTokens}`,
            
                    // Metric to track the number of prompt tokens used in the response
                    `openai,job=integrations/openai,source=node_chatv2,model=${chunks[0].model} promptTokens=${promptTokens}`,
            
                    // Metric to track the total number of tokens used in the response
                    `openai,job=integrations/openai,source=node_chatv2,model=${chunks[0].model} totalTokens=${promptTokens+completionTokens}`,
            
                    // Metric to track the duration of the API request and response cycle
                    `openai,job=integrations/openai,source=node_chatv2,model=${chunks[0].model} requestDuration=${duration}`,
                    
                    // Metric to track the duration of the API request and response cycle
                    `openai,job=integrations/openai,source=node_chatv2,model=${chunks[0].model} requestEndDuration=${endDuration}`,
            
                    // Metric to track the usage cost based on the model and token usage
                    `openai,job=integrations/openai,source=node_chatv2,model=${chunks[0].model} usageCost=${cost}`,
                ];
        
                sendMetrics(validatedURL.metrics_url, metrics_username, access_token, metrics)
                .catch((error) => {
                    console.error(error.message);
                });

            })()


            return await originalCreate.call(this, params, options);
        }

        const start = performance.now();

        // Call original method
        const response = await originalCreate.call(this, params, options) as ChatCompletion;
        const end = performance.now();
        const duration = (end - start) / 1000;

         // Calculate the cost based on the response's usage
        const cost = calculateCost(params.model as Model, response.usage!.prompt_tokens, response.usage!.completion_tokens);

        // Prepare logs to be sent
        const logs = {
            streams: [
                {
                stream: {
                    job: 'integrations/openai',
                    prompt: params.messages[0].content,
                    model: response.model,
                    role: response.choices[0].message.role,
                    finish_reason: response.choices[0].finish_reason,
                    prompt_tokens: response.usage!.prompt_tokens.toString(),
                    completion_tokens: response.usage!.completion_tokens.toString(),
                    total_tokens: response.usage!.total_tokens.toString(),
                },
                values: [
                    [
                    (Math.floor(Date.now() / 1000) * 1000000000).toString(),
                    response.choices[0].message.content,
                    ],
                ],
                },
            ],
        } as Logs;

        // Send logs to the specified logs URL
        sendLogs(logs_url, logs_username, access_token, logs);

        // Prepare metrics to be sent
        const metrics = [
        // Metric to track the number of completion tokens used in the response
        `openai,job=integrations/openai,source=node_chatv2,model=${response.model} completionTokens=${response.usage!.completion_tokens}`,

        // Metric to track the number of prompt tokens used in the response
        `openai,job=integrations/openai,source=node_chatv2,model=${response.model} promptTokens=${response.usage!.prompt_tokens}`,

        // Metric to track the total number of tokens used in the response
        `openai,job=integrations/openai,source=node_chatv2,model=${response.model} totalTokens=${response.usage!.total_tokens}`,

        // Metric to track the duration of the API request and response cycle
        `openai,job=integrations/openai,source=node_chatv2,model=${response.model} requestDuration=${duration}`,

        // Metric to track the duration of the API request and response cycle
        `openai,job=integrations/openai,source=node_chatv2,model=${response.model} requestEndDuration=${duration}`,

        // Metric to track the usage cost based on the model and token usage
        `openai,job=integrations/openai,source=node_chatv2,model=${response.model} usageCost=${cost}`,
        ];

        sendMetrics(validatedURL.metrics_url, metrics_username, access_token, metrics)
        .catch((error) => {
            console.error(error.message);
        });


        return response;
    } 
}