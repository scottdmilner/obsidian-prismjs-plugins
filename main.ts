import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import lineNumbers from 'plugins/line-numbers';
import { PrismObject, PrismPlugin } from 'plugins/PrismPlugin';

interface PrismJSPluginsSettings {
	lineNumbers: boolean;
	wrapLongLines: boolean;
}

const DEFAULT_SETTINGS: PrismJSPluginsSettings = {
	lineNumbers: false,
	wrapLongLines: false
}

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
	plugins: PrismPlugin[] = [];

	override async onload() {
		await this.loadSettings();
		this.addSettingTab(new PrismJSPluginsSettingTab(this.app, this));

		// load plugins
		PrismJSPlugins.getPrism()
		.then((Prism) => {
			this.plugins.push(new lineNumbers(Prism));
			return Promise.all(this.plugins.map((p) => p.get()));
		})
		.then((plugins) => this.plugins.forEach((plugin) =>
			// manually do initial run of postprocessors
			plugin.markdownPostProcessor(document.body, null)
		))
		.then(() => this.registerMarkdownPostProcessor((el, ctx) => 
			this.plugins.forEach((plugin) => plugin.markdownPostProcessor(el, ctx))
		));
		
		// Ensure Prism update on PDF export
		window.matchMedia('print').addEventListener('change', PrismJSPlugins.highlightAll);
	}

	override onunload() {
		const codeblocks = Array.from(document.body.querySelectorAll('pre'))
			.filter((pre) => pre.children[0].tagName == 'CODE');
		
		this.plugins.forEach((plugin) => plugin.remove(codeblocks));

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

		new Setting(containerEl)
			.setName('Line Numbers')
			.setDesc('Enable/disable code blocks on line numbers')
			.addToggle((toggle) => toggle
				.setValue(this.plugin.settings.lineNumbers)
				.onChange(async (value) => {
					this.plugin.settings.lineNumbers = value;
					await this.plugin.saveSettings();
				})
			);
	}
}
