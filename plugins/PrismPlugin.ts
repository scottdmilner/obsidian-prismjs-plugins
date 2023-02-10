import { MarkdownPostProcessorContext } from "obsidian";

type ValueOf<T> = T[keyof T];
export declare type PrismObject = typeof import("prismjs");
export declare type PrismPluginObject = ValueOf<typeof import("prismjs/index").plugins>

export abstract class PrismPlugin /*<P extends PrismJSPlugin>*/ {
    readonly Prism: PrismObject;
    readonly PLUGIN_ID: string;
    readonly PLUGIN_JS: string
    script_el?: HTMLScriptElement;

    constructor(Prism: PrismObject, plugin_id: string, plugin_js: string) {
        this.Prism = Prism
        this.PLUGIN_ID = plugin_id
        this.PLUGIN_JS = plugin_js;
        
        this.inject()
            .then(this.configure);
    }

    configure(plugin: PrismPluginObject): void {}
    
    abstract markdownPostProcessor(element: HTMLElement, context: MarkdownPostProcessorContext | null): void;

    getPromiseHelper(resolve: (val: PrismPluginObject) => void) {
        if (this.Prism?.plugins?.[this.PLUGIN_ID])
            resolve(this.Prism.plugins[this.PLUGIN_ID]);
        else
            setTimeout(this.getPromiseHelper.bind(this, resolve), 100);
    }   


    get(): Promise<PrismPluginObject> {
        return new Promise(this.getPromiseHelper.bind(this));
    }

    inject(): PrismPluginObject {
        if (!this.script_el) {
            this.script_el = document.createElement('SCRIPT') as HTMLScriptElement;
            this.script_el.textContent = this.PLUGIN_JS;
            this.script_el.id = this.PLUGIN_ID;
            document.body.appendChild(this.script_el);
        }
        return this.get();
    }

    abstract purgeHTMLPre(pre: HTMLPreElement): void;

    remove(codeblocks: HTMLPreElement[]) {
        if (this.script_el) {
            document.body.removeChild(this.script_el);
            delete this.script_el;
            
            codeblocks.forEach(this.purgeHTMLPre);
        }

        delete this.Prism.plugins[this.PLUGIN_ID];
    }
}