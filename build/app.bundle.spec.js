(function (mocha,chai,hyperHTML) {
'use strict';

hyperHTML = hyperHTML && 'default' in hyperHTML ? hyperHTML['default'] : hyperHTML;

class Util {
    static query(selector) {
        return document.querySelector(selector) ||
            console.error(selector, "not found");
    }

    static handleEvent(context, e, payload) {
        const type = e.type;
        const id = e.target.id || console.warn(e.target, "target without id");
        const method = `on${id[0].toUpperCase()}${id.split("-")[0].slice(1)}` +
            `${type[0].toUpperCase()}${type.slice(1)}`;


        return method in context ? context[method](e, payload)
            : console.warn(method, "not implemented");
    }

    static renderEmpty(render) {
        return render`${hyperHTML.wire(render, ":empty")``}`;
    }

    static getHHMMSSfromDate(date) {
        if (!date) {
            return "";
        }

        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        const seconds = date.getSeconds().toString().padStart(2, "0");

        return `${hours}:${minutes}:${seconds}`;
    }

    static formatDate(date) {
        if (!date || !date.toString()) {
            return "";
        }

        return (new Date(date)).toLocaleString("en-US", {
            month: "short",
            day: "2-digit",
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
    }

    static formatNumber(num, decimals = 0) {
        if (!num || !num.toString()) {
            return "";
        }

        return parseFloat(num).toFixed(decimals);
    }

    static fetch(url, options) {
        options.headers = options.headers ||
            { "Content-Type": "application/json" };

        options.body = typeof options.body === "string" ? options.body
            : JSON.stringify(options.body);

        const fetchCall = fetch(url, options);

        Util.spinnerState.isLoadingView = true;
        fetchCall.then(() => {
            Util.spinnerState.isLoadingView = false;
        }).catch(() => {
            Util.spinnerState.isLoadingView = false;
        });

        return fetchCall;
    }

    static show(condition) {
        return condition ? "display: block;" : "display: none;";
    }

    static hide(condition) {
        return Util.show(!condition);
    }
}

Util.spinnerState = {};

class SessionService {
    static setCredentials(session) {
        SessionService.credentials.environment = session.environment;
        SessionService.credentials.token = session.token;
        SessionService.credentials.accountId = session.accountId;
    }

    static isLogged() {
        if (SessionService.credentials.token) {
            return SessionService.credentials;
        }

        return null;
    }
}

SessionService.credentials = {
    environment: null,
    token: null,
    accountId: null
};

class AccountsService {
    constructor(account) {
        if (!AccountsService.account) {
            AccountsService.account = account;
        }
    }

    static getAccount() {
        return AccountsService.account;
    }

    static refresh() {
        const credentials = SessionService.isLogged();

        if (!credentials) {
            return;
        }

        AccountsService.getAccounts({
            environment: credentials.environment,
            token: credentials.token,
            accountId: credentials.accountId
        });
    }

    static getAccounts({
        environment = "practice",
        token = "abc",
        accountId = null
    } = {}) {
        const api = accountId ? "/api/account" : "/api/accounts";

        return Util.fetch(api, {
            method: "post",
            body: JSON.stringify({
                environment,
                token,
                accountId
            })
        }).then(res => res.json()).then(data => {
            const accounts = data.accounts || data;

            if (data.message) {
                throw data.message;
            }

            if (!accounts.length) {
                Object.assign(AccountsService.account, data.account);

                AccountsService.account.timestamp = new Date();

                AccountsService.account.unrealizedPLPercent =
                    AccountsService.account.unrealizedPL /
                        AccountsService.account.balance * 100;

                if (JSON.stringify(AccountsService.account.instruments) === "{}") {
                    Util.fetch("/api/instruments", {
                        method: "post",
                        body: JSON.stringify({
                            environment,
                            token,
                            accountId
                        })
                    }).then(res => res.json()).then(instruments => {
                        AccountsService.account.instruments = instruments;
                        AccountsService.account.pips = {};
                        AccountsService.account.instruments.forEach(i => {
                            AccountsService.account.pips[i.name] =
                                Math.pow(10, i.pipLocation);
                        });
                    });
                }
            }

            return accounts;
        });
    }

    static setStreamingInstruments(settings) {
        AccountsService.account.streamingInstruments = Object.keys(settings)
            .filter(el => !!settings[el]);

        return AccountsService.account.streamingInstruments;
    }
}

AccountsService.account = null;

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

        chai.assert.equal("{}", JSON.stringify(account));
    });

    it("getAccounts", () => {
        AccountsService.getAccounts({
            environment,
            token,
            accountId
        }).then(() => {
            const account = AccountsService.getAccount();

            chai.assert.equal("USD", account.currency);
            chai.assert.equal("7442890", account.accountId);
            chai.assert.equal(110410.5028, account.balance);
            chai.assert.equal(110394.9676, account.marginAvailable);
            chai.assert.equal(18.1671, account.marginCallMarginUsed);
            chai.assert.equal(-1983.78, account.realizedPL);
            chai.assert.equal(2.6319, account.unrealizedPL);
            chai.assert.equal(true, account.timestamp !== null);
            chai.assert.equal(0.0023837406163863604, account.unrealizedPLPercent);
        });
    });
});

