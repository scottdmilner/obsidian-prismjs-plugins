import { App, MarkdownPostProcessorContext, Plugin, PluginSettingTab, Setting } from 'obsidian';

// @ts-ignore
import lineNumbers from './line-numbers.js.txt'

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}


export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	
	async onload() {
		await this.loadSettings();

		this.addSettingTab(new SampleSettingTab(this.app, this));

		/**
		 * Promise helper function to wait until Prism appears in the global 
		 * 	namespace (the first time Reading View is loaded)
		 * @param resolve 
		 */
		const getPrism = (resolve: (val: typeof global.Prism) => void) => {
			if (global?.Prism) 
				resolve(global.Prism);
			else 
				setTimeout(getPrism.bind(getPrism, resolve), 100);
		}
		
		/**
		 * Promise helper function to wait until the line-numbers plugin
		 * 	appears in the global namespace
		 * @param resolve 
		 */
		const getLineNumbers = (resolve: (val: typeof global.Prism.plugins.lineNumbers) => void) => {
			if (global.Prism?.plugins?.lineNumbers) 
				resolve(global.Prism.plugins.lineNumbers);
			else 
				setTimeout(getLineNumbers.bind(getLineNumbers, resolve), 30);
		}
		
		/** */
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
				new Promise(getPrism).then((Prism: typeof global.Prism) => Prism.highlightAll());
			}
		});

		// wait until Prism loads
		new Promise(getPrism).then((Prism: typeof global.Prism) => {
			// Inject line-numbers script
			const script = document.createElement("script");
			script.textContent = lineNumbers;
			script.id = 'line-numbers';
			document.body.appendChild(script);
			
			// Force Prism update on PDF export
			const printMediaQueryList = window.matchMedia('print');
			printMediaQueryList.addEventListener('change', (mql: MediaQueryListEvent) => Prism.highlightAll());

			// Configure lineNumbers plugin
			new Promise(getLineNumbers).then((lineNumbers) => {
				lineNumbers.assumeViewportIndependence = false;
				Prism.highlightAll();
			});
		});

	}

	onunload() {
		const codeblocks = document.body.querySelectorAll('pre');
		codeblocks.forEach(pre => {
			if (pre.children[0].tagName == 'CODE'             // check that it's a code block
				&& pre.classList.contains('line-numbers')) {  // if there's line numbers
					pre.classList.remove('line-numbers');     // remove line numbers
			}
		});
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
