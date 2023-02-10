import { PrismObject, PrismPlugin, PrismPluginObject } from "./PrismPlugin"

// @ts-ignore
import lineNumbersJs from './js-src/line-numbers.js.txt';

export default class lineNumbers extends PrismPlugin {
    constructor(prism: PrismObject) {
        super(prism, 'lineNumbers', lineNumbersJs);
    }

    override configure(lineNumbers: PrismPluginObject): void {
        lineNumbers.assumeViewportIndependence = false;
    }
} 