class ActivityService {
    constructor(activities) {
        if (!ActivityService.activities) {
            ActivityService.activities = activities;
        }
    }

    static refresh() {
        const credentials = SessionService.isLogged();

        if (!credentials) {
            return null;
        }

        const account = AccountsService.getAccount(),
            lastTransactionID = account.lastTransactionID;

        return Util.fetch("/api/transactions", {
            method: "post",
            body: JSON.stringify({
                environment: credentials.environment,
                token: credentials.token,
                accountId: credentials.accountId,
                lastTransactionID
            })
        }).then(res => res.json()).then(data => {
            ActivityService.activities.length = 0;
            data.reverse().forEach(activity => {
                ActivityService.activities.push(activity);
            });
        }).catch(err => err.data);
    }

    static addActivity(activity) {
        ActivityService.activities.splice(0, 0, {
            id: activity.id,
            type: activity.type,
            instrument: activity.instrument,
            units: activity.units,
            price: activity.price,
            pl: activity.pl,
            accountBalance: activity.accountBalance,
            time: activity.time
        });
    }
}

ActivityService.activities = null;

const { beforeEach: beforeEach$1, describe: describe$1, it: it$1 } = window;

describe$1("ActivityService", () => {
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

    beforeEach$1(() => {
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

    it$1("getActivities", () => {
        let activities;

        ActivityService.refresh().then(() => {
            activities = ActivityService.activities;

            chai.assert.lengthOf(activities, 1);

            chai.assert.equal("176403879", activities[0].id);
            chai.assert.equal("MARKET_ORDER_CREATE", activities[0].type);
            chai.assert.equal("EUR_USD", activities[0].instrument);
            chai.assert.equal("2", activities[0].units);
            chai.assert.equal("1.25325", activities[0].price);
            chai.assert.equal("0", activities[0].interest);
            chai.assert.equal("0", activities[0].pl);
            chai.assert.equal("100000", activities[0].accountBalance);
            chai.assert.equal("2014-04-07T18:31:05Z", activities[0].time);
        });
    });

    it$1("addActivity", () => {
        chai.expect(() => {
            ActivityService.addActivity(activity);
        }).to.not.throw(TypeError);
    });
});

class TradesService {
    constructor(trades) {
        if (!TradesService.trades) {
            TradesService.trades = trades;
        }
    }

    static getTrades() {
        return TradesService.trades;
    }

    static refresh() {
        const credentials = SessionService.isLogged();

        if (!credentials) {
            return;
        }

        Util.fetch("/api/trades", {
            method: "post",
            body: JSON.stringify({
                environment: credentials.environment,
                token: credentials.token,
                accountId: credentials.accountId
            })
        }).then(res => res.json()).then(data => {
            TradesService.trades.splice(0, TradesService.trades.length);

            data.forEach(trade => {
                trade.side = trade.currentUnits > 0 ? "buy" : "sell";
                TradesService.trades.push(trade);
            });
        });
    }

    static closeTrade(id) {
        const credentials = SessionService.isLogged();

        if (!credentials) {
            return null;
        }

        return Util.fetch("/api/closetrade", {
            method: "post",
            body: JSON.stringify({
                environment: credentials.environment,
                token: credentials.token,
                accountId: credentials.accountId,
                id
            })
        }).then(res => res.json()).then(data => data)
            .catch(err => err.data);
    }

    static updateTrades(tick) {
        const account = AccountsService.getAccount(),
            pips = account.pips;

        TradesService.trades.forEach((trade, index) => {
            let current,
                side;

            if (trade.instrument === tick.instrument) {
                side = trade.currentUnits > 0 ? "buy" : "sell";

                if (side === "buy") {
                    current = tick.bid;
                    TradesService.trades[index].profitPips =
                        ((current - trade.price) / pips[trade.instrument]);
                }
                if (side === "sell") {
                    current = tick.ask;
                    TradesService.trades[index].profitPips =
                        ((trade.price - current) / pips[trade.instrument]);
                }

                TradesService.trades[index].current = current;
            }
        });
    }
}

TradesService.trades = null;

class ExposureService {
    constructor(exposure) {
        if (!ExposureService.exposure) {
            ExposureService.exposure = exposure;
        }
    }

    static getExposure() {
        return ExposureService.exposure;
    }

    static refresh() {
        const credentials = SessionService.isLogged();

        if (!credentials) {
            return;
        }

        const trades = TradesService.getTrades(),
            exps = {};

        trades.forEach(trade => {
            const legs = trade.instrument.split("_");

            exps[legs[0]] = exps[legs[0]] || 0;
            exps[legs[1]] = exps[legs[1]] || 0;

            exps[legs[0]] += parseInt(trade.currentUnits, 10);
            exps[legs[1]] -= trade.currentUnits * trade.price;
        });

        ExposureService.exposure.splice(0, ExposureService.exposure.length);
        Object.keys(exps).forEach(exp => {
            const type = exps[exp] > 0;

            ExposureService.exposure.push({
                type: type ? "Long" : "Short",
                market: exp,
                units: Math.abs(exps[exp])
            });
        });

    }
}

ExposureService.exposure = null;

const { beforeEach: beforeEach$2, describe: describe$2, it: it$2 } = window;

describe$2("Exposure", () => {

    beforeEach$2(() => {
        /* eslint no-new:off */
        new ExposureService([]);
    });

    it$2("test", () => {
        const exposures = ExposureService.exposure;

        chai.assert.lengthOf(exposures, 3);

        chai.assert.equal("EUR", exposures[0].market);
        chai.assert.equal("100", exposures[0].units);
        chai.assert.equal("Long", exposures[0].type);

        chai.assert.equal("USD", exposures[1].market);
        chai.assert.equal("417.01", exposures[1].units);
        chai.assert.equal("Short", exposures[1].type);

        chai.assert.equal("GPB", exposures[2].market);
        chai.assert.equal("200", exposures[2].units);
        chai.assert.equal("Long", exposures[2].type);
    });
});

document.body.appendChild(document.createElement("root"));

(function(self) {
    const responses = {};

    function mockResponse(
        body = {},
        headers = { "Content-type": "application/json" }) {

        return Promise.resolve(new Response(JSON.stringify(body), {
            status: 200,
            headers: new Headers(headers)
        }));
    }

    self.fetch = url => {
        if (url in responses) {
            return mockResponse(responses[url]);
        }

        return mockResponse();
    };

    self.fetch.mock = (api, data) => {
        responses[api] = data;
    };
}(typeof self !== "undefined" ? self : window));

}(mocha,chai,hyperHTML));
