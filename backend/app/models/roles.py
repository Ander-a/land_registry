"""
User Role Definitions for AI-Assisted Land Registry System

This module defines the strict user roles that govern access control
throughout the land registry application.
"""

from enum import Enum


class UserRole(str, Enum):
    """
    String Enum defining the four main actors in the Land Registry System.
    
    - RESIDENT: Land owners/claimants who submit land claims
    - COMMUNITY_MEMBER: Community members who validate claims
    - LOCAL_LEADER: Local leaders who endorse and validate claims
    - ADMIN: System administrators with full access
    """
    RESIDENT = "resident"
    COMMUNITY_MEMBER = "community_member"
    LOCAL_LEADER = "local_leader"
    ADMIN = "admin"
    
    @classmethod
    def get_all_roles(cls):
        """Return all available roles as a list."""
        return [role.value for role in cls]
    
    @classmethod
    def get_validation_roles(cls):
        """Return roles that can validate/endorse claims."""
        return [cls.COMMUNITY_MEMBER.value, cls.LOCAL_LEADER.value]
    
    @classmethod
    def get_admin_roles(cls):
        """Return roles with administrative privileges."""
        return [cls.ADMIN.value]
