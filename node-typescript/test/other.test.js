import {
    getImageDimensions
} from '../dist/pricingTable/index.js'


describe('Other', () => {

    test('image size dimension', async () => {
        const dimensions = await getImageDimensions("https://img.freepik.com/free-vector/pentagram-background-with-treble-clef_23-2147677500.jpg?w=740&t=st=1722289092~exp=1722289692~hmac=abc9bf762a30fdcec85161c808d371af84973c1020bc8dc8be3eb96e6013605b");
        

        expect(
            dimensions.height
        ).toBe(740);
    
        expect(
            dimensions.width
        ).toBe(740);
    

    })

})