import { App, PluginSettingTab, Setting } from "obsidian";
import MyPlugin from "./main";

export interface JpgToSvgSettings {
	sourceDirectory: string
	destinationFile: string
}

export const DEFAULT_SETTINGS: JpgToSvgSettings = {
	sourceDirectory: 'Inputs',
    destinationFile: 'Output.excalidraw.md'
}

export class JpgToSvgSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

        new Setting(containerEl)
            .setName('Source Directory')
            .setDesc('Directory containing JPG images to convert')
            .addText(text => text
                .setPlaceholder('Inputs')
                .setValue(this.plugin.settings.sourceDirectory)
                .onChange(async (value) => {
                    this.plugin.settings.sourceDirectory = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Destination File')
            .setDesc('Excalidraw file to append the SVGs to')
            .addText(text => text
                .setPlaceholder('Output.excalidraw.md')
                .setValue(this.plugin.settings.destinationFile)
                .onChange(async (value) => {
                    this.plugin.settings.destinationFile = value;
                    await this.plugin.saveSettings();
                }));
	}
}
