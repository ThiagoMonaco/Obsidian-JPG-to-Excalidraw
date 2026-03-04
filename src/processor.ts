import { App, FileSystemAdapter, TFolder, TFile, Notice, normalizePath, WorkspaceLeaf } from 'obsidian';
import { JpgToSvgSettings } from './settings';
import { trace } from 'potrace';
import { optimize } from 'svgo';

export class Processor {
    app: App;
    settings: JpgToSvgSettings;

    constructor(app: App, settings: JpgToSvgSettings) {
        this.app = app;
        this.settings = settings;
    }

    async processFiles() {
        const ea = (window as any).ExcalidrawAutomate;
        if (!ea) {
            new Notice('Excalidraw plugin not found! Please install/enable Excalidraw.');
            return;
        }

        new Notice('Starting conversion...');
        const sourcePath = normalizePath(this.settings.sourceDirectory);
        const folder = this.app.vault.getAbstractFileByPath(sourcePath);

        if (!(folder instanceof TFolder)) {
            new Notice(`Source directory "${sourcePath}" not found.`);
            return;
        }

        const files = folder.children.filter(f => f instanceof TFile && (f.extension === 'jpg' || f.extension === 'jpeg'));

        if (files.length === 0) {
            new Notice('No JPG files found in source directory.');
            return;
        }

        let successCount = 0;

        for (const file of files) {
            try {
                const svg = await this.convertFileToSvg(file as TFile);
                if (svg) {
                    const optimizedSvg = this.optimizeSvg(svg);
                    await this.createExcalidrawFile(optimizedSvg, file as TFile, ea);
                    successCount++;
                }
            } catch (error) {
                console.error(`Error processing file ${file.name}:`, error);
                new Notice(`Error processing ${file.name}`);
            }
        }

        if (successCount > 0) {
            new Notice(`Successfully converted ${successCount} images.`);
        }
    }

    async convertFileToSvg(file: TFile): Promise<string> {
        const arrayBuffer = await this.app.vault.readBinary(file);
        const buffer = Buffer.from(arrayBuffer);

        const dominantColor = await this.extractDominantColor(buffer, file.extension);

        return new Promise((resolve, reject) => {
            trace(buffer, {
                alphaMax: 0.5,
                optTolerance: 0.1,
                turdSize: 4,
                color: 'auto',
                background: 'transparent'
            }, (err, svg) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.processCompoundPaths(svg, dominantColor));
                }
            });
        });
    }

    async extractDominantColor(buffer: Buffer, extension: string): Promise<string> {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve('#000000');
                    return;
                }
                ctx.drawImage(img, 0, 0);

                try {
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;

                    const colorCounts: Record<string, number> = {};
                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i] || 0;
                        const g = data[i + 1] || 0;
                        const b = data[i + 2] || 0;
                        const a = data[i + 3] || 0;

                        if (a < 128 || (r > 240 && g > 240 && b > 240)) continue;

                        const hex = "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
                        colorCounts[hex] = (colorCounts[hex] || 0) + 1;
                    }

                    let dominant = '#000000';
                    let max = 0;
                    for (const [hex, count] of Object.entries(colorCounts)) {
                        if (count > max) {
                            max = count;
                            dominant = hex;
                        }
                    }
                    resolve(dominant);
                } catch (e) {
                    console.error("Canvas CORS error:", e);
                    resolve('#000000');
                }
            };
            img.onerror = () => resolve('#000000');

            const mimeType = extension.toLowerCase() === 'png' ? 'image/png' : 'image/jpeg';
            const base64 = buffer.toString('base64');
            img.src = `data:${mimeType};base64,${base64}`;
        });
    }

    optimizeSvg(svgContent: string): string {
        try {
            const result = optimize(svgContent, {
                multipass: true,
                plugins: [
                    'preset-default',
                ],
            });
            return result.data;
        } catch (e) {
            console.error("SVGO optimization failed", e);
            return svgContent;
        }
    }

    processCompoundPaths(svgString: string, fgColor: string = '#000000'): string {
        const pathRegex = /<path[^>]*d="([^"]*)"[^>]*>/i;
        const match = svgString.match(pathRegex);

        if (!match || !match[1]) {
            return svgString;
        }

        const dString = match[1];
        const subpathsStr = dString.split(/(?=[Mm]\s)/).filter(s => s.trim().length > 0);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const pathsData = subpathsStr.map(pathStr => {
            const numbers = pathStr.match(/-?\d+\.?\d*/g);
            if (!numbers) return null;

            const firstX = parseFloat(numbers[0] || '');
            const firstY = parseFloat(numbers[1] || '');

            const p2d = new Path2D(pathStr.trim());

            return { path: pathStr.trim(), firstX, firstY, p2d };
        }).filter(p => p !== null) as any[];

        pathsData.forEach(p1 => {
            let enclosureCount = 0;
            pathsData.forEach(p2 => {
                if (p1 !== p2 && ctx) {
                    if (ctx.isPointInPath(p2.p2d, p1.firstX, p1.firstY, 'nonzero')) {
                        enclosureCount++;
                    }
                }
            });
            p1.depth = enclosureCount;
        });

        const ea = (window as any).ExcalidrawAutomate;
        let bgColor = '#ffffff';
        if (ea && typeof ea.getViewState === 'function') {
            try {
                const vs = ea.getViewState();
                if (vs && vs.viewBackgroundColor) bgColor = vs.viewBackgroundColor;
            } catch (e) { /* ignore */ }
        }

        let replacementPaths = '';
        pathsData.forEach(p => {
            const fill = (p.depth % 2 === 0) ? fgColor : bgColor;
            replacementPaths += `\n        <path d="${p.path}" fill="${fill}" stroke="none" />`;
        });

        let newSvgString = svgString.replace(match[0], replacementPaths);
        newSvgString = newSvgString.replace(/<rect[^>]*fill="none"[^>]*>/i, '');

        return newSvgString;
    }

    async createExcalidrawFile(svg: string, originalFile: TFile, ea: any) {
        ea.reset();

        const destFolder = normalizePath(this.settings.destinationDirectory);
        if (destFolder && !(this.app.vault.getAbstractFileByPath(destFolder) instanceof TFolder)) {
            await this.app.vault.createFolder(destFolder);
        }

        const filename = originalFile.basename;

        ea.importSVG(svg);

        await ea.create({
            filename: filename,
            foldername: destFolder,
            onNewPane: true
        });
    }



    generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}

