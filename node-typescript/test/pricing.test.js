import {
    chatModelPrices,
    overwriteChatModelPrices,
    overwriteImageModelPrices,
    imageModelPrices,
    calculateVisionModelCostDetail,
    calculateVisionCostForImages

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



    test('Vision model price calculation', async () => {

        // const fixedCost = 85; // Fixed Cost extracted from the image
        // const tileCost = 170; // Tile Cost extracted from the image
        // const millionTokenPrice = 5; // Price per million tokens
        // const numDecimals = 6; // Number of decimals for the final price

        
        expect(
            calculateVisionModelCostDetail(150, 150).totalPrice
        ).toBe(0.001275);


        expect(
            calculateVisionModelCostDetail(1500, 150).totalPrice
        ).toBe(0.002975);

        expect(
            calculateVisionModelCostDetail(3000, 3000).totalPrice
        ).toBe(0.003825);
    })

    test('Vision model price calculation based on images', async () => {


        let images = [
            "https://img.freepik.com/free-vector/pentagram-background-with-treble-clef_23-2147677500.jpg?w=740&t=st=1722289092~exp=1722289692~hmac=abc9bf762a30fdcec85161c808d371af84973c1020bc8dc8be3eb96e6013605b",
            "https://img.freepik.com/free-vector/pentagram-background-with-treble-clef_23-2147677500.jpg?w=740&t=st=1722289092~exp=1722289692~hmac=abc9bf762a30fdcec85161c808d371af84973c1020bc8dc8be3eb96e6013605b",
            "https://img.freepik.com/free-vector/pentagram-background-with-treble-clef_23-2147677500.jpg?w=740&t=st=1722289092~exp=1722289692~hmac=abc9bf762a30fdcec85161c808d371af84973c1020bc8dc8be3eb96e6013605b",
        ]

        let result = await calculateVisionCostForImages(images);


        expect(
            Math.abs(result - 0.011475)
        ).toBeLessThan(1e-10);
    })


    


    
})

