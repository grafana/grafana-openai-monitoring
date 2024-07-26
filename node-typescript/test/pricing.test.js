import {
    chatModelPrices,
    overwriteChatModelPrices,
    overwriteImageModelPrices,
    imageModelPrices

} from '../dist/pricingTable/index.js';




describe('Testing prices and overwrites', () => {
    

    test('Override chat model pricing of gpt4o', async () => {
        // const result = await openai.chat.completions.create({
        //     messages: [{ role: 'user', content: "Say this is a test" }],
        //     model: 'gpt-4o',
        // });
        
        // expect(
        //     typeof result.choices[0].message.content
        // ).toBe("string");
    });

    test('Override chat model pricing of dall-e-3', async () => {
        const beforePrice = imageModelPrices["dall-e-3"]["hd"]["1024x1792"];

        const otherPrice = imageModelPrices["dall-e-3"]["hd"]["1024x1024"];

        overwriteImageModelPrices({
            "dall-e-3": {
                "hd": {
                    "1024x1792": 0.0001
                }
            }
        });

        const afterPrice = imageModelPrices["dall-e-3"]["hd"]["1024x1792"];
        const newOtherPrice = imageModelPrices["dall-e-3"]["hd"]["1024x1024"];

        expect(
            beforePrice
        ).not.toBe(afterPrice);

        expect(
            afterPrice
        ).toBe(0.0001);

        expect(
            newOtherPrice
        ).toBe(otherPrice);
        
        // expect(
        //     typeof result.choices[0].message.content
        // ).toBe("string");
    });


    
})

