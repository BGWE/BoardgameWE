'use strict';
module.exports = (sequelize, DataTypes) => {
    var BoardGame = sequelize.define('BoardGame', {
        name: DataTypes.STRING,
        bgg_id: DataTypes.INTEGER,
        bgg_score: DataTypes.FLOAT,
        gameplay_video_url: DataTypes.STRING,
        min_players: DataTypes.INTEGER,
        max_players: DataTypes.INTEGER,
        min_playing_time: DataTypes.INTEGER,
        max_playing_time: DataTypes.INTEGER,
        playing_time: DataTypes.INTEGER,
        thumbnail: DataTypes.STRING,
        image: DataTypes.STRING,
        description: DataTypes.TEXT,
        year_published: DataTypes.INTEGER,
        category: DataTypes.STRING,
        mechanic: DataTypes.STRING,
        family: DataTypes.STRING,
    }, {});
    BoardGame.associate = function(models) {
        // associations can be defined here
    };
    return BoardGame;
};