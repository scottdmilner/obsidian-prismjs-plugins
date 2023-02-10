import { PrismObject, PrismPlugin, PrismPluginObject } from "./PrismPlugin"

// @ts-ignore
import lineNumbersJs from './js-src/line-numbers.js.txt';
import { MarkdownPostProcessorContext } from "obsidian";

export default class lineNumbers extends PrismPlugin {
    constructor(Prism: PrismObject) {
        super(Prism, 'lineNumbers', lineNumbersJs);
    }

    override configure(lineNumbers: PrismPluginObject): void {
        lineNumbers.assumeViewportIndependence = false;
    }

    override purgeHTMLPre(pre: HTMLPreElement): void {
        if (pre.classList.contains('line-numbers'))
            pre.classList.remove('line-numbers');
    }

    override markdownPostProcessor(element: HTMLElement, context: MarkdownPostProcessorContext | null): void {
        const codeblocks = Array.from(element.querySelectorAll('pre'))
            .filter(pre => pre.children[0].tagName == 'CODE');
        
        codeblocks.forEach(pre => {
            if(!pre.classList.contains('line-numbers'))
                pre.classList.add('line-numbers');
        });
        
        if (codeblocks.length)
            this.Prism.highlightAll();
    }
} 