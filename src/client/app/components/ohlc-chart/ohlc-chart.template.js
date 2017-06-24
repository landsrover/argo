import * as d3 from "d3";
import techan from "techan";
import hyperHTML from "hyperHTML";

export class OhlcChartTemplate {

    static update(render) {
        return render`${hyperHTML.wire(render, "svg")`
            <span></span>`
        }`;
    }

    static redraw(state) {
        const chartEl = document.querySelector("ohlc-chart");

        if (state.data) {
            this.myInstrument = state.instrument;
            this.myGranularity = state.granularity;

            OhlcChartTemplate.drawChart(chartEl,
                state.data, state.trades, state.instrument);

            // this.lastData = state.ohlcInfo.data[state.ohlcInfo.data.length - 1];
            // this.lastClose = this.lastData.close;
            // this.feedVolume = this.lastData.volume;
            // this.lastHistUpdate = OhlcChartTemplate.getLastHistUpdate(this.myGranularity);
        }
    }

    static getLastHistUpdate(granularity, tick) {
        const time = tick && tick.time,
            now = time ? new Date(time) : new Date();

        let coeff;

        if (granularity === "S5") {
            coeff = 1000 * 5;
        } else if (granularity === "S10") {
            coeff = 1000 * 10;
        } else if (granularity === "S15") {
            coeff = 1000 * 15;
        } else if (granularity === "S30") {
            coeff = 1000 * 30;
        } else if (granularity === "M1") {
            coeff = 1000 * 60;
        } else if (granularity === "M2") {
            coeff = 1000 * 60 * 2;
        } else if (granularity === "M3") {
            coeff = 1000 * 60 * 3;
        } else if (granularity === "M4") {
            coeff = 1000 * 60 * 4;
        } else if (granularity === "M5") {
            coeff = 1000 * 60 * 5;
        } else if (granularity === "M10") {
            coeff = 1000 * 60 * 10;
        } else if (granularity === "M15") {
            coeff = 1000 * 60 * 15;
        } else if (granularity === "M30") {
            coeff = 1000 * 60 * 30;
        } else if (granularity === "H1") {
            coeff = 1000 * 60 * 60;
        } else if (granularity === "H2") {
            coeff = 1000 * 60 * 60 * 2;
        } else if (granularity === "H3") {
            coeff = 1000 * 60 * 60 * 3;
        } else if (granularity === "H4") {
            coeff = 1000 * 60 * 60 * 4;
        } else if (granularity === "H6") {
            coeff = 1000 * 60 * 60 * 6;
        } else if (granularity === "H8") {
            coeff = 1000 * 60 * 60 * 8;
        } else if (granularity === "H12") {
            coeff = 1000 * 60 * 60 * 12;
        } else {

            // for D / W / M
            coeff = 1000 * 60 * 60 * 12;
        }

        return Math.floor(+now / (coeff)) * coeff;
    }

    static drawChart(el, csv, trades, instrument) {
        const margin = {
                top: 0,
                right: 20,
                bottom: 30,
                left: 75
            },
            width = 960 - margin.left - margin.right,
            height = 400 - margin.top - margin.bottom;

        const x = techan.scale.financetime()
            .range([0, width]);

        const y = d3.scaleLinear()
            .range([height, 0]);

        const yVolume = d3.scaleLinear()
            .range([y(0), y(0.2)]);

        const ohlc = techan.plot.ohlc()
            .xScale(x)
            .yScale(y);

        const tradearrow = techan.plot.tradearrow()
            .xScale(x)
            .yScale(y)
            .orient(d => {
                const side = d.type.startsWith("buy") ? "up" : "down";

                return side;
            });

        const sma0 = techan.plot.sma()
            .xScale(x)
            .yScale(y);

        const sma0Calculator = techan.indicator.sma()
            .period(10);

        const sma1 = techan.plot.sma()
            .xScale(x)
            .yScale(y);

        const sma1Calculator = techan.indicator.sma()
            .period(20);

        const volume = techan.plot.volume()
            .accessor(ohlc.accessor())
            .xScale(x)
            .yScale(yVolume);

        const xAxis = d3.axisBottom(x);

        const yAxis = d3.axisLeft(y);

        const volumeAxis = d3.axisRight(yVolume)
            .ticks(3)
            .tickFormat(d3.format(",.3s"));

        const timeAnnotation = techan.plot.axisannotation()
            .axis(xAxis)
            .orient("bottom")
            .format(d3.timeFormat("%Y-%m-%d %H:%M"))
            .width(80)
            .translate([0, height]);

        const ohlcAnnotation = techan.plot.axisannotation()
            .axis(yAxis)
            .orient("left")
            .format(d3.format(",.4f"));

        const volumeAnnotation = techan.plot.axisannotation()
            .axis(volumeAxis)
            .orient("right")
            .width(35);

        const crosshair = techan.plot.crosshair()
            .xScale(x)
            .yScale(y)
            .xAnnotation(timeAnnotation)
            .yAnnotation([ohlcAnnotation, volumeAnnotation]);

        d3.select(el).select("svg").remove();

        const svg = d3.select(el).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                `translate(${margin.left}, ${margin.top})`);

