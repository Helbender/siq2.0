"""Add unique constraint on flights_table (airtask, date, departure_time, tailnumber).

Removes duplicate flights first (keeps one per natural key with smallest fid;
cascade will remove flight_pilots of deleted duplicates). Then adds the constraint
so duplicates cannot be re-created.

Revision ID: d4e5f6a7b8c9
Revises: b2c3d4e5f6a7
Create Date: 2026-03-06

"""
from typing import Sequence, Union

from alembic import op
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    # Remove duplicate flights: keep one per (airtask, date, departure_time, tailnumber) with smallest fid.
    # Rows with larger fid are deleted; flight_pilots for those rows are removed by CASCADE.
    conn.execute(
        text("""
            WITH ranked AS (
                SELECT fid,
                    ROW_NUMBER() OVER (
                        PARTITION BY airtask, date, departure_time, tailnumber
                        ORDER BY fid ASC
                    ) AS rn
                FROM flights_table
            )
            DELETE FROM flights_table
            WHERE fid IN (SELECT fid FROM ranked WHERE rn > 1)
        """)
    )
    op.create_unique_constraint(
        "uq_flight_airtask_date_atd_tail",
        "flights_table",
        ["airtask", "date", "departure_time", "tailnumber"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_flight_airtask_date_atd_tail",
        "flights_table",
        type_="unique",
    )
