import OpenAI from 'openai'
import {monitor} from '../dist/index.js'
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
    log_prompt: false,
    log_response: false
})

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

describe('Does the override of openai.chat.completions.create() work like the original function?', () => {
    

    test('Basic chat completion without streaming response', async () => {
        const result = await openai.chat.completions.create({
            messages: [{ role: 'user', content: "Say this is a test" }],
            model: 'gpt-4o',
        });
        
        expect(
            typeof result.choices[0].message.content
        ).toBe("string");
    });

    test('Chat completion with content array without streaming response', async () => {
        const result = await openai.chat.completions.create({
            messages: [{ role: 'user', content: [
                {
                    type: "text",
                    text: "Say this is a test"
                }
            ] }],
            model: 'gpt-4o',
        });
        
        expect(
            typeof result.choices[0].message.content
        ).toBe("string");
    });

    test('Chat completion with images attached without streaming response', async () => {
        const result = await openai.chat.completions.create({
            messages: [{ role: 'user', content: [
                {
                    type: "image_url",
                    image_url: {
                        "url": "https://www.shutterstock.com/image-vector/google-logo-editorial-vector-symbol-260nw-2317648589.jpg"
                    }
                    
                },
                {
                    type: "text",
                    text: "What logo do you see"
                },
                {
                    type: "image_url",
                    image_url: {
                        "url": "https://www.shutterstock.com/image-vector/google-logo-editorial-vector-symbol-260nw-2317648589.jpg"
                    }
                },
            ] }],
            model: 'gpt-4o',
        });
        
        expect(
            result
                .choices[0]
                .message
                .content
                .toLowerCase()
                .includes("google")
        ).toBe(true);
    });

   
    test('Chat completion with streaming response', async () => {
        const result = await openai.chat.completions.create({
            messages: [{ role: 'user', content: "Say this is a test" }],
            model: 'gpt-4o',
            stream: true
        });
        

        for await(const chunk of result){
            expect(typeof chunk.choices[0].delta.content)
                .toBe("string");
            break
        }
        
    });

    test('Chat completion with long streaming response', async () => {
        const result = await openai.chat.completions.create({
            messages: [{ role: 'user', content: "Tell me a very long story" }],
            model: 'gpt-4o',
            stream: true
        });
        
        let content = ""
        for await(const chunk of result){
            content += chunk.choices[0].delta.content
        }

        expect(
            content.length
        ).toBeGreaterThan(500);

        // how can i increase the timeout time? answer this question


    }, 60000);



    test('Image generation with dall-e-2', async () => {
        const result = await openai.images.generate({
            prompt: "a painting of a glass of water",
            model: 'dall-e-2',
            size: "1024x1024"
        });

        expect(
            typeof result.data[0].url
        ).toBe("string");
        
    }, 30000)

    test('Image generation with dall-e-3 in hd', async () => {
        const result = await openai.images.generate({
            prompt: "a painting of a glass of water in the middle of the ocean on a sunny day",
            model: 'dall-e-3',
            size: "1792x1024",
            quality: "hd"
        });

        expect(
            typeof result.data[0].url
        ).toBe("string");
        
    }, 60000)

    test('Image generation with dall-e-3', async () => {
        const result = await openai.images.generate({
            prompt: "a painting of a glass of water in the middle of the ocean on a sunny day",
            model: 'dall-e-3',
            size: "1024x1024",
        });

        expect(
            typeof result.data[0].url
        ).toBe("string");
        
    }, 30000)

    afterAll(async () => {
        // Wait for grafana logs and metrics to be sent
        await sleep(1500);
    });

});