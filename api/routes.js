'use strict';

module.exports = function(app) {
    const BoardGameController = require("./BoardGameController");
    const PlayerController = require("./PlayerController");
    const GameController = require("./GameController");
    const StatsController = require("./StatsController");

    // Board games
    app.route("/board_game/search")
        .get(BoardGameController.searchBoardGames);

    app.route("/board_game/:bgid")
        .get(BoardGameController.getBoardGame)
        .post(BoardGameController.updateBoardGame)
        .delete(BoardGameController.deleteBoardGame);

    app.route("/board_game/:bggid")
        .put(BoardGameController.addBoardGame);

    app.route("/board_games")
        .get(BoardGameController.getBoardGames);

    // Player
    app.route("/player")
        .put(PlayerController.addPlayer);

    app.route("/player/:pid")
        .get(PlayerController.getPlayer);

    app.route("/players")
        .get(PlayerController.getPlayers);


    // Game
    app.route("/game")
        .put(GameController.addGame);

    app.route("/games")
        .get(GameController.getGames);

    app.route("/game/:gid")
        .get(GameController.getGame)
        .delete(GameController.deleteGame);

    // Statistics
    app.route("/stats/rankings")
        .get(StatsController.getRankings);
};