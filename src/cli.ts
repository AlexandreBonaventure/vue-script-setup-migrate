import fg from 'fast-glob';
import fs from 'fs/promises';
import transformCode from './index'

(async () => {
    const entries = await fg('**/*.vue', { dot: true });
    for (const entry of entries) {
        (async () => {
            const input = await fs.readFile(entry, { encoding: 'utf8' })
            const res = transformCode(input)
            fs.writeFile(entry, res, { encoding: 'utf8' })
        })();
    }
})();