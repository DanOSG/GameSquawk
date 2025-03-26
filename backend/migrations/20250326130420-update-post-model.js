'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Remove the existing category field
    await queryInterface.removeColumn('Posts', 'category');
    
    // Add new game-related fields
    await queryInterface.addColumn('Posts', 'gameId', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('Posts', 'gameTitle', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('Posts', 'gameImage', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove game-related fields
    await queryInterface.removeColumn('Posts', 'gameId');
    await queryInterface.removeColumn('Posts', 'gameTitle');
    await queryInterface.removeColumn('Posts', 'gameImage');
    
    // Add back the category field
    await queryInterface.addColumn('Posts', 'category', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'Technology'
    });
  }
};
