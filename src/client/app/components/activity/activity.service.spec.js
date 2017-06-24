import "mocha";
import { assert, expect } from "chai";

import { ActivityService } from "./activity.service";
import { SessionService } from "../session/session.service";

const { beforeEach, describe, it } = window;

describe("ActivityService", () => {
    const environment = "my environment";
    const token = "my token";
    const accountId = "my account id";
    const activity = {
        id: 176403879,
        accountId: 6765103,
        time: "2014-04-07T18:31:05Z",
        type: "MARKET_ORDER_CREATE",
        instrument: "EUR_USD",
        units: 2,
        side: "buy",
        price: 1.25325,
        pl: 0,
        interest: 0,
        accountBalance: 100000,
        tradeOpened: {
            id: 176403879,
            units: 2
        }
    };

    beforeEach(() => {
        const apiTransactions = "/api/transactions";

        /* eslint no-new:off */
        new ActivityService([]);

        SessionService.setCredentials({
            environment,
            token,
            accountId
        });

        fetch.mock(apiTransactions, [activity]);
    });

    it("getActivities", () => {
        let activities;

        ActivityService.refresh().then(() => {
            activities = ActivityService.activities;

            assert.lengthOf(activities, 1);

            assert.equal("176403879", activities[0].id);
            assert.equal("MARKET_ORDER_CREATE", activities[0].type);
            assert.equal("EUR_USD", activities[0].instrument);
            assert.equal("2", activities[0].units);
            assert.equal("1.25325", activities[0].price);
            assert.equal("0", activities[0].interest);
            assert.equal("0", activities[0].pl);
            assert.equal("100000", activities[0].accountBalance);
            assert.equal("2014-04-07T18:31:05Z", activities[0].time);
        });
    });

    it("addActivity", () => {
        expect(() => {
            ActivityService.addActivity(activity);
        }).to.not.throw(TypeError);
    });
});
