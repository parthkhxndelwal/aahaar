'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'profileCompleted', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      after: 'phoneVerified'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'profileCompleted');
  }
};