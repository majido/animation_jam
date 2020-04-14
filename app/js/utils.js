

export function $(/* args */) {
    let root = document;
    let query = arguments[0];
    if (arguments[0] instanceof Element || arguments[0] instanceof DocumentFragment) {
        root = arguments[0];
        query = arguments[1];
    }
    return root.querySelector(query);
}

export function svg(type) {
    return document.createElementNS('http://www.w3.org/2000/svg', type);
}