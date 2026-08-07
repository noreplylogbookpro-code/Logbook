const sharp = require('sharp');
const path = require('path');

async function convertToWebP() {
    const images = [
        { input: path.join(__dirname, '..', 'assets', 'images', 'app_logo.png'), output: path.join(__dirname, '..', 'assets', 'images', 'app_logo.webp') },
        { input: path.join(__dirname, '..', 'assets', 'images', 'blog_hero.png'), output: path.join(__dirname, '..', 'assets', 'images', 'blog_hero.webp') },
    ];

    for (const img of images) {
        try {
            const info = await sharp(img.input)
                .webp({ quality: 85 })
                .toFile(img.output);
            console.log(`Converted: ${path.basename(img.input)} -> ${path.basename(img.output)} (${(info.size / 1024).toFixed(1)} KB)`);
        } catch (e) {
            console.error(`Failed to convert ${path.basename(img.input)}: ${e.message}`);
        }
    }

    console.log('\nDone! You can now safely delete the original .png files if everything looks correct.');
}

convertToWebP();
