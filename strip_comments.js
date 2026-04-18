const fs = require('fs');
const path = require('path');

const targetDirs = ['Backend', 'Berendina UI'];
const extensions = ['.js', '.jsx', '.css', '.html'];

function stripComments(content, ext) {
    if (ext === '.js' || ext === '.jsx') {
        // More robust JS/JSX comment removal that avoids most strings
        // This is a simplified version of a state-based comment remover
        return content.replace(/\/\*[\s\S]*?\*\/|(?<=[^:])\/\/.*|^\/\/.*|(?<="[^"]*"|'[^']*')|(\/\*[\s\S]*?\*\/|\/\/[^\n]*)/g, (match, group1) => {
            // If it's a quote or something we want to keep, return it as is
            if (match.startsWith('"') || match.startsWith("'") || match.startsWith('`')) {
                return match;
            }
            // If it's a comment (group1), return empty string
            if (group1) return '';
            return match;
        });
    } else if (ext === '.css') {
        return content.replace(/\/\*[\s\S]*?\*\//g, '');
    } else if (ext === '.html') {
        return content.replace(/<!--[\s\S]*?-->/g, '');
    }
    return content;
}

// Improved JS/JSX Regex that better handles URLs and strings
function advancedStripJS(code) {
    let inString = false;
    let stringChar = '';
    let inBlockComment = false;
    let inLineComment = false;
    let result = '';

    for (let i = 0; i < code.length; i++) {
        const char = code[i];
        const nextChar = code[i + 1];

        if (inBlockComment) {
            if (char === '*' && nextChar === '/') {
                inBlockComment = false;
                i++;
            }
            continue;
        }

        if (inLineComment) {
            if (char === '\n') {
                inLineComment = false;
                result += char;
            }
            continue;
        }

        if (inString) {
            result += char;
            if (char === stringChar && code[i - 1] !== '\\') {
                inString = false;
            }
            continue;
        }

        if (char === '/' && nextChar === '*') {
            inBlockComment = true;
            i++;
            continue;
        }

        if (char === '/' && nextChar === '/') {
            // Check if it's likely a URL (e.g. http://)
            const prevChar = result[result.length - 1];
            if (prevChar === ':') {
                result += char;
                continue;
            }
            inLineComment = true;
            i++;
            continue;
        }

        if (char === "'" || char === '"' || char === '`') {
            inString = true;
            stringChar = char;
            result += char;
            continue;
        }

        result += char;
    }
    return result;
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                processDirectory(fullPath);
            }
        } else {
            const ext = path.extname(file);
            if (extensions.includes(ext)) {
                console.log(`Processing: ${fullPath}`);
                let content = fs.readFileSync(fullPath, 'utf8');
                let newContent;
                if (ext === '.js' || ext === '.jsx') {
                    newContent = advancedStripJS(content);
                } else if (ext === '.css') {
                    newContent = content.replace(/\/\*[\s\S]*?\*\//g, '');
                } else if (ext === '.html') {
                    newContent = content.replace(/<!--[\s\S]*?-->/g, '');
                } else {
                    newContent = content;
                }
                
                // Clean up empty lines that only contained comments (optional but makes it cleaner)
                newContent = newContent.replace(/^\s*[\r\n]/gm, (match, offset, string) => {
                   // only remove if the original match was mostly whitespace
                   return match.trim() === '' ? '' : match;
                });

                fs.writeFileSync(fullPath, newContent, 'utf8');
            }
        }
    });
}

targetDirs.forEach(dir => {
    const absolutePath = path.resolve(__dirname, dir);
    if (fs.existsSync(absolutePath)) {
        console.log(`Starting cleanup in: ${absolutePath}`);
        processDirectory(absolutePath);
    } else {
        console.warn(`Directory not found: ${absolutePath}`);
    }
});

console.log('Cleanup completed successfully!');
