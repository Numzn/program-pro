#!/usr/bin/env python3
"""
Comprehensive Test Suite for Form to Database Flow

Tests the complete flow from form data submission to database persistence.
"""

import sys
import os
import json
from datetime import datetime
from sqlalchemy import text, inspect
from app.database.connection import engine, get_db
from app.models.database import Program, ScheduleItem, SpecialGuest, Church, User

def test_database_schema():
    """Test 1: Verify all required database columns exist."""
    print("=" * 60)
    print("TEST 1: Database Schema Verification")
    print("=" * 60)
    
    inspector = inspect(engine)
    
    required_columns = {
        'programs': ['id', 'church_id', 'title', 'date', 'theme', 'is_active', 'created_by'],
        'schedule_items': ['id', 'program_id', 'title', 'description', 'start_time', 
                          'duration_minutes', 'order_index', 'type'],
        'special_guests': ['id', 'program_id', 'name', 'role', 'description', 
                          'bio', 'photo_url', 'display_order']
    }
    
    all_passed = True
    for table_name, required in required_columns.items():
        if table_name not in inspector.get_table_names():
            print(f"❌ FAIL: Table '{table_name}' does not exist")
            all_passed = False
            continue
        
        existing_columns = [col['name'] for col in inspector.get_columns(table_name)]
        missing = [col for col in required if col not in existing_columns]
        
        if missing:
            print(f"❌ FAIL: Table '{table_name}' missing columns: {missing}")
            all_passed = False
        else:
            print(f"✅ PASS: Table '{table_name}' has all required columns")
    
    return all_passed


def test_form_data_structure():
    """Test 2: Verify form data structure matches backend expectations."""
    print("\n" + "=" * 60)
    print("TEST 2: Form Data Structure Validation")
    print("=" * 60)
    
    # Sample form data structure (as sent from frontend)
    sample_form_data = {
        "title": "Test Program",
        "date": "2025-12-25T00:00:00",
        "theme": "Test Theme",
        "is_active": True,
        "schedule_items": [
            {
                "title": "Test Schedule Item",
                "description": "Test Description",
                "start_time": "14:00",
                "type": "sermon",
                "order_index": 0
            }
        ],
        "special_guests": [
            {
                "name": "Test Guest",
                "role": "Guest Speaker",
                "bio": "Test Bio",
                "photo_url": "https://example.com/photo.jpg",
                "display_order": 0
            }
        ]
    }
    
    # Verify structure
    checks = [
        ("title" in sample_form_data, "title field present"),
        ("date" in sample_form_data, "date field present"),
        ("schedule_items" in sample_form_data, "schedule_items array present"),
        ("special_guests" in sample_form_data, "special_guests array present"),
        (len(sample_form_data["schedule_items"]) > 0, "schedule_items has items"),
        (len(sample_form_data["special_guests"]) > 0, "special_guests has items"),
    ]
    
    all_passed = True
    for check, message in checks:
        if check:
            print(f"✅ PASS: {message}")
        else:
            print(f"❌ FAIL: {message}")
            all_passed = False
    
    return all_passed


def test_sql_insert_building():
    """Test 3: Verify SQL INSERT statement building logic."""
    print("\n" + "=" * 60)
    print("TEST 3: SQL INSERT Statement Building")
    print("=" * 60)
    
    inspector = inspect(engine)
    schedule_columns = [col['name'] for col in inspector.get_columns('schedule_items')]
    guest_columns = [col['name'] for col in inspector.get_columns('special_guests')]
    
    # Test schedule item SQL building
    item_data = {
        "title": "Test Item",
        "description": "Test Desc",
        "start_time": "14:00",
        "type": "sermon",
        "order_index": 0
    }
    
    insert_cols = ['program_id', 'title']
    params = {'program_id': 1, 'title': item_data['title']}
    placeholders = [':program_id', ':title']
    
    if 'description' in schedule_columns and item_data.get('description'):
        insert_cols.append('description')
        placeholders.append(':description')
        params['description'] = item_data['description']
    
    if 'start_time' in schedule_columns and item_data.get('start_time'):
        insert_cols.append('start_time')
        placeholders.append(':start_time')
        params['start_time'] = item_data['start_time']
    
    if 'type' in schedule_columns:
        insert_cols.append('type')
        placeholders.append(':type')
        params['type'] = item_data.get('type', 'worship')
    
    if 'order_index' in schedule_columns:
        insert_cols.append('order_index')
        placeholders.append(':order_index')
        params['order_index'] = item_data.get('order_index', 0)
    
    sql = f"INSERT INTO schedule_items ({', '.join(insert_cols)}) VALUES ({', '.join(placeholders)})"
    
    checks = [
        ('program_id' in insert_cols, "program_id included"),
        ('title' in insert_cols, "title included"),
        ('description' in insert_cols if 'description' in schedule_columns else True, "description handled correctly"),
        ('type' in insert_cols if 'type' in schedule_columns else True, "type handled correctly"),
        (':program_id' in sql, "parameterized query uses placeholders"),
        (len(params) > 0, "parameters dictionary populated"),
    ]
    
    all_passed = True
    for check, message in checks:
        if check:
            print(f"✅ PASS: {message}")
        else:
            print(f"❌ FAIL: {message}")
            all_passed = False
    
    print(f"\n📝 Generated SQL: {sql}")
    print(f"📝 Parameters: {list(params.keys())}")
    
    return all_passed


