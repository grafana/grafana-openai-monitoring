import OpenAI from 'openai'
import {getInputTextFromMessages, getTextContentFromMessage, monitor, tokenCount} from '../dist/index.js'
import "dotenv/config.js";
import { calculateCostChatModel } from '../dist/pricingTable/pricingChatModels.js';
import fs from 'fs';
import { describe } from 'node:test';



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
    log_response: false,
    
})

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


describe('Does the override of openai.images.XXX() work like the original function?', () => {
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
            quality: "standard"
        });

        expect(
            typeof result.data[0].url
        ).toBe("string");
        
    }, 30000)

    test('Create image variation', async () => {
       
        const result2 = await openai.images.createVariation({
            image: fs.createReadStream("test/test.png"),
            model: 'dall-e-2'
        });

        expect(
            typeof result2.data[0].url
        ).toBe("string");
        
    }, 30000)

    test('Create image edit', async () => {
       
        const result2 = await openai.images.edit({
            image: fs.createReadStream("test/cat.png"),
            mask: fs.createReadStream("test/cat-mask.png"),
            prompt: "cat",
            model: 'dall-e-2'
        });

        
        expect(
            typeof result2.data[0].url
        ).toBe("string");
        
    }, 30000)

    afterAll(async () => {
        // Wait for grafana logs and metrics to be sent
        await sleep(1500);
    });
})