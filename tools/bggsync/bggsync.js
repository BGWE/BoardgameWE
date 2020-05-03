/*
 * bggsync
 *
 * Synchronize BGC database with BGG data.
 * 
 * Usage:
 * node bggsync.js --config <path/to/config.js>
 */

const bgg = require("../../api/util/bgg");

const fs = require("fs");
const commander = require("commander");

// Returns list of board game IDs
function readConfigurationFile(path) {
    try {
        if (fs.existsSync(path)) {
            const config = require(path);
            return config.BOARDGAMES_ID;
        } else {
            console.error("Configuration file does not exist.");
            process.exit(1);
        }
    } catch (error) {
        console.error("Error while accessing the configuration file.");
        console.error(error);
        process.exit(1);
    }
}

function bggRequest(bgid) {
    bgg
        .get(bgid)
        .then((bg) => {
            const formattedBg = bgg.format_get_response(bg);
        })
        .catch(err => console.error(err));
}

/*
 * Main script
 */

commander
    .version("1.0.0", "-v, --version")
    .usage("[OPTIONS]...")
    .option('-c, --config [value]', 'Path to configuration file', 'config.js')
    .parse(process.argv);

if (commander.config !== null && commander.config !== "") {
    const boardgameIDs = readConfigurationFile(commander.config);
    for (const id of boardgameIDs) {
        bggRequest(id);
    }
} else {
    console.error("No configuration file provided.");
    process.exit(1);
}





