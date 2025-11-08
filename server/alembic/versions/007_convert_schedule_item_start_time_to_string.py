"""Convert schedule_items.start_time to string.

Revision ID: 007_convert_schedule_item_start_time_to_string
Revises: 006_add_church_optional_fields
Create Date: 2025-11-08 13:00:00.000000
"""

from alembic import op


# revision identifiers, used by Alembic.
revision = "007_convert_schedule_item_start_time_to_string"
down_revision = "006_add_church_optional_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE schedule_items
        ALTER COLUMN start_time
        TYPE VARCHAR(16)
        USING CASE
            WHEN start_time IS NULL THEN NULL
            ELSE TO_CHAR(start_time, 'HH24:MI')
        END
        """
    )


def downgrade() -> None:
    op.execute(
        """
        ALTER TABLE schedule_items
        ALTER COLUMN start_time
        TYPE TIMESTAMP WITH TIME ZONE
        USING CASE
            WHEN start_time IS NULL OR start_time = '' THEN NULL
            WHEN start_time ~ '^[0-9]{2}:[0-9]{2}$' THEN
                TO_TIMESTAMP(start_time, 'HH24:MI')
            WHEN start_time ~ '^[0-9]{2}:[0-9]{2}:[0-9]{2}$' THEN
                TO_TIMESTAMP(start_time, 'HH24:MI:SS')
            ELSE NULL
        END
        """
    )

