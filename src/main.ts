import { App, Editor, MarkdownView, Modal, Notice, Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, JpgToSvgSettings, JpgToSvgSettingTab } from "./settings";

export default class JpgToSvgPlugin extends Plugin {
	settings: JpgToSvgSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new JpgToSvgSettingTab(this.app, this));

		this.addCommand({
			id: 'convert-jpg-svg-excalidraw',
			name: 'Convert JPGs to SVG and Import to Excalidraw',
			callback: async () => {
				console.log("Command!")
			}
		});

		this.addRibbonIcon('image-file', 'JPG to SVG', (evt: MouseEvent) => {
			console.log("Command!")
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

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		let { contentEl } = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
