const YAML = require("yaml");
const fs = require("fs");
const path = require("path");

module.exports = class YamlHelp
{
    static LoadDoc(fileName)
    {
        const fileSpec = path.resolve(__dirname, "data", fileName);
        const rawYAML = fs.readFileSync(fileSpec, "utf-8");
        const documents = YAML.parseAllDocuments(rawYAML);   
        for (let doc of documents)
        {
            const jsonDoc = doc.toJSON();
            return jsonDoc;
        }
        return {};
    }
}