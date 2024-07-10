// import { assertEquals } from "jsr:@std/assert";
// import { monitor } from '../src/index.ts'

// import OpenAI from 'https://deno.land/x/openai@v4.52.3/mod.ts';

// import { config } from "https://deno.land/x/dotenv@v3.2.2/mod.ts";
// const env = config({

// });

import OpenAI from 'openai'
import {monitor} from './dist/index.js'
import "dotenv/config.js";




const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

monitor(openai, {
    metrics_url: process.env.METRICS_URL,
    logs_url: process.env.LOGS_URL,
    metrics_username: Number(process.env.METRICS_USERNAME),
    logs_username: Number(process.env.LOGS_USERNAME),
    access_token: process.env.ACCESS_TOKEN,
})



const result = await openai.chat.completions.create({
    messages: [{ role: 'user', content: [
        {
            type: "text",
            text: "Say this is a test"
        }
    ] }],
    // messages: [{ role: 'user', content: 'Say this is a test' }],
    model: 'gpt-3.5-turbo',
    stream: true
    });

console.log(result)

for await(const chunk of result){
    console.log(chunk.choices[0].delta.content)
}

// const result = await openai.chat.completions.create({
//     messages: [{ role: 'user', content: 'Say this is a test' }],
//     model: 'gpt-3.5-turbo',
// });

// console.log(result)

// Deno.test(async function chatCompletionTest() {
//     const result = await openai.chat.completions.create({
//         messages: [{ role: 'user', content: 'Say this is a test' }],
//         model: 'gpt-3.5-turbo',
//       });
      
//     console.log(result)
//     await new Promise(resolve => setTimeout(resolve, 2000));
//     assertEquals(1,1)
// });

// Deno.test(async function chatCompletionTestWithStrean() {
//     const result = await openai.chat.completions.create({
//         messages: [{ role: 'user', content: 'Tell me a story' }],
//         model: 'gpt-3.5-turbo',
//         stream: true
//       });
    
//     console.log(result)

//     let response = ""
//     for await(const chunk of result){
//         response += chunk.choices[0].delta.content
//     }
//     console.log(response)
//     await new Promise(resolve => setTimeout(resolve, 2000));
//     assertEquals(1,1)
// });