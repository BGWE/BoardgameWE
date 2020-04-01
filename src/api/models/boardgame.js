'use strict';
module.exports = (sequelize, DataTypes) => {
    const BoardGame = sequelize.define('BoardGame', {
        name: DataTypes.STRING,
        bgg_id: DataTypes.INTEGER,
        bgg_score: {
            type: DataTypes.FLOAT,
            validate: {min: 0.0, max: 10.0}
        },
        gameplay_video_url: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {isUrl: true}
        },
        min_players: {
            type: DataTypes.INTEGER,
            validate: {min: 1}
        },
        max_players: {
            type: DataTypes.INTEGER,
            validate: {min: 1}
        },
        min_playing_time: {
            type: DataTypes.INTEGER,
            validate: {min: 0}
        },
        max_playing_time: {
            type: DataTypes.INTEGER,
            validate: {min: 0}
        },
        playing_time: {
            type: DataTypes.INTEGER,
            validate: {min: 0}
        },
        thumbnail: {
            type: DataTypes.STRING,
            validate: {isUrl: true}
        },
        image: {
            type: DataTypes.STRING,
            validate: {isUrl: true}
        },
        description: DataTypes.TEXT,
        year_published: DataTypes.INTEGER,
        category: DataTypes.STRING,
        mechanic: DataTypes.STRING,
        family: DataTypes.STRING,
    }, {});
    BoardGame.associate = function(models) {
        models.BoardGame.hasMany(models.Game, {
            onDelete: "RESTRICT",
            foreignKey: "id_board_game"
        });

        models.BoardGame.hasMany(models.PlayedExpansion, {
          onDelete: "RESTRICT",
          foreignKey: 'id_board_game',
          sourceKey: 'id',
          as: 'played_as_expansion'
        });

        models.BoardGame.hasMany(models.LibraryGame, {
            onDelete: "CASCADE",
            foreignKey: 'id_board_game',
            sourceKey: 'id',
            as: 'library_games'
        });

        models.BoardGame.hasMany(models.BoardGameExpansion, {
            onDelete: "CASCADE",
            foreignKey: 'id_expansion',
            sourceKey: 'id',
            as: 'parent_board_games'
        });

        models.BoardGame.hasMany(models.BoardGameExpansion,  {
            onDelete: "CASCADE",
            foreignKey: 'id_expanded',
            sourceKey: 'id',
            as: 'expansions'
        });
    };
    return BoardGame;
};