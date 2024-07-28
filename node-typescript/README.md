# grafana-openai-monitoring-with-streaming

This is a forked version of [grafana-openai-monitoring](https://www.npmjs.com/package/grafana-openai-monitoring). This library extends the chat_v2.monitor and supports requests with streaming response.

It's build in typescript and provides types

This library currently tracks 
- `openai.chat.completions.create`
- `openai.images.generate`

## Installation

```bash
npm install grafana-openai-monitoring-with-streaming
```

## Usage

```js
import { monitor } from 'grafana-openai-monitoring-with-streaming/dist'
import OpenAI from 'openai'

const openai = new OpenAI({
    // ...
});

monitor(openai, {
    metrics_url: 'https://...',
    logs_url: 'https://...',
    metrics_username: 12345,
    logs_username: 12345,
    access_token: "...",

    // Log the user's prompt in grafana (default true)
    log_prompt: true,
    // Log the user's response in grafana (default true)
    log_response: true
    // Setting this to false logs "no data" as value 
});


// Example without streaming

const result = await openai.chat.completions.create({
    messages: [{ role: 'user', content: 'Say this is a test' }],
    model: 'gpt-3.5-turbo',
});

console.log(result)


// Example with streaming

const result = await openai.chat.completions.create({
    messages: [{ role: 'user', content: 'Say this is a test' }],
    model: 'gpt-3.5-turbo',
    stream: true
});


for await(const chunk of result){
    console.log(chunk.choices[0].delta.content)
}
```


## Overwrite model pricing

```js

monitor(openai, {
    metrics_url: 'https://...',
    logs_url: 'https://...',
    metrics_username: 12345,
    logs_username: 12345,
    access_token: "...",
    log_prompt: true,
    log_response: true,

    // Default {}
    overwrite_chat_model_price: {
        "gpt-4o": [10, 30], // Instead of 5/15 for In/Out per million

        // Include new models
        "new-gpt-model": [0.1, 0.1] // In case there is a new model and not added yet
    },

    // Default {}
    overwrite_image_model_price: {
        // Model
        "dall-e-3": {
            // Quality "hd" or "standard"
            "hd": {
                // Size
                "1024x1024": 0.04
            }
        }
    }

});

```



## Build
To build the library locally run following command. This generates a `/dist` folder

```bash
npm run build
```
