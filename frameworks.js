class Framework {
    constructor(name, options) {
        this.name = name;
        this.options = options;
    }
}

// const P5JS_FRAMEWORK = "p5.js";
const frameworks = [
    new Framework("Arduino", { varDef: "int" }),
    new Framework("Processing", { varDef: "float" }),
    new Framework("p5.js", { varDef: "let", hasClamp: true }),
];
let framework = frameworks[2];
// let frameworkName = P5JS_FRAMEWORK;

function createFrameworkSelector() {
    createDiv("Framework")
        .position(20, OFFSET.y)
        .style("color", "white")
        .style("font-size", "26px");
    let frameworkSel = createSelect().position(20, OFFSET.y + 40);
    frameworks.forEach(({ name }) => frameworkSel.option(name));
    frameworkSel.selected(framework.name);
    frameworkSel.changed(() => {
        const name = frameworkSel.value();
        framework = frameworks.find(({ name: s }) => s === name);
        if (framework.options.hasClamp) clampCheckbox.show();
        else clampCheckbox.hide();
    });
}
