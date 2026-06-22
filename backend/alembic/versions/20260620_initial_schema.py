"""initial_schema

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-06-20 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Enums
    user_role_enum = postgresql.ENUM('SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'USER', name='userrole')
    vehicle_type_enum = postgresql.ENUM('CAR', 'BUS', 'TRUCK', 'AMBULANCE', 'MOTORCYCLE', 'OTHER', name='vehicletype')
    vehicle_category_enum = postgresql.ENUM('VIP', 'EMERGENCY', 'STAFF', 'VENDOR', 'GENERAL', name='vehiclecategory')
    permission_status_enum = postgresql.ENUM('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'REVOKED', name='permissionstatus')
    scan_direction_enum = postgresql.ENUM('IN', 'OUT', name='scandirection')
    log_status_enum = postgresql.ENUM('SUCCESS', 'DENIED_EXPIRED', 'DENIED_INVALID_GATE', 'DENIED_REVOKED', 'DUPLICATE_SCAN', 'BLACKLISTED', 'OVERRIDE_GRANTED', name='logstatus')

    # 2. Users Table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('role', user_role_enum, server_default=sa.text("'USER'::userrole"), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # 3. Vehicles Table
    op.create_table(
        'vehicles',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('license_plate', sa.String(length=20), nullable=False, unique=True),
        sa.Column('vehicle_type', vehicle_type_enum, nullable=False),
        sa.Column('vehicle_category', vehicle_category_enum, nullable=False),
        sa.Column('owner_name', sa.String(length=255), nullable=False),
        sa.Column('contact_number', sa.String(length=15), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_vehicles_user_id', 'vehicles', ['user_id'])
    op.create_index('ix_vehicles_license_plate', 'vehicles', ['license_plate'])

    # 4. Blacklisted Vehicles
    op.create_table(
        'blacklisted_vehicles',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('vehicle_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('vehicles.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # 5. Gates
    op.create_table(
        'gates',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(length=100), nullable=False, unique=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('max_vehicles_per_hour', sa.Integer(), server_default=sa.text('100'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_gates_name', 'gates', ['name'])

    # 6. Permissions
    op.create_table(
        'permissions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('permission_code', sa.String(length=50), nullable=False, unique=True),
        sa.Column('vehicle_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('vehicles.id', ondelete='CASCADE'), nullable=False),
        sa.Column('requester_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('approved_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('status', permission_status_enum, server_default=sa.text("'PENDING'::permissionstatus"), nullable=False),
        sa.Column('valid_from', sa.DateTime(timezone=True), nullable=False),
        sa.Column('valid_until', sa.DateTime(timezone=True), nullable=False),
        sa.Column('qr_token', sa.String(), nullable=True, unique=True),
        sa.Column('purpose', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_permissions_permission_code', 'permissions', ['permission_code'])
    op.create_index('ix_permissions_vehicle_id', 'permissions', ['vehicle_id'])
    op.create_index('ix_permissions_requester_id', 'permissions', ['requester_id'])
    op.create_index('ix_permissions_status', 'permissions', ['status'])

    # 7. Association Table
    op.create_table(
        'permission_gates',
        sa.Column('permission_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('permissions.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('gate_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('gates.id', ondelete='CASCADE'), primary_key=True),
    )

    # 8. Entry Logs
    op.create_table(
        'entry_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('permission_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('permissions.id', ondelete='SET NULL'), nullable=True),
        sa.Column('gate_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('gates.id', ondelete='CASCADE'), nullable=False),
        sa.Column('scanned_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('scan_time', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('direction', scan_direction_enum, nullable=False),
        sa.Column('status', log_status_enum, nullable=False),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('override_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('override_reason', sa.Text(), nullable=True),
    )
    op.create_index('ix_entry_logs_permission_id', 'entry_logs', ['permission_id'])
    op.create_index('ix_entry_logs_gate_id', 'entry_logs', ['gate_id'])
    op.create_index('ix_entry_logs_scanned_by', 'entry_logs', ['scanned_by'])

    # 9. Audit Logs
    op.create_table(
        'audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('entity_type', sa.String(length=100), nullable=False),
        sa.Column('entity_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('old_state', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('new_state', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_audit_logs_user_id', 'audit_logs', ['user_id'])
    op.create_index('ix_audit_logs_action', 'audit_logs', ['action'])
    op.create_index('ix_audit_logs_entity_type', 'audit_logs', ['entity_type'])
    op.create_index('ix_audit_logs_entity_id', 'audit_logs', ['entity_id'])


def downgrade() -> None:
    # 1. Drop tables
    op.drop_table('audit_logs')
    op.drop_table('entry_logs')
    op.drop_table('permission_gates')
    op.drop_table('permissions')
    op.drop_table('gates')
    op.drop_table('blacklisted_vehicles')
    op.drop_table('vehicles')
    op.drop_table('users')

    # 2. Drop enums
    postgresql.ENUM(name='logstatus').drop(op.get_bind(), checkfirst=True)
    postgresql.ENUM(name='scandirection').drop(op.get_bind(), checkfirst=True)
    postgresql.ENUM(name='permissionstatus').drop(op.get_bind(), checkfirst=True)
    postgresql.ENUM(name='vehiclecategory').drop(op.get_bind(), checkfirst=True)
    postgresql.ENUM(name='vehicletype').drop(op.get_bind(), checkfirst=True)
    postgresql.ENUM(name='userrole').drop(op.get_bind(), checkfirst=True)
