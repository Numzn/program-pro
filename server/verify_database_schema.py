#!/usr/bin/env python3
"""
Database Schema Verification Script

This script verifies that all required columns exist in the database
for the new form features (step-by-step and bulk entry).
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import inspect, text
from app.database.connection import engine, get_db

def verify_schema():
    """Verify all required columns exist in the database."""
    inspector = inspect(engine)
    
    print("🔍 Verifying database schema...")
    print("=" * 60)
    
    # Required columns for each table
    required_columns = {
        'programs': ['id', 'church_id', 'title', 'date', 'theme', 'is_active', 'created_by', 'created_at'],
        'schedule_items': ['id', 'program_id', 'title', 'description', 'start_time', 'duration_minutes', 'order_index', 'type', 'created_at'],
        'special_guests': ['id', 'program_id', 'name', 'role', 'description', 'bio', 'photo_url', 'display_order', 'created_at']
    }
    
    all_good = True
    
    for table_name, required in required_columns.items():
        print(f"\n📋 Table: {table_name}")
        print("-" * 60)
        
        if table_name not in inspector.get_table_names():
            print(f"❌ Table '{table_name}' does not exist!")
            all_good = False
            continue
        
        existing_columns = [col['name'] for col in inspector.get_columns(table_name)]
        missing_columns = [col for col in required if col not in existing_columns]
        
        if missing_columns:
            print(f"⚠️  Missing columns: {', '.join(missing_columns)}")
            all_good = False
        else:
            print(f"✅ All required columns present ({len(existing_columns)} total)")
        
        # Show all columns
        print(f"   Columns: {', '.join(existing_columns)}")
    
    print("\n" + "=" * 60)
    if all_good:
        print("✅ Database schema is complete and ready for new form features!")
        return 0
    else:
        print("❌ Database schema is missing some columns.")
        print("\n💡 To fix this, run migrations:")
        print("   cd server")
        print("   alembic upgrade head")
        return 1

if __name__ == "__main__":
    exit_code = verify_schema()
    sys.exit(exit_code)

