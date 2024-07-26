// import OpenAI from 'openai'
// import {monitor} from './dist/index.js'
// import "dotenv/config.js";




// const openai = new OpenAI({
//     apiKey: process.env.OPENAI_API_KEY,
// })

// monitor(openai, {
//     metrics_url: process.env.METRICS_URL,
//     logs_url: process.env.LOGS_URL,
//     metrics_username: Number(process.env.METRICS_USERNAME),
//     logs_username: Number(process.env.LOGS_USERNAME),
//     access_token: process.env.ACCESS_TOKEN,
//     log_prompt: false,
//     log_response: false
// })



// const result = await openai.chat.completions.create({
//     messages: [{ role: 'user', content: [
//         {
//             type: "text",
//             text: "Say this is a test"
//         }
//     ] }],
//     // messages: [{ role: 'user', content: 'Say this is a test' }],
//     // model: 'gpt-3.5-turbo',
//     model: 'gpt-4o',
//     stream: true
//     });

// console.log(result)

// for await(const chunk of result){
//     console.log(chunk.choices[0].delta.content)
// }
