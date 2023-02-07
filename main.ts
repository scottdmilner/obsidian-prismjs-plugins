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

		const waitForPrism = (resolve: (val: typeof global.Prism) => void) => {
			if (global?.Prism) 
				resolve(global.Prism);
			else 
				setTimeout(waitForPrism.bind(waitForPrism, resolve), 100);
		}
		
		const waitForLineNumbers = (resolve: (val: typeof global.Prism.plugins.lineNumbers) => void) => {
			if (global.Prism?.plugins?.lineNumbers) 
				resolve(global.Prism.plugins.lineNumbers);
			else 
				setTimeout(waitForLineNumbers.bind(waitForLineNumbers, resolve), 30);
		}

		this.registerMarkdownPostProcessor((element: HTMLElement, context: MarkdownPostProcessorContext) => {
			const codeblocks = element.querySelectorAll("pre");
			codeblocks.forEach(pre => {
				if (pre.children[0].tagName == 'CODE'
					&& !pre.classList.contains('line-numbers')) {
						pre.classList.add('line-numbers');
				}
			});

			if (codeblocks.length) {
				new Promise(waitForPrism).then((Prism: typeof global.Prism) => Prism.highlightAll());
			}
		});


		new Promise(waitForPrism).then((Prism: typeof global.Prism) => {
			const script = document.createElement("script");
			script.textContent = lineNumbers;
			script.id = 'better-prism';
			document.body.appendChild(script);

			new Promise(waitForLineNumbers).then((lineNumbers) => {
				lineNumbers.assumeViewportIndependence = false;
				Prism.highlightAll();
			});
		});
	}

	onunload() {

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
