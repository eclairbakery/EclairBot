interface BashCommand {
    name: string,
    exec: (opts: {
        con: {
            stdout: (msg: string) => unknown,
            stderr: (msg: string) => unknown,
        },
        args: string[]
    }) => number | PromiseLike<number>
}

const cmds: BashCommand[] = [
    {
        name: 'echo',
        exec(opt) {
            opt.con.stdout(opt.args.join(' '));
            return 0;
        }
    }
];

export async function handleBashCommand(
    command: string, args: string[], 
    con: {
        stdout: (msg: string) => unknown,
        stderr: (msg: string) => unknown,
    }
): Promise<number> {
    const cmd = cmds.find((x) => x.name === command);
    if (!cmd) {
        con.stderr(`bash: ${command}: command not found`);
        return 127;
    }

    return await cmd.exec({
        con, args
    });
}

export default async function handleBashCode(opts: {
    console: {
        stdout: (msg: string) => unknown,
        stderr: (msg: string) => unknown,
        statusCode: (status: number) => unknown
    },
    script: string
}) {
    const args = opts.script.split(' ').filter(Boolean);
    const cmd = args.shift();

    if (!cmd) return;

    opts.console.statusCode(await handleBashCommand(
        cmd, args, opts.console
    ))
}
