const { MenuItem } = require('../models');

async function renamePriceColumn() {
  try {
    console.log('Starting column rename from originalPrice to mrp...');
    
    // Check if the table exists and has the originalPrice column
    const tableDescription = await MenuItem.describe();
    console.log('Current table structure:', Object.keys(tableDescription));
    
    if (tableDescription.originalPrice) {
      // Rename the column from originalPrice to mrp
      await MenuItem.sequelize.getQueryInterface().renameColumn('menu_items', 'originalPrice', 'mrp');
      console.log('✅ Successfully renamed originalPrice column to mrp');
    } else if (tableDescription.mrp) {
      console.log('✅ Column mrp already exists');
    } else {
      // Add the mrp column if it doesn't exist
      await MenuItem.sequelize.getQueryInterface().addColumn('menu_items', 'mrp', {
        type: MenuItem.sequelize.Sequelize.DECIMAL(10, 2),
        allowNull: true,
      });
      console.log('✅ Successfully added mrp column');
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

renamePriceColumn();
