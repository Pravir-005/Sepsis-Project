const fs = require('fs');
const path = require('path');

function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(full);
        } else if (entry.name.endsWith('.ts')) {
            let content = fs.readFileSync(full, 'utf8');
            // Replace: from './something.js' => from './something'
            const updated = content.replace(/from '(\.[^']+)\.js'/g, "from '$1'");
            if (updated !== content) {
                fs.writeFileSync(full, updated, 'utf8');
                console.log('Fixed:', full);
            }
        }
    }
}

walk(path.join(__dirname, 'src'));
console.log('Done.');
