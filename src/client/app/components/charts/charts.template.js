import hyperHTML from "hyperHTML";

import { Util } from "../../util";

export class ChartsTemplate {
    static update(render, state, events) {
        if (!Object.keys(state.account.streamingInstruments).length) {
            Util.renderEmpty(render);
            return;
        }

        /* eslint-disable indent */
        render`
            <div class="flex flex-wrap flex-row justify-center justify-around mb2">
                <select id="chartInstrument" onchange="${e => events(e, {
                        instrument: e.target.value.trim(),
                        granularity: state.selectedGranularity
                    })}">${

                    state.account.streamingInstruments.map(instrument => hyperHTML.wire()`
                    <option value="${instrument}" selected="${state.selectedInstrument === instrument}">
                        ${instrument}
                    </option>
                `)}</select>

                <select id="chartGranularity" onchange="${e => events(e, {
                        instrument: state.selectedInstrument,
                        granularity: e.target.value.trim()
                    })}">${

                    state.granularities.map(granularity => hyperHTML.wire()`
                    <option value="${granularity}" selected="${state.selectedGranularity === granularity}">
                        ${granularity}
                    </option>
                `)}</select>

                <a class="f5 no-underline black bg-animate hover-bg-black hover-white inline-flex items-center pa3 ba border-box mr4">
                    <span id="openOrderDialogBuy" class="pointer pl1"
                        onclick="${events}">Buy</span>
                </a>
                <a class="f5 no-underline black bg-animate hover-bg-black hover-white inline-flex items-center pa3 ba border-box mr4">
                    <span id="openOrderDialogSell" class="pointer pl1"
                        onclick="${events}">Sell</span>
                </a>
            </div>

            <ohlc-chart class="dn-s"
                data-instrument="${state.selectedInstrument}"
                data-granularity="${state.selectedGranularity}"
                data-data="${state.ohlcInfo.data}"
                feed="${state.ohlcInfo.feed}"
                trades="${state.ohlcInfo.trades}">
            </ohlc-chart>

            <order-dialog></order-dialog>
        `;
        /* eslint-enable indent */
    }
}
