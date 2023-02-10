import { App, MarkdownPostProcessorContext, Plugin, PluginSettingTab, Setting } from 'obsidian';
import lineNumbers from 'plugins/line-numbers';
import { PrismObject, PrismPlugin } from 'plugins/PrismPlugin';

// @ts-ignore
// import lineNumbersJs from './plugins-src/line-numbers.js.txt'

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	plugins: Array<PrismPlugin>;
	Prism: PrismObject;

	override async onload() {
		await this.loadSettings();

		this.plugins = [];

		this.addSettingTab(new SampleSettingTab(this.app, this));
		
		this.registerMarkdownPostProcessor((element: HTMLElement, context: MarkdownPostProcessorContext) => {
			const codeblocks = element.querySelectorAll('pre');
			codeblocks.forEach(pre => {
				if (pre.children[0].tagName == 'CODE'              // check that it's a code block
					&& !pre.classList.contains('line-numbers')) {  // if there's no line numbers yet
						pre.classList.add('line-numbers');         // add line numbers
				}
			});

			if (codeblocks.length) {
				// Force prism update
				this.getPrism().then((Prism) => Prism.highlightAll());
			}
		});

		// wait until Prism loads
		this.getPrism()
		.then((prism: PrismObject) => {
			console.log(prism)
			this.Prism = prism;
			this.plugins.push(new lineNumbers(this.Prism));
			
			return Promise.all(this.plugins.map(p => p.get()))
		})
		.then((plugins) => this.Prism.highlightAll())
		.then(() => {
			// Force Prism update on PDF export
			const printMediaQueryList = window.matchMedia('print');
			printMediaQueryList.addEventListener('change', (mql: MediaQueryListEvent) => this.Prism.highlightAll());
		});

	}

	getPrism() {
		/**
		 * Promise helper function to wait until Prism appears in the global 
		 * 	namespace (the first time Reading View is loaded)
		 * @param resolve 
		 */
		const getPrism = (resolve: (val: PrismObject) => void) => {
			if (global?.Prism) 
				resolve(global.Prism);
			else 
				setTimeout(getPrism.bind(getPrism, resolve), 100);
		}
		return new Promise(getPrism);
	}

	override onunload() {
		const codeblocks = document.body.querySelectorAll('pre');
		codeblocks.forEach(pre => {
			if (pre.children[0].tagName == 'CODE'             // check that it's a code block
				&& pre.classList.contains('line-numbers')) {  // if there's line numbers
					pre.classList.remove('line-numbers');     // remove line numbers
			}
		});

		const printMediaQueryList = window.matchMedia('print');
		
		// printMediaQueryList.removeEventListener('change');
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
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
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
