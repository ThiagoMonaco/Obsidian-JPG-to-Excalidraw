# Obsidian JPG to Excalidraw 

A simple Obsidian plugin that automatically converts raster JPG/JPEG images from a designated folder into SVG vector files, and instantly imports them into **Excalidraw** as natively editable strokes.

This plugin is especially useful for digitizing handwritten notes, hand-drawn diagrams, or whiteboard photos directly into your Obsidian Vault for infinite scaling and lossless editing.

*Note: This plugin relies on heavy Node.js libraries (`potrace`, `svgo`, `Buffer`) for mathematical geometry conversion. Because of this, it is currently **Desktop Only**, as mobile WebViews do not support background Node engines.*

*(Requires the [Excalidraw Obsidian Plugin](https://p.rst.im/q/github.com/zsviczian/obsidian-excalidraw-plugin) to be installed and enabled!)*

## Limitations
- Colors don't work, the generated .excalidraw will be all B&W.
- The convertion isn't perfect, sometimes it will make a mess with some elements.

## How to Use

1. **Configure your Folders:** Open the plugin's settings tab inside Obsidian.
   - Set your **Source Directory** (default: `Inputs`).
   - Set your **Destination Directory** (default: `Outputs`).
2. **Add Images:** Drop any handwritten notes, sketches, or whiteboard photos `.jpg` into your Source Directory.
3. **Run the Importer:** 
   - Click the "Image File" ribbon icon on your Obsidian sidebar.
   - *OR* press `CMD+P` (Mac) / `CTRL+P` (Windows) and run the command: `Convert JPGs to SVG and Import to Excalidraw`.
4. **Enjoy your Vectors:** The plugin will silently trace all the images and spawn fully editable `.excalidraw.md` documents directly in your Destination Directory!

## Building from Source

If you want to modify the algorithm or math logic:

```bash
git clone https://p.rst.im/q/github.com/ThiagoMonaco/Obsidian-JPG-to-SVG.git
cd Obsidian-JPG-to-SVG
npm install
npm run build
```
The compiled `main.js` will be generated in the root folder. You can also run `npm run dev` to automatically recompile when you make changes.

