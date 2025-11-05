#!/usr/bin/env python3
"""
Add missing database columns directly

This script adds the missing columns that the migration should have added.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text, inspect
from app.database.connection import engine

def add_missing_columns():
    """Add missing columns to the database."""
    inspector = inspect(engine)
    
    print("🔧 Adding missing database columns...")
    print("=" * 60)
    
    with engine.connect() as conn:
        # Check and add duration_minutes to schedule_items
        schedule_columns = [col['name'] for col in inspector.get_columns('schedule_items')]
        if 'duration_minutes' not in schedule_columns:
            print("📝 Adding 'duration_minutes' column to schedule_items...")
            try:
                conn.execute(text("ALTER TABLE schedule_items ADD COLUMN duration_minutes INTEGER"))
                conn.commit()
                print("   ✅ Added duration_minutes")
            except Exception as e:
                print(f"   ⚠️  Error: {e}")
                conn.rollback()
        
        # Check and add description to special_guests
        guest_columns = [col['name'] for col in inspector.get_columns('special_guests')]
        if 'description' not in guest_columns:
            print("📝 Adding 'description' column to special_guests...")
            try:
                conn.execute(text("ALTER TABLE special_guests ADD COLUMN description TEXT"))
                conn.commit()
                print("   ✅ Added description")
            except Exception as e:
                print(f"   ⚠️  Error: {e}")
                conn.rollback()
    
    print("\n" + "=" * 60)
    print("✅ Done! Verifying...")
    print()
    
    # Verify again
    from verify_database_schema import verify_schema
    return verify_schema()

if __name__ == "__main__":
    exit_code = add_missing_columns()
    sys.exit(exit_code)

