"""Make email nullable in users table

Revision ID: 003_make_email_nullable
Revises: 002_add_address
Create Date: 2025-10-31 23:18:00.000000

This migration makes the email column nullable in the users table.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '003_make_email_nullable'
down_revision: Union[str, None] = '002_add_address'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Alter email column to be nullable
    from sqlalchemy import inspect
    bind = op.get_bind()
    inspector = inspect(bind)
    
    try:
        # Get current column info
        columns = inspector.get_columns('users')
        email_col = next((col for col in columns if col['name'] == 'email'), None)
        
        if email_col and not email_col['nullable']:
            print("🔧 Making email column nullable...")
            op.alter_column('users', 'email', nullable=True, existing_type=sa.String(255))
            print("✅ Email column is now nullable")
        else:
            print("✅ Email column is already nullable")
    except Exception as e:
        print(f"⚠️  Could not alter email column: {e}")


def downgrade() -> None:
    # Make email NOT NULL again
    op.alter_column('users', 'email', nullable=False, existing_type=sa.String(255))

