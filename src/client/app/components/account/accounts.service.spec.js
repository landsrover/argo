import "mocha";
import { assert } from "chai";

import { AccountsService } from "./accounts.service";
import { SessionService } from "../session/session.service";

const { beforeEach, describe, it } = window;

describe("AccountsService", () => {
    const environment = "my environment";
    const token = "my token";
    const accountId = "my account id";

    beforeEach(() => {
        const apiAccount = "/api/account";
        const apiInstruments = "/api/instruments";

        /* eslint no-new:off */
        new AccountsService({});

        SessionService.setCredentials({
            environment,
            token,
            accountId
        });

        fetch.mock(apiAccount, {
            account: {
                currency: "USD",
                accountId: 7442890,
                balance: 110410.5028,
                marginAvailable: 110394.9676,
                marginCallMarginUsed: 18.1671,
                realizedPL: -1983.78,
                unrealizedPL: 2.6319
            }
        });

        fetch.mock(apiInstruments, [
            {
                displayName: "EUR/USD",
                name: "EUR_USD",
                maximumOrderUnits: "100000000",
                pipLocation: -4
            }
        ]);
    });

    it("getAccount", () => {
        const account = AccountsService.getAccount();

        assert.equal("{}", JSON.stringify(account));
    });

    it("getAccounts", () => {
        AccountsService.getAccounts({
            environment,
            token,
            accountId
        }).then(() => {
            const account = AccountsService.getAccount();

            assert.equal("USD", account.currency);
            assert.equal("7442890", account.accountId);
            assert.equal(110410.5028, account.balance);
            assert.equal(110394.9676, account.marginAvailable);
            assert.equal(18.1671, account.marginCallMarginUsed);
            assert.equal(-1983.78, account.realizedPL);
            assert.equal(2.6319, account.unrealizedPL);
            assert.equal(true, account.timestamp !== null);
            assert.equal(0.0023837406163863604, account.unrealizedPLPercent);
        });
    });
});
