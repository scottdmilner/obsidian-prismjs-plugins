declare type ValueOf<T> = T[keyof T];
export declare type PrismObject = typeof import("prismjs");
export declare type PrismPluginObject = ValueOf<typeof import("prismjs/index").plugins>
export declare type PrismPluginType = (new (prism: PrismObject, settings: PrismPluginSettings) => PrismPlugin) & {defaultSettings: PrismPluginSettings};

import { MarkdownPostProcessorContext } from "obsidian";

export interface PluginSetting<T> {
    name: string;
    desc: string;
    value: T;
}
export interface PrismPluginSettings {
    enabled: PluginSetting<boolean>;
}

export abstract class PrismPlugin {
    static defaultSettings: PrismPluginSettings = {
        enabled: {
            name: "Line Numbers",
            desc: "Enable/disable line numbers on code blocks",
            value: false,
        },
    }
    
    readonly Prism: PrismObject;
    readonly PLUGIN_ID: string;
    readonly PLUGIN_JS: string;
    settings: PrismPluginSettings;
    script_el?: HTMLScriptElement;

    constructor(Prism: PrismObject, plugin_id: string, plugin_js: string, settings: PrismPluginSettings) {
        this.Prism = Prism;
        this.PLUGIN_ID = plugin_id
        this.PLUGIN_JS = plugin_js;
        this.settings = settings;
        
        if (this.settings.enabled.value) {
            this.inject()
            .then(this.configure)
            .then(this.markdownPostProcessor(document.body, null));
        }
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

    remove(codeblocks?: HTMLPreElement[]) {
        if (codeblocks == null)
            codeblocks = Array.from(document.body.querySelectorAll('pre'))
                .filter((pre) => pre.children[0].tagName == 'CODE');
        
        if (this.script_el) {
            document.body.removeChild(this.script_el);
            delete this.script_el;
            
            codeblocks.forEach(this.purgeHTMLPre);
            if (codeblocks.length)
                this.Prism.highlightAll();
        }

        delete this.Prism.plugins[this.PLUGIN_ID];
    }

    updateSettings(settings: PrismPluginSettings) {
        this.settings = settings;
        if (this.settings.enabled.value) {
            this.inject()
            .then(this.configure)
            .then(this.markdownPostProcessor(document.body, null));
        }
        else {
            this.remove();
        }
    }
}
