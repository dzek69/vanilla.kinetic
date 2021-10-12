import fs from "fs-extra";

const contents = `{"type": "commonjs"}`;

(async () => {
    console.info("[CJS compile post-processing started]");
    await fs.writeFile("./dist/package.json", contents);
    console.info("Written dist/package.json with commonjs type fix");
    console.info("[CJS compile post-processing ended]");
})();
