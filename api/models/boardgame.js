'use strict';
module.exports = (sequelize, DataTypes) => {
    var BoardGame = sequelize.define('BoardGame', {
        name: DataTypes.STRING,
        bgg_id: DataTypes.INTEGER,
        bgg_score: DataTypes.FLOAT,
        gameplay_video_url: DataTypes.STRING
    }, {});
    BoardGame.associate = function(models) {
        // associations can be defined here
    };
    return BoardGame;
};