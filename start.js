import * as cp from 'child_process';
cp.execSync('tsc');
import './dist/main';