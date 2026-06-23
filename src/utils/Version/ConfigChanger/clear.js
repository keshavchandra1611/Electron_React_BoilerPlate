const fs = require("fs");
const path = require("path");

function deleteNodeModules(dir) {
    let items;

    try {
        items = fs.readdirSync(dir, { withFileTypes: true });
    } catch (err) {
        console.error(`Cannot read: ${dir}`);
        return;
    }

    for (const item of items) {
        const fullPath = path.join(dir, item.name);

        try {
            // node_modules file/folder/symlink
            if (item.name === "node_modules") {
                console.log(`Deleting: ${fullPath}`);

                fs.rmSync(fullPath, {
                    recursive: true,
                    force: true,
                });

                console.log(`Deleted: ${fullPath}`);
                continue;
            }

            // recurse into all directories INCLUDING hidden ones
            if (item.isDirectory()) {
                deleteNodeModules(fullPath);
            }
        } catch (err) {
            console.error(`Failed: ${fullPath}`);
            console.error(err.message);
        }
    }
}

const rootDir = process.cwd();

console.log(`Scanning from: ${rootDir}`);
deleteNodeModules(rootDir);
console.log("Done.");