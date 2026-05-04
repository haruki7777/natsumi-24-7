import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { GlobalFonts } from '@napi-rs/canvas';

const FONT_DIR = path.join(process.cwd(), 'fonts');
const FONT_NAME = 'NanumGothic-Bold.ttf';
const FONT_PATH = path.join(FONT_DIR, FONT_NAME);
const FONT_URL = 'https://github.com/google/fonts/raw/main/ofl/nanumgothic/NanumGothic-Bold.ttf';

export async function ensureKoreanFont() {
    if (!fs.existsSync(FONT_DIR)) {
        fs.mkdirSync(FONT_DIR, { recursive: true });
    }

    if (!fs.existsSync(FONT_PATH)) {
        console.log('[Fonts] Downloading Korean font...');
        try {
            const response = await axios({
                url: FONT_URL,
                method: 'GET',
                responseType: 'stream'
            });

            const writer = fs.createWriteStream(FONT_PATH);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
            console.log('[Fonts] Download complete.');
        } catch (error) {
            console.error('[Fonts] Failed to download font:', error);
            return false;
        }
    }

    // Register font
    const registered = GlobalFonts.registerFromPath(FONT_PATH, 'NanumGothic');
    if (registered) {
        console.log('[Fonts] NanumGothic registered successfully.');
    } else {
        console.warn('[Fonts] NanumGothic registration failed.');
    }
    return registered;
}
