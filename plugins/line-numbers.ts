import { PluginSetting, PrismObject, PrismPlugin, PrismPluginObject, PrismPluginSettings } from "./PrismPlugin"
import { MarkdownPostProcessorContext } from "obsidian";

// @ts-ignore
import lineNumbersJs from './js-src/line-numbers.js.txt';

interface lineNumbersSettings extends PrismPluginSettings {
    wrapLongLines: PluginSetting<boolean>;
}
export default class lineNumbers extends PrismPlugin {
    static override defaultSettings: lineNumbersSettings = {
        ...super.defaultSettings,
        wrapLongLines: {
            name: "Wrap long lines",
            desc: "Wrap long lines instead adding a horizontal scroll bar. This will always happen on PDF export.",
            value: false,
        },
    }

    override settings: lineNumbersSettings;

    constructor(Prism: PrismObject, settings: lineNumbersSettings) {
        super(Prism, 'lineNumbers', lineNumbersJs, settings);
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
            .filter((pre) => pre.children[0].tagName == 'CODE');
        
        codeblocks.forEach((pre) => {
            if(!pre.classList.contains('line-numbers'))
                pre.classList.add('line-numbers');
        });
        
        if (codeblocks.length)
            this.Prism.highlightAll();
    }
} 