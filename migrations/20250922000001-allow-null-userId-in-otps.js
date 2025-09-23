'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Change userId column to allow NULL values
    await queryInterface.changeColumn('otps', 'userId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert back to NOT NULL (be careful - this might fail if there are null values)
    await queryInterface.changeColumn('otps', 'userId', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    });
  }
};