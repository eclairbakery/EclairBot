class CdeclError extends Error {}

export default async function cdecl(query: string): Promise<string> {
    const [mode, actualQuery]
        = query.startsWith('declare ')
        ? ['declare', query.slice(8)]
        : query.startsWith('cast ')
        ? ['cast', query.slice(5)]
        : query.startsWith('explain ')
        ? ['explain', query.slice(8)]
        : ['explain', query];

    const cmd = new Deno.Command('cdecl', {
        args: [mode, actualQuery],
        stdin: 'null',
        stdout: 'piped',
        stderr: 'piped',
    });

    const { code, stdout, stderr } = await cmd.output();

    if (code != 0) {
        throw new CdeclError(new TextDecoder().decode(stderr));
    }
    return new TextDecoder().decode(stdout);
}
