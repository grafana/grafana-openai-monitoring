# grafana-openai-monitoring-with-streaming

This is a forked version of [grafana-openai-monitoring](https://www.npmjs.com/package/grafana-openai-monitoring). This library extends the chat_v2.monitor and supports requests with streaming response.

It's build in typescript and provides types

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


## Build
To build the library locally run following command. This generates a `/dist` folder

```bash
npm run build
```
