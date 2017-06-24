import { Hyper } from "../../util";
import { QuotesService } from "../quotes/quotes.service";
import { SlChartTemplate } from "./sl-chart.template";

class SlChartElement extends Hyper {
    static get observedAttributes() {
        return ["data-quote"];
    }

    constructor() {
        super();

        this.state = {
            instrument: this.dataset.instrument,
            quotes: QuotesService.getQuotes(),
            length: 100
        };
    }

    render() {
        return SlChartTemplate.update(this.hyper);
    }

    attributeChangedCallback() {
        SlChartTemplate.redraw(this.state);
    }

}
customElements.define("sl-chart", SlChartElement);
