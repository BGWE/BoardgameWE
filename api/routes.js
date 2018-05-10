'use strict';

const express = require("express");
module.exports = function(app) {
    const BoardGameController = require("./BoardGameController");
    const PlayerController = require("./PlayerController");
    const GameController = require("./GameController");

    // Board games
    app.route("/board_game/:bgid")
        .get(BoardGameController.getBoardGame)
        .post(BoardGameController.updateBoardGame);

    app.route("/board_game/:bggid")
        .put(BoardGameController.addBoardGame);

    app.route("/board_games")
        .get(BoardGameController.getBoardGames);

    app.route("/board_game/search")
        .get(BoardGameController.searchBoardGames);

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
        .get(GameController.getGame);
};