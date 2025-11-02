"""Add missing fields to schedule_items and special_guests tables

Revision ID: 005_add_schedule_guest_fields
Revises: 004_add_program_fields
Create Date: 2025-11-02 20:00:00.000000

This migration adds:
- type and created_at to schedule_items table
- bio, photo_url, display_order, and created_at to special_guests table
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '005_add_schedule_guest_fields'
down_revision: Union[str, None] = '004_add_program_fields'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add columns to schedule_items table
    from sqlalchemy import inspect
    bind = op.get_bind()
    inspector = inspect(bind)
    
    try:
        # Check and add columns to schedule_items
        if 'schedule_items' in inspector.get_table_names():
            columns = [col['name'] for col in inspector.get_columns('schedule_items')]
            
            if 'duration_minutes' not in columns:
                print("🔧 Adding 'duration_minutes' column to schedule_items table...")
                op.add_column('schedule_items', sa.Column('duration_minutes', sa.Integer(), nullable=True))
            
            if 'order_index' not in columns:
                print("🔧 Adding 'order_index' column to schedule_items table...")
                op.add_column('schedule_items', sa.Column('order_index', sa.Integer(), nullable=True))
            
            if 'type' not in columns:
                print("🔧 Adding 'type' column to schedule_items table...")
                op.add_column('schedule_items', sa.Column('type', sa.String(50), server_default='worship'))
            
            if 'created_at' not in columns:
                print("🔧 Adding 'created_at' column to schedule_items table...")
                op.add_column('schedule_items', sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')))
        
        # Check and add columns to special_guests
        if 'special_guests' in inspector.get_table_names():
            columns = [col['name'] for col in inspector.get_columns('special_guests')]
            
            # Add description if missing (should exist from initial migration, but check anyway)
            if 'description' not in columns:
                print("🔧 Adding 'description' column to special_guests table...")
                op.add_column('special_guests', sa.Column('description', sa.Text(), nullable=True))
            
            if 'bio' not in columns:
                print("🔧 Adding 'bio' column to special_guests table...")
                op.add_column('special_guests', sa.Column('bio', sa.Text(), nullable=True))
            
            if 'photo_url' not in columns:
                print("🔧 Adding 'photo_url' column to special_guests table...")
                op.add_column('special_guests', sa.Column('photo_url', sa.String(500), nullable=True))
            
            if 'display_order' not in columns:
                print("🔧 Adding 'display_order' column to special_guests table...")
                op.add_column('special_guests', sa.Column('display_order', sa.Integer(), server_default='0'))
            
            if 'created_at' not in columns:
                print("🔧 Adding 'created_at' column to special_guests table...")
                op.add_column('special_guests', sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')))
        
        print("✅ All schedule_items and special_guests fields added successfully")
    except Exception as e:
        print(f"⚠️  Could not add fields: {e}")


def downgrade() -> None:
    # Remove columns from schedule_items
    try:
        op.drop_column('schedule_items', 'created_at')
        op.drop_column('schedule_items', 'type')
    except:
        pass
    
    # Remove columns from special_guests
    try:
        op.drop_column('special_guests', 'created_at')
        op.drop_column('special_guests', 'display_order')
        op.drop_column('special_guests', 'photo_url')
        op.drop_column('special_guests', 'bio')
    except:
        pass

