import "mocha";
import { assert } from "chai";

import { ExposureService } from "./exposure.service";

const { beforeEach, describe, it } = window;

class TradeService {
    static getTrades() {
        return [
            {
                instrument: "EUR_USD",
                currentUnits: 100,
                price: 1.2345
            },
            {
                instrument: "GPB_USD",
                currentUnits: 200,
                price: 1.4678
            }
        ];

    }
}

TradeService.exposure = null;

describe("Exposure", () => {

    beforeEach(() => {
        /* eslint no-new:off */
        new ExposureService([]);
    });

    it("test", () => {
        const exposures = ExposureService.exposure;

        assert.lengthOf(exposures, 3);

        assert.equal("EUR", exposures[0].market);
        assert.equal("100", exposures[0].units);
        assert.equal("Long", exposures[0].type);

        assert.equal("USD", exposures[1].market);
        assert.equal("417.01", exposures[1].units);
        assert.equal("Short", exposures[1].type);

        assert.equal("GPB", exposures[2].market);
        assert.equal("200", exposures[2].units);
        assert.equal("Long", exposures[2].type);
    });
});
