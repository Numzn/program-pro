"""add optional fields to churches

Revision ID: 006_add_church_optional_fields
Revises: 005_add_schedule_guest_fields
Create Date: 2025-11-07 13:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '006_add_church_optional_fields'
down_revision = '005_add_schedule_guest_fields'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('churches', sa.Column('short_name', sa.String(length=255), nullable=True))
    op.add_column('churches', sa.Column('description', sa.Text(), nullable=True))
    op.add_column('churches', sa.Column('theme_config', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('churches', 'theme_config')
    op.drop_column('churches', 'description')
    op.drop_column('churches', 'short_name')


