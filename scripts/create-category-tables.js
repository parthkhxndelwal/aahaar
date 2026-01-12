const { MenuCategory, MenuItem } = require('../models');

async function createCategoryTables() {
  try {
    console.log('Creating menu categories table and updating menu items...');
    
    // Sync the MenuCategory table (this will create it)
    await MenuCategory.sync({ force: false });
    console.log('✅ MenuCategory table created/updated');
    
    // Check if categoryId column exists in menu_items
    const tableDescription = await MenuItem.describe();
    
    if (!tableDescription.categoryId) {
      // Add categoryId column to menu_items table
      await MenuItem.sequelize.getQueryInterface().addColumn('menu_items', 'categoryId', {
        type: MenuItem.sequelize.Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'menu_categories',
          key: 'id',
        },
      });
      console.log('✅ Added categoryId column to menu_items table');
    } else {
      console.log('✅ categoryId column already exists in menu_items table');
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

createCategoryTables();
