"""Add fields to programs table

Revision ID: 004_add_program_fields
Revises: 003_make_email_nullable
Create Date: 2025-10-31 23:30:00.000000

This migration adds is_active, created_by, and updated_at fields to programs table.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '004_add_program_fields'
down_revision: Union[str, None] = '003_make_email_nullable'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add columns to programs table
    from sqlalchemy import inspect
    bind = op.get_bind()
    inspector = inspect(bind)
    
    try:
        columns = [col['name'] for col in inspector.get_columns('programs')]
        
        if 'is_active' not in columns:
            print("🔧 Adding 'is_active' column to programs table...")
            op.add_column('programs', sa.Column('is_active', sa.Boolean(), default=True, server_default=sa.text('true')))
        
        if 'created_by' not in columns:
            print("🔧 Adding 'created_by' column to programs table...")
            op.add_column('programs', sa.Column('created_by', sa.Integer(), sa.ForeignKey('users.id'), nullable=True))
        
        if 'updated_at' not in columns:
            print("🔧 Adding 'updated_at' column to programs table...")
            op.add_column('programs', sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), onupdate=sa.text('now()')))
        
        print("✅ All program fields added successfully")
    except Exception as e:
        print(f"⚠️  Could not add program fields: {e}")


def downgrade() -> None:
    # Remove columns
    op.drop_column('programs', 'updated_at')
    op.drop_column('programs', 'created_by')
    op.drop_column('programs', 'is_active')

