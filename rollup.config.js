"use strict";

module.exports = {
    entry: "./src/client/app/root.module.js",
    dest: "./build/app.bundle.js",
    format: "iife",
    moduleName: "app",
    external: [
        "angular",
        "d3",
        "techan",
        "hyperHTML",
        "introspected"
    ],
    globals: {
        angular: "angular",
        d3: "d3",
        techan: "techan",
        hyperHTML: "hyperHTML",
        introspected: "Introspected"
    }
};
