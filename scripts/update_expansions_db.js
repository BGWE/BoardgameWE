if (process.env.NODE_ENV !== 'production') {
  require('dotenv').load();
}

process.env.VERBOSITY = process.env.VERBOSITY || "info";

const db = require("../api/models/index");
const winston = require("winston");
const logging = require("../api/util/logging");
const {addBoardGameAndExpensions} = require("../api/BoardGameController");
const {boolOrDefault} = require("../api/util/util");


const log_transports = [ new winston.transports.Console() ];
const custom_logger_defaults = { transports: log_transports, level: logging.get_log_level() };
let logger = winston.loggers.add("api", { ... custom_logger_defaults, format: logging.get_default_format("API") });

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const main = async (shallow, wait) => {
  return db.sequelize.transaction(async transaction => {
    logger.info("|----------------------------|");
    logger.info("| Expansion import from BGG. |");
    logger.info("|----------------------------|");

    logger.info("(1) Fetching board games from the database...");
    const board_games = await db.BoardGame.findAll({attributes: ['bgg_id', 'name'], transaction});
    logger.info(`   > Fetched ${board_games.length} board game(s).`);

    let prev_total = board_games.length;
    for (let i = 0; i < board_games.length; ++i) {
      const board_game = board_games[i];
      logger.info(`(2) Fetching for ${i+1}th board game: ${board_game.name} (${Math.floor(100 * i / board_games.length)}%)`);
      await addBoardGameAndExpensions(board_game.bgg_id, transaction, boolOrDefault(shallow, true));
      let new_total = await db.BoardGame.count({transaction});
      logger.info(`   > done... ${new_total - prev_total} new board game(s) added.`);
      prev_total = new_total;
      await sleep(wait || 1000);
    }

    return prev_total;
  });
};

Promise.resolve(main(true, 5000)).then(total => {
  logger.info(`Finished (${total} board games in the database.`);
}).catch(err => {
  logging.logError(logger, err);
});