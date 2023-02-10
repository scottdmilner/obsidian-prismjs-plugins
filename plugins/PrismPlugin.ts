type ValueOf<T> = T[keyof T];
export declare type PrismObject = typeof import("prismjs");
export declare type PrismPluginObject = ValueOf<typeof import("prismjs/index").plugins>

export abstract class PrismPlugin /*<P extends PrismJSPlugin>*/ {
    readonly prism: PrismObject;
    readonly PLUGIN_ID: string;
    readonly PLUGIN_JS: string

    constructor(prism: PrismObject, plugin_id: string, plugin_js: string) {
        this.prism = prism
        this.PLUGIN_ID = plugin_id
        this.PLUGIN_JS = plugin_js;
        
        this.inject()
            .then(this.configure);
    }

    getPromiseHelper(resolve: (val: PrismPluginObject) => void) {
        if (this.prism?.plugins?.[this.PLUGIN_ID])
            resolve(this.prism.plugins[this.PLUGIN_ID]);
        else
            setTimeout(this.getPromiseHelper.bind(this, resolve), 100);
    }   

    abstract configure(plugin: PrismPluginObject): void;

    get(): Promise<PrismPluginObject> {
        return new Promise(this.getPromiseHelper.bind(this));
    }

    inject(): PrismPluginObject {
        if (!document.getElementById(this.PLUGIN_ID)) {
            const script = document.createElement('SCRIPT');
            script.textContent = this.PLUGIN_JS;
            script.id = this.PLUGIN_ID;
            document.body.appendChild(script);
        }
        return this.get();
    }

    remove(): boolean {
        const script = document.getElementById(this.PLUGIN_ID);
        if (script) {
            document.removeChild(script);
            return true;
        }
        return false;
    }
}