import path from 'node:path';
import fs from 'node:fs/promises';

function getCacheDir(): string {
    const cacheHome = process.env.XDG_CACHE_HOME;
    if (cacheHome) {
        return path.join(cacheHome, 'eclairbot');
    }

    const home = process.env.HOME;
    if (home) {
        return path.join(home, '.cache', 'eclairbot');
    }

    return path.join('/', 'tmp', 'eb-cache');
}

export async function init() {
    await fs.mkdir(getCacheDir(), { recursive: true });
}

function getBoxFilepath(box: string): string {
    return path.join(getCacheDir(), box + '.json');
}

async function readBox(boxpath: string): Promise<Record<string, any>> {
    try {
        const content = await fs.readFile(boxpath, 'utf8');
        return JSON.parse(content);
    } catch (err: any) {
        if (err.code === 'ENOENT') {
            return {};
        }
        throw err;
    }
}

export async function store<T>(box: string, key: string, value: T) {
    const boxpath = getBoxFilepath(box);

    const json = await readBox(boxpath);
    json[key] = value;

    await fs.writeFile(boxpath, JSON.stringify(json));
}

export async function load<T>(box: string, key: string): Promise<T | undefined> {
    const boxpath = getBoxFilepath(box);

    const json = await readBox(boxpath);
    return json[key] as T | undefined;
}

export async function del(box: string, key: string) {
    const boxpath = getBoxFilepath(box);

    const json = await readBox(boxpath);
    delete json[key];

    await fs.writeFile(boxpath, JSON.stringify(json));

}
