import OpenAI from 'openai'
import { monitor} from '../dist/index.js'
import "dotenv/config.js";
import { describe } from 'node:test';

import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";


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

describe('Working with structured outputs', () => {

    test('Simple structured output', async () => {

        const CalendarEvent = z.object({
            name: z.string(),
            date: z.string(),
            participants: z.array(z.string()),
        });

        const completion = await openai.beta.chat.completions.parse({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "Extract the event information." },
                { role: "user", content: "Alice and Bob are going to a science fair on Friday." },
            ],
            response_format: zodResponseFormat(CalendarEvent, "event"),
        });

        const event = completion.choices[0].message.parsed
        console.log(event, event.name, event.name != null)
        expect(event.name).not.toBe(null);
    });


    afterAll(async () => {
        // Wait for grafana logs and metrics to be sent
        await sleep(1500);
    });

});

