"""
Analytics Service
Provides comprehensive system analytics, statistics, and reporting data
"""
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.claim import Claim
from app.models.land_transaction import LandTransaction
from app.models.property_valuation import PropertyValuation
from app.models.tax_assessment import TaxAssessment
from app.models.land_use_permit import LandUsePermit
from app.models.user import User
from app.models.certificate import Certificate


class AnalyticsService:
    """Service for generating analytics and statistics"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
    
    async def get_system_overview_stats(self) -> Dict[str, Any]:
        """
        Get comprehensive system overview statistics
        Returns total counts and growth percentages
        """
        # Get current counts
        total_properties = await Claim.find().count()
        pending_approvals = await Claim.find(
            Claim.status == "pending"
        ).count()
        total_certificates = await Certificate.find().count()
        active_users = await User.find(
            User.is_active == True
        ).count()
        
        # Calculate growth (last 30 days vs previous 30 days)
        now = datetime.utcnow()
        thirty_days_ago = now - timedelta(days=30)
        sixty_days_ago = now - timedelta(days=60)
        
        # Properties growth
        properties_last_30 = await Claim.find(
            Claim.created_at >= thirty_days_ago
        ).count()
        properties_prev_30 = await Claim.find(
            Claim.created_at >= sixty_days_ago,
            Claim.created_at < thirty_days_ago
        ).count()
        properties_growth = self._calculate_growth(properties_last_30, properties_prev_30)
        
        # Approvals growth
        approvals_last_30 = await Claim.find(
            Claim.status == "approved",
            Claim.updated_at >= thirty_days_ago
        ).count()
        approvals_prev_30 = await Claim.find(
            Claim.status == "approved",
            Claim.updated_at >= sixty_days_ago,
            Claim.updated_at < thirty_days_ago
        ).count()
        approvals_growth = self._calculate_growth(approvals_last_30, approvals_prev_30)
        
        # Certificates growth
        certs_last_30 = await Certificate.find(
            Certificate.issued_date >= thirty_days_ago
        ).count()
        certs_prev_30 = await Certificate.find(
            Certificate.issued_date >= sixty_days_ago,
            Certificate.issued_date < thirty_days_ago
        ).count()
        certificates_growth = self._calculate_growth(certs_last_30, certs_prev_30)
        
        # Users growth
        users_last_30 = await User.find(
            User.created_at >= thirty_days_ago
        ).count()
        users_prev_30 = await User.find(
            User.created_at >= sixty_days_ago,
            User.created_at < thirty_days_ago
        ).count()
        users_growth = self._calculate_growth(users_last_30, users_prev_30)
        
        return {
            "total_properties": total_properties,
            "properties_growth": properties_growth,
            "pending_approvals": pending_approvals,
            "approvals_growth": approvals_growth,
            "total_certificates": total_certificates,
            "certificates_growth": certificates_growth,
            "active_users": active_users,
            "users_growth": users_growth,
            "last_updated": now.isoformat()
        }
    
    async def get_registration_trends(self, months: int = 6) -> List[Dict[str, Any]]:
        """
        Get land registration trends over specified months
        Returns monthly data for line chart visualization
        """
        now = datetime.utcnow()
        trends = []
        
        for i in range(months - 1, -1, -1):
            # Calculate month start and end
            month_start = (now - timedelta(days=30 * i)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if i == 0:
                month_end = now
            else:
                month_end = (now - timedelta(days=30 * (i - 1))).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            
            # Count registrations in this month
            registrations = await Claim.find(
                Claim.created_at >= month_start,
                Claim.created_at < month_end
            ).count()
            
            # Count approvals in this month
            approvals = await Claim.find(
                Claim.status == "approved",
                Claim.updated_at >= month_start,
                Claim.updated_at < month_end
            ).count()
            
            # Count certificates issued in this month
            certificates = await Certificate.find(
                Certificate.issued_date >= month_start,
                Certificate.issued_date < month_end
            ).count()
            
            trends.append({
                "month": month_start.strftime("%B %Y"),
                "month_short": month_start.strftime("%b"),
                "registrations": registrations,
                "approvals": approvals,
                "certificates": certificates,
                "timestamp": month_start.isoformat()
            })
        
        return trends
    
    async def get_department_activity(self) -> Dict[str, int]:
        """
        Get activity breakdown by department
        Returns counts for surveying, legal, issuance, and records
        """
        now = datetime.utcnow()
        thirty_days_ago = now - timedelta(days=30)
        
        # Surveying: New land claims with coordinates
        surveying = await Claim.find(
            Claim.created_at >= thirty_days_ago,
            Claim.coordinates != None
        ).count()
        
        # Legal: Disputes and validations
        legal = await self.db.disputes.count_documents({
            "created_at": {"$gte": thirty_days_ago}
        })
        
        # Issuance: Certificates issued
        issuance = await Certificate.find(
            Certificate.issued_date >= thirty_days_ago
        ).count()
        
        # Records: Transactions recorded
        records = await LandTransaction.find(
            LandTransaction.transaction_date >= thirty_days_ago
        ).count()
        
        return {
            "surveying": surveying,
            "legal": legal,
            "issuance": issuance,
            "records": records
        }
    
    async def get_active_users_online(self) -> List[Dict[str, Any]]:
        """
        Get currently active users (last 15 minutes)
        Returns user info with role and last activity
        """
        fifteen_minutes_ago = datetime.utcnow() - timedelta(minutes=15)
        
        # Find users active in last 15 minutes
        users = await User.find(
            User.last_login >= fifteen_minutes_ago
        ).to_list()
        
        return [
            {
                "id": str(user.id),
                "full_name": user.full_name,
                "email": user.email,
                "role": user.role,
                "last_activity": user.last_login.isoformat() if user.last_login else None
            }
            for user in users
        ]
    
    async def get_activity_log(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get recent system activity log
        Returns latest actions across the system
        """
        activities = []
        
        # Recent land claims
        recent_claims = await Claim.find().sort("-created_at").limit(limit // 4).to_list()
        for claim in recent_claims:
            activities.append({
                "id": str(claim.id),
                "type": "land_claim",
                "action": "New land claim registered",
                "user": claim.claimant_name,
                "details": f"Parcel ID: {claim.parcel_id}",
                "timestamp": claim.created_at.isoformat(),
                "status": claim.status
            })
        
        # Recent transactions
        recent_transactions = await LandTransaction.find().sort("-transaction_date").limit(limit // 4).to_list()
        for tx in recent_transactions:
            activities.append({
                "id": str(tx.id),
                "type": "transaction",
                "action": f"{tx.transaction_type.capitalize()} transaction",
                "user": tx.seller_name,
                "details": f"Amount: {tx.transaction_amount:,.0f} RWF",
                "timestamp": tx.transaction_date.isoformat(),
                "status": tx.status
            })
        
        # Recent certificates
        recent_certs = await Certificate.find().sort("-issued_date").limit(limit // 4).to_list()
        for cert in recent_certs:
            activities.append({
                "id": str(cert.id),
                "type": "certificate",
                "action": "Certificate issued",
                "user": cert.owner_name,
                "details": f"Certificate No: {cert.certificate_number}",
                "timestamp": cert.issued_date.isoformat(),
                "status": "issued"
            })
        
        # Recent permits
        recent_permits = await LandUsePermit.find().sort("-application_date").limit(limit // 4).to_list()
        for permit in recent_permits:
            activities.append({
                "id": str(permit.id),
                "type": "permit",
                "action": f"{permit.permit_type.capitalize()} permit application",
                "user": permit.applicant_name,
                "details": permit.purpose,
                "timestamp": permit.application_date.isoformat(),
                "status": permit.status
            })
        
        # Sort by timestamp descending
        activities.sort(key=lambda x: x["timestamp"], reverse=True)
        
        return activities[:limit]
    
    async def get_property_statistics(self) -> Dict[str, Any]:
        """
        Get comprehensive property-related statistics
        """
        # Property valuations
        total_valuations = await PropertyValuation.find().count()
        avg_valuation = await self._get_average_valuation()
        
        # Tax assessments
        total_tax_collected = await self._get_total_tax_collected()
        pending_taxes = await TaxAssessment.find(
            TaxAssessment.payment_status == "unpaid"
        ).count()
        
        # Permits
        active_permits = await LandUsePermit.find(
            LandUsePermit.status == "approved"
        ).count()
        pending_permits = await LandUsePermit.find(
            LandUsePermit.status == "pending"
        ).count()
        
        # Transactions
        total_transactions = await LandTransaction.find().count()
        transaction_volume = await self._get_transaction_volume()
        
        return {
            "valuations": {
                "total": total_valuations,
                "average_value": avg_valuation
            },
            "taxes": {
                "total_collected": total_tax_collected,
                "pending_assessments": pending_taxes
            },
            "permits": {
                "active": active_permits,
                "pending": pending_permits
            },
            "transactions": {
                "total": total_transactions,
                "volume": transaction_volume
            }
        }
    
    def _calculate_growth(self, current: int, previous: int) -> float:
        """Calculate percentage growth between two periods"""
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        return round(((current - previous) / previous) * 100, 1)
    
    async def _get_average_valuation(self) -> float:
        """Calculate average property valuation"""
        valuations = await PropertyValuation.find().to_list()
        if not valuations:
            return 0.0
        total = sum(v.market_value for v in valuations)
        return round(total / len(valuations), 2)
    
    async def _get_total_tax_collected(self) -> float:
        """Calculate total tax collected"""
        assessments = await TaxAssessment.find(
            TaxAssessment.payment_status == "paid"
        ).to_list()
        return sum(a.tax_amount for a in assessments)
    
    async def _get_transaction_volume(self) -> float:
        """Calculate total transaction volume"""
        transactions = await LandTransaction.find(
            LandTransaction.status == "completed"
        ).to_list()
        return sum(t.transaction_amount for t in transactions)