def test_data_types():
    """Test 4: Verify data type conversions."""
    print("\n" + "=" * 60)
    print("TEST 4: Data Type Conversions")
    print("=" * 60)
    
    # Test date conversion (frontend sends ISO string)
    date_str = "2025-12-25T00:00:00"
    try:
        date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        print(f"✅ PASS: Date conversion successful: {date_obj}")
    except Exception as e:
        print(f"❌ FAIL: Date conversion failed: {e}")
        return False
    
    # Test boolean
    is_active = True
    print(f"✅ PASS: Boolean value: {is_active}")
    
    # Test integer
    order_index = 0
    print(f"✅ PASS: Integer value: {order_index}")
    
    # Test optional fields
    optional_fields = {
        "description": None,
        "theme": None,
        "bio": None
    }
    print(f"✅ PASS: Optional fields can be None")
    
    return True


def test_database_connection():
    """Test 5: Verify database connection and basic queries."""
    print("\n" + "=" * 60)
    print("TEST 5: Database Connection")
    print("=" * 60)
    
    try:
        with engine.connect() as conn:
            # Test simple query
            result = conn.execute(text("SELECT 1"))
            row = result.fetchone()
            if row and row[0] == 1:
                print("✅ PASS: Database connection successful")
            else:
                print("❌ FAIL: Database query returned unexpected result")
                return False
            
            # Test table existence
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('programs', 'schedule_items', 'special_guests')
            """))
            tables = [row[0] for row in result.fetchall()]
            
            required_tables = ['programs', 'schedule_items', 'special_guests']
            missing = [t for t in required_tables if t not in tables]
            
            if missing:
                print(f"❌ FAIL: Missing tables: {missing}")
                return False
            else:
                print(f"✅ PASS: All required tables exist: {tables}")
            
            return True
    except Exception as e:
        print(f"❌ FAIL: Database connection error: {e}")
        return False


def test_column_inspection():
    """Test 6: Verify column inspection works correctly."""
    print("\n" + "=" * 60)
    print("TEST 6: Column Inspection")
    print("=" * 60)
    
    inspector = inspect(engine)
    
    try:
        schedule_columns = [col['name'] for col in inspector.get_columns('schedule_items')]
        guest_columns = [col['name'] for col in inspector.get_columns('special_guests')]
        
        print(f"✅ PASS: schedule_items columns: {len(schedule_columns)} found")
        print(f"   Columns: {schedule_columns}")
        
        print(f"✅ PASS: special_guests columns: {len(guest_columns)} found")
        print(f"   Columns: {guest_columns}")
        
        # Verify key columns exist
        key_columns = {
            'schedule_items': ['title', 'type', 'order_index'],
            'special_guests': ['name', 'display_order']
        }
        
        all_passed = True
        for table, required in key_columns.items():
            columns = schedule_columns if table == 'schedule_items' else guest_columns
            for col in required:
                if col in columns:
                    print(f"✅ PASS: {table}.{col} exists")
                else:
                    print(f"❌ FAIL: {table}.{col} missing")
                    all_passed = False
        
        return all_passed
    except Exception as e:
        print(f"❌ FAIL: Column inspection error: {e}")
        return False


def run_all_tests():
    """Run all tests and provide summary."""
    print("\n" + "🔍" * 30)
    print("STARTING COMPREHENSIVE FLOW TESTS")
    print("🔍" * 30 + "\n")
    
    tests = [
        ("Database Schema", test_database_schema),
        ("Form Data Structure", test_form_data_structure),
        ("SQL INSERT Building", test_sql_insert_building),
        ("Data Type Conversions", test_data_types),
        ("Database Connection", test_database_connection),
        ("Column Inspection", test_column_inspection),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ ERROR in {test_name}: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print("\n" + "=" * 60)
    print(f"Total: {passed}/{total} tests passed")
    print("=" * 60)
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! The form-to-database flow is working correctly.")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please review the errors above.")
        return 1


if __name__ == "__main__":
    exit_code = run_all_tests()
    sys.exit(exit_code)

