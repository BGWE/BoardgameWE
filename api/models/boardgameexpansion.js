'use strict';
module.exports = (sequelize, DataTypes) => {
  const BoardGameExpansion = sequelize.define('BoardGameExpansion', {
    id_expanded: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    id_expansion: {
      type: DataTypes.INTEGER,
      primaryKey: true
    }
  }, {});
  BoardGameExpansion.associate = function (models) {
    models.BoardGameExpansion.belongsTo(models.BoardGame, {
      onDelete: "CASCADE",
      foreignKey: "id_expanded",
      targetKey: "id",
      as: "expanded"
    });

    models.BoardGameExpansion.belongsTo(models.BoardGame, {
      onDelete: "CASCADE",
      foreignKey: "id_expansion",
      targetKey: "id",
      as: "expansion"
    });
  };
  return BoardGameExpansion;
};