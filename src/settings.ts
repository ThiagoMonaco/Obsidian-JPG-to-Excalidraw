import { App, PluginSettingTab, Setting } from "obsidian";
import JpgToSvgPlugin from "./main";

export interface JpgToSvgSettings {
	sourceDirectory: string
	destinationDirectory: string
}

export const DEFAULT_SETTINGS: JpgToSvgSettings = {
	sourceDirectory: 'Inputs',
    destinationDirectory: 'Outputs'
}

export class JpgToSvgSettingTab extends PluginSettingTab {
	plugin: JpgToSvgPlugin;

	constructor(app: App, plugin: JpgToSvgPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

        new Setting(containerEl)
            .setName('Source directory')
            .setDesc('Directory containing JPG images to convert')
            .addText(text => text
                .setPlaceholder('Inputs')
                .setValue(this.plugin.settings.sourceDirectory)
                .onChange(async (value) => {
                    this.plugin.settings.sourceDirectory = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Destination directory')
            .setDesc('Directory to save the converted Excalidraw SVG files')
            .addText(text => text
                .setPlaceholder('Outputs')
                .setValue(this.plugin.settings.destinationDirectory)
                .onChange(async (value) => {
                    this.plugin.settings.destinationDirectory = value;
                    await this.plugin.saveSettings();
                }));
	}
}
