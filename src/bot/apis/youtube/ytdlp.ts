export async function getSubtitlesVTT(url: string, sublangs: string = 'en.*'): Promise<string> {
    const tempDir = await Deno.makeTempDir({ dir: '/tmp/eclairbot' });
    try {
        const command = new Deno.Command('yt-dlp', {
            args: ['--write-subs', '--write-auto-subs', '--sub-langs', sublangs, '--skip-download', '--output', `${tempDir}/sub.%(ext)s`, url],
        });

        const { success, stderr } = await command.output();
        if (!success) {
            throw new Error(`yt-dlp failed: ${new TextDecoder().decode(stderr)}`);
        }

        for await (const entry of Deno.readDir(tempDir)) {
            if (entry.isFile && entry.name.endsWith('.vtt')) {
                return await Deno.readTextFile(`${tempDir}/${entry.name}`);
            }
        }

        throw new Error('No subtitles found');
    } finally {
        try {
            await Deno.remove(tempDir, { recursive: true });
        } catch {}
    }
}
