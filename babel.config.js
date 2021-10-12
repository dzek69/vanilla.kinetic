const path = require("path");
const fs = require("fs");

module.exports = {
    presets: ["next/babel"],
    plugins: [
        [
            "module-resolver",
            {
                extensions: [".js", ".jsx", ".es", ".es6", ".mjs", "ts", "tsx"],
                resolvePath(sourcePath, currentFile, opts) {
                    if (!sourcePath.startsWith("./") && !sourcePath.startsWith("../")) {
                        return sourcePath;
                    }

                    if (sourcePath.endsWith(".js")) {
                        const relPath = path.resolve(path.dirname(currentFile), sourcePath);
                        const tsPath = relPath.replace(/\.js$/, ".ts");
                        const tsxPath = relPath.replace(/\.js$/, ".tsx");
                        if (fs.existsSync(tsPath)) {
                            return tsPath;
                        }
                        if (fs.existsSync(tsxPath)) {
                            return tsxPath;
                        }
                    }

                    return sourcePath;
                },
            },
        ],
    ],
};
