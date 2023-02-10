import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import lineNumbers from 'plugins/line-numbers';
import { PrismObject, PrismPlugin } from 'plugins/PrismPlugin';

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
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
		.then(Prism => Prism.highlightAll());
	}

	settings: MyPluginSettings;
	plugins: PrismPlugin[] = [];

	override async onload() {
		await this.loadSettings();
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// load plugins
		PrismJSPlugins.getPrism()
		.then((Prism) => {
			this.plugins.push(new lineNumbers(Prism));
			return Promise.all(this.plugins.map(p => p.get()));
		})
		.then(plugins => this.plugins.forEach(plugin =>
			// manually do initial run of postprocessors
			plugin.markdownPostProcessor(document.body, null)
		))
		.then(() => this.registerMarkdownPostProcessor((el, ctx) => 
			this.plugins.forEach(plugin => plugin.markdownPostProcessor(el, ctx))
		));
		
		// Ensure Prism update on PDF export
		window.matchMedia('print').addEventListener('change', PrismJSPlugins.highlightAll);
	}

	override onunload() {
		const codeblocks = Array.from(document.body.querySelectorAll('pre'))
			.filter(pre => pre.children[0].tagName == 'CODE');
		
		this.plugins.forEach(plugin => plugin.remove(codeblocks));

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

class SampleSettingTab extends PluginSettingTab {
	plugin: PrismJSPlugins;

	constructor(app: App, plugin: PrismJSPlugins) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
