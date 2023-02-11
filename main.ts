import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import lineNumbers from 'plugins/line-numbers';
import { PrismObject, PrismPlugin, PrismPluginSettings, PrismPluginType } from 'plugins/PrismPlugin';

const pluginIndex: Record<string, PrismPluginType> = {
	"lineNumbers": lineNumbers,
}

interface PrismJSPluginsSettings {
	plugins: Record<string, PrismPluginSettings>;
}

const DEFAULT_SETTINGS: PrismJSPluginsSettings = { 
	plugins: {}
};
Object.entries(pluginIndex).forEach(([plugin_id, plugin]) => {
	DEFAULT_SETTINGS.plugins[plugin_id] = plugin.defaultSettings;
});

export default class PrismJSPlugins extends Plugin {
	static getPrism(): Promise<PrismObject> {
		const getPrism = (resolve: (val: PrismObject) => void) => {
			if (global?.Prism)  resolve(global.Prism);
			else                setTimeout(getPrism.bind(getPrism, resolve), 100);
		}
		return new Promise(getPrism);
	}

	static highlightAll() {
		PrismJSPlugins.getPrism()
		.then((Prism) => Prism.highlightAll());
	}

	settings: PrismJSPluginsSettings;
	plugins: Record<string, PrismPlugin> = {};

	override async onload() {
		await this.loadSettings();
		this.addSettingTab(new PrismJSPluginsSettingTab(this.app, this));

		// load plugins
		PrismJSPlugins.getPrism()
		.then((Prism) => {
			Object.entries(pluginIndex).forEach(([plugin_id, plugin]) => {
				this.plugins[plugin_id] = new plugin(Prism, this.settings.plugins[plugin_id]);
			});
			return Promise.all(Object.values(this.plugins).map((p) => p.get()));
		})
		.then(() => this.registerMarkdownPostProcessor((el, ctx) => 
			Object.values(this.plugins).forEach((plugin) => plugin.markdownPostProcessor(el, ctx))
		));
		
		// Ensure Prism update on PDF export
		window.matchMedia('print').addEventListener('change', PrismJSPlugins.highlightAll);
	}

	override onunload() {
		const codeblocks = Array.from(document.body.querySelectorAll('pre'))
			.filter((pre) => pre.children[0].tagName == 'CODE');
		
		Object.values(this.plugins).forEach((plugin) => plugin.remove(codeblocks));

		window.matchMedia('print').removeEventListener('change', PrismJSPlugins.highlightAll);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

// 	onOpen() {
// 		const {contentEl} = this;
// 		contentEl.setText('Woah!');
// 	}

// 	onClose() {
// 		const {contentEl} = this;
// 		contentEl.empty();
// 	}
// }

class PrismJSPluginsSettingTab extends PluginSettingTab {
	plugin: PrismJSPlugins;

	constructor(app: App, plugin: PrismJSPlugins) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for PrismJS Plugins'});

		Object.entries(this.plugin.settings.plugins).forEach(([plugin_id, pluginSettings]) => {
			containerEl.createEl('h3', {text: pluginSettings.enabled.name});
			
			Object.entries(pluginSettings).forEach(([setting_id, setting]) => {
				if (isBoolean(this.plugin.settings.plugins[plugin_id][setting_id as keyof PrismPluginSettings].value)) {
					new Setting(containerEl).setName(setting.name).setDesc(setting.desc)
					.addToggle((toggle) => toggle
					.setValue(this.plugin.settings.plugins[plugin_id][setting_id as keyof PrismPluginSettings].value)
					.onChange(async (value) => {
						this.plugin.settings.plugins[plugin_id][setting_id as keyof PrismPluginSettings].value = value;
						await this.plugin.saveSettings();
						this.plugin.plugins[plugin_id].updateSettings(pluginSettings);
					}));
				}
			});
		});
	}
}
