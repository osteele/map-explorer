const referenceUrls = [
    [
        "https://www.arduino.cc/reference/en/language/functions/math/map/",
        "Arduino reference",
    ],
    ["https://processing.org/reference/map_.html", "Processing reference"],
    ["https://p5js.org/reference/#/p5/map", "p5.js reference"],
];

function createFooter(top) {
    createReferenceLinks(top);
    createA("https://github.com/osteele/map-explorer", "Edit on GitHub")
        .position(width - 110, top + 40)
        .style('color', 'gray')
}

function createReferenceLinks(y) {
    for (let [href, title] of referenceUrls) {
        createA(href, title, "map-reference")
            .position(20, y)
            .style("color", "gray");
        y += 20;
    }
}
