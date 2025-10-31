"""Add churches address column

Revision ID: 002_add_address
Revises: 001_initial
Create Date: 2025-10-31 21:30:00.000000

This migration adds the missing 'address' column to the churches table.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '002_add_address'
down_revision: Union[str, None] = '001_initial'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add address column to churches table if it doesn't exist
    from sqlalchemy import inspect
    bind = op.get_bind()
    inspector = inspect(bind)
    
    # Check if column already exists
    columns = [col['name'] for col in inspector.get_columns('churches')]
    if 'address' not in columns:
        op.add_column('churches', sa.Column('address', sa.Text(), nullable=True))
    else:
        print("⚠️  Column 'address' already exists in 'churches' table, skipping...")


def downgrade() -> None:
    # Remove address column
    op.drop_column('churches', 'address')

