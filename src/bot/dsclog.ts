let _stdout: typeof process.stdout.write = process.stdout.write.bind(process.stdout);
let _stderr: typeof process.stderr.write = process.stderr.write.bind(process.stderr);

export function getStdoutLogFn(): typeof process.stdout.write {
    return _stdout;
}

export function getStderrLogFn(): typeof process.stderr.write {
    return _stderr;
}

export function setStdoutLogFn(fn: typeof process.stdout.write) {
    _stdout = fn;
}

export function setStderrLogFn(fn: typeof process.stderr.write) {
    _stderr = fn;
}