        const defs = svg.append("defs")
            .append("clipPath")
            .attr("id", "ohlcClip");

        defs.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", width)
            .attr("height", height);

        const ohlcSelection = svg.append("g")
            .attr("class", "ohlc")
            .attr("transform", "translate(0,0)");

        ohlcSelection.append("g")
            .attr("class", "volume")
            .attr("clip-path", "url(#ohlcClip)");

        ohlcSelection.append("g")
            .attr("class", "candlestick")
            .attr("clip-path", "url(#ohlcClip)");

        ohlcSelection.append("g")
            .attr("class", "indicator sma ma-0")
            .attr("clip-path", "url(#ohlcClip)");

        ohlcSelection.append("g")
            .attr("class", "indicator sma ma-1")
            .attr("clip-path", "url(#ohlcClip)");

        ohlcSelection.append("g")
            .attr("class", "tradearrow");

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", `translate(0, ${height})`);

        svg
            .append("g")
            .attr("class", "y axis")
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("font-weight", "bold")
            .style("text-anchor", "end")
            .text(`Price (${this.myInstrument} / ${this.myGranularity})`);

        svg.append("g")
            .attr("class", "volume axis");

        svg.append("g")
            .attr("class", "crosshair ohlc");

        const data = d3.csvParse(csv).map(
            d => {
                const date = isNaN(Date.parse(d.Date))
                    ? new Date(+d.Date * 1000) : new Date(d.Date);

                return {
                    date,
                    open: +d.Open,
                    high: +d.High,
                    low: +d.Low,
                    close: +d.Close,
                    volume: +d.Volume
                };
            });

        svg.select("g.candlestick").datum(data);
        svg.select("g.sma.ma-0").datum(sma0Calculator(data));
        svg.select("g.sma.ma-1").datum(sma1Calculator(data));
        svg.select("g.volume").datum(data);

        redraw();

        function redraw() {
            const accessor = ohlc.accessor();

            x.domain(data.map(accessor.d));
            x.zoomable().domain([data.length - 130, data.length]);

            y.domain(techan.scale.plot.ohlc(
                data.slice(data.length - 130, data.length)).domain());
            yVolume.domain(techan.scale.plot.volume(
                data.slice(data.length - 130, data.length)).domain());

            svg.select("g.x.axis").call(xAxis);
            svg.select("g.y.axis").call(yAxis);
            svg.select("g.volume.axis").call(volumeAxis);

            svg.select("g.candlestick").datum(data).call(ohlc);
            svg.select("g.tradearrow").remove();
            svg.append("g").attr("class", "tradearrow");

            const myTrades = trades.filter(
                trade => trade.instrument === instrument)
                .map(
                    trade => ({
                        date: new Date(trade.openTime),
                        type: trade.currentUnits > 0 ? "buy" : "sell",
                        price: trade.price
                    })
                );

            svg.select("g.tradearrow").datum(myTrades).call(tradearrow);

            svg.select("g.sma.ma-0")
                .datum(sma0Calculator(data)).call(sma0);
            svg.select("g.sma.ma-1")
                .datum(sma1Calculator(data)).call(sma1);

            svg.select("g.volume").datum(data).call(volume);

            svg.select("g.crosshair.ohlc").call(crosshair);
        }

        return redraw;
    }

}
