if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

process.env.VERBOSITY = process.env.VERBOSITY || "info";

const db = require("../src/api/models/index");
const winston = require("winston");
const logging = require("../src/api/util/logging");
const {addBoardGameAndExpansions} = require("../src/api/BoardGameController");
const {boolOrDefault} = require("../src/api/util/util");


const log_transports = [ new winston.transports.Console() ];
const custom_logger_defaults = { transports: log_transports, level: logging.get_log_level() };
let logger = winston.loggers.add("api", { ... custom_logger_defaults, format: logging.get_default_format("API") });

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const main = async (shallow=false) => {
  return db.sequelize.transaction(async transaction => {
    logger.info("|----------------------------|");
    logger.info("| Expansion import from BGG. |");
    logger.info("|----------------------------|");

    logger.info("(1) Fetching board games from the database...");
    const board_games = await db.BoardGame.findAll({attributes: ['bgg_id', 'name'], transaction});
    logger.info(`   > Fetched ${board_games.length} board game(s).`);

    if (board_games.length === 0) {
      return 0;
    }

    logger.info(`(2) Starts to fetch expansions for ${board_games.length} board games.`);
    await addBoardGameAndExpansions(board_games.map(bg => bg.bgg_id), transaction, shallow);
    return await db.BoardGame.count({transaction});
  });
};

Promise.resolve(main()).then(total => {
  logger.info(`Finished (${total} board games in the database).`);
}).catch(err => {
  logging.logError(logger, err);
});