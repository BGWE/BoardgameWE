'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query("ALTER TYPE \"enum_Games_ranking_method\" ADD VALUE 'RANKING_NO_POINT'");
  },
  down: (queryInterface, Sequelize) => {
    // overly complicated as postgres does not support removing values from enumerations
    // alternative is to create a new type without the value to delete and replace the old type after having updated
    // the column of interest
    throw new Error("down for migration '20200419003913-add_new_ranking_method_enum_type_value' not implemented.");
  }
};
