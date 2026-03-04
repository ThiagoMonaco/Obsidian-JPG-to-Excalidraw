import { Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, JpgToSvgSettings, JpgToSvgSettingTab } from "./settings";
import { Processor } from 'processor';

export default class JpgToSvgPlugin extends Plugin {
	settings: JpgToSvgSettings;
	processor!: Processor;


	async onload() {
		await this.loadSettings();
		this.processor = new Processor(this.app, this.settings);

		this.addSettingTab(new JpgToSvgSettingTab(this.app, this));

		this.addCommand({
			id: 'convert-jpg-svg-excalidraw',
			name: 'Convert JPG to SVG and import to Excalidraw',
			callback: async () => {
				this.processor.settings = this.settings;
                await this.processor.processFiles();
			}
		});

		this.addRibbonIcon('image-file', 'Convert images', (_evt: MouseEvent) => {
			this.processor.settings = this.settings;
			void this.processor.processFiles();
		});
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<JpgToSvgSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
