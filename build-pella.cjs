const esbuild = require('esbuild')
const fs = require('fs')
const path = require('path')

const OUTDIR = 'pella-dist'
const ENTRY = 'src/main.ts'

function copyNodeFiles(srcDir, destDir) {
    if (!fs.existsSync(srcDir)) return

    const entries = fs.readdirSync(srcDir, { withFileTypes: true })
    for (const entry of entries) {
        const fullPath = path.join(srcDir, entry.name)
        if (entry.isDirectory()) {
            copyNodeFiles(fullPath, destDir)
        } else if (entry.isFile() && entry.name.endsWith('.node')) {
            try {fs.mkdirSync(path.join(destDir, 'build'))} catch {}
            const destPath = path.join(destDir, 'build', path.basename(entry.name))
            fs.copyFileSync(fullPath, destPath)
            console.log(`Copied ${fullPath} -> ${destPath}`)
        }
    }
}

async function main() {
    if (!fs.existsSync(OUTDIR)) {
        fs.mkdirSync(OUTDIR)
    }

    try {
        await esbuild.build({
            entryPoints: [ENTRY],
            bundle: true,
            platform: 'node',
            external: ['discord.js'],
            outfile: path.join(OUTDIR, 'app.js'),
        })
        console.log('Build succeeded.')

        copyNodeFiles('node_modules', OUTDIR)
        console.log('Copied all .node files.')
    } catch (e) {
        console.error('Build failed:', e)
        process.exit(1)
    }
}

main()