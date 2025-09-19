const { sequelize } = require('./models');

async function fixAllForeignKeys() {
  try {
    console.log('🔧 Starting comprehensive foreign key constraint fix...\n');

    // Get all foreign key constraints pointing to the old 'test' database
    const [badConstraints] = await sequelize.query(`
      SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE REFERENCED_TABLE_SCHEMA = 'test' 
      AND REFERENCED_TABLE_NAME IS NOT NULL 
      ORDER BY TABLE_NAME, CONSTRAINT_NAME
    `);

    console.log(`Found ${badConstraints.length} foreign key constraints pointing to old 'test' database:`);
    console.table(badConstraints);

    // Group constraints by table for organized fixing
    const constraintsByTable = badConstraints.reduce((acc, constraint) => {
      const { TABLE_NAME, CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME } = constraint;
      
      if (!acc[TABLE_NAME]) {
        acc[TABLE_NAME] = [];
      }
      
      acc[TABLE_NAME].push({
        constraintName: CONSTRAINT_NAME,
        columnName: COLUMN_NAME,
        referencedTable: REFERENCED_TABLE_NAME,
        referencedColumn: REFERENCED_COLUMN_NAME
      });
      
      return acc;
    }, {});

    // Fix each table's constraints
    for (const [tableName, constraints] of Object.entries(constraintsByTable)) {
      console.log(`\n🔧 Fixing table: ${tableName}`);
      
      // Drop old constraints
      for (const constraint of constraints) {
        try {
          await sequelize.query(`ALTER TABLE ${tableName} DROP FOREIGN KEY ${constraint.constraintName};`);
          console.log(`  ✅ Dropped constraint: ${constraint.constraintName}`);
        } catch (error) {
          console.log(`  ⚠️  Could not drop ${constraint.constraintName}: ${error.message}`);
        }
      }
      
      // Add new correct constraints
      for (const constraint of constraints) {
        try {
          const newConstraintName = `fk_${tableName}_${constraint.columnName}`;
          const referencedTableLower = constraint.referencedTable.toLowerCase();
          
          await sequelize.query(`
            ALTER TABLE ${tableName} 
            ADD CONSTRAINT ${newConstraintName} 
            FOREIGN KEY (${constraint.columnName}) 
            REFERENCES development.${referencedTableLower}(${constraint.referencedColumn}) 
            ON DELETE CASCADE ON UPDATE CASCADE;
          `);
          console.log(`  ✅ Added new constraint: ${newConstraintName}`);
        } catch (error) {
          console.log(`  ❌ Could not add constraint for ${constraint.columnName}: ${error.message}`);
        }
      }
    }

    console.log('\n🎉 Foreign key constraint fix completed!');
    
    // Verify the fix
    const [remainingBadConstraints] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE REFERENCED_TABLE_SCHEMA = 'test' 
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    console.log(`\n📊 Remaining bad constraints: ${remainingBadConstraints[0].count}`);
    
    if (remainingBadConstraints[0].count === 0) {
      console.log('🎉 All foreign key constraints have been fixed successfully!');
    } else {
      console.log('⚠️  Some constraints may need manual attention.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during foreign key fix:', error);
    process.exit(1);
  }
}

fixAllForeignKeys();