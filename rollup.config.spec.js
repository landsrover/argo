"use strict";

module.exports = {
    entry: "./src/client/app/root.module.spec.js",
    dest: "./build/app.bundle.spec.js",
    format: "iife",
    moduleName: "test",
    external: [
        "angular",
        "d3",
        "techan",
        "hyperHTML",
        "introspected",
        "mocha",
        "chai"
    ],
    globals: {
        angular: "angular",
        d3: "d3",
        techan: "techan",
        hyperHTML: "hyperHTML",
        introspected: "Introspected",
        mocha: "mocha",
        chai: "chai"
    }
};
