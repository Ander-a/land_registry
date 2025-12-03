"""
Report Generation Service
Handles PDF, Excel, and CSV report generation for analytics
"""
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import io
import csv
from bson import ObjectId

from app.models.claim import Claim
from app.models.land_transaction import LandTransaction
from app.models.certificate import Certificate
from app.models.tax_assessment import TaxAssessment


class ReportService:
    """Service for generating various report formats"""
    
    async def generate_property_report_data(
        self, 
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Generate property report data with optional filters
        Returns data suitable for PDF, Excel, or CSV export
        """
        # Build query
        query_filters = []
        
        if start_date:
            query_filters.append(Claim.created_at >= start_date)
        if end_date:
            query_filters.append(Claim.created_at <= end_date)
        if status:
            query_filters.append(Claim.status == status)
        
        # Fetch claims
        if query_filters:
            claims = await Claim.find(*query_filters).to_list()
        else:
            claims = await Claim.find().to_list()
        
        # Format data
        report_data = []
        for claim in claims:
            report_data.append({
                "Parcel ID": claim.parcel_id,
                "Claimant Name": claim.claimant_name,
                "National ID": claim.national_id,
                "Province": claim.province,
                "District": claim.district,
                "Sector": claim.sector,
                "Cell": claim.cell,
                "Village": claim.village,
                "Land Size (sqm)": claim.land_size,
                "Status": claim.status.capitalize(),
                "Registration Date": claim.created_at.strftime("%Y-%m-%d %H:%M"),
                "Last Updated": claim.updated_at.strftime("%Y-%m-%d %H:%M") if claim.updated_at else ""
            })
        
        return report_data
    
    async def generate_transaction_report_data(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        transaction_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Generate transaction report data"""
        query_filters = []
        
        if start_date:
            query_filters.append(LandTransaction.transaction_date >= start_date)
        if end_date:
            query_filters.append(LandTransaction.transaction_date <= end_date)
        if transaction_type:
            query_filters.append(LandTransaction.transaction_type == transaction_type)
        
        if query_filters:
            transactions = await LandTransaction.find(*query_filters).to_list()
        else:
            transactions = await LandTransaction.find().to_list()
        
        report_data = []
        for tx in transactions:
            report_data.append({
                "Transaction ID": str(tx.id),
                "Parcel ID": tx.parcel_id,
                "Type": tx.transaction_type.capitalize(),
                "Seller": tx.seller_name,
                "Seller ID": tx.seller_id,
                "Buyer": tx.buyer_name,
                "Buyer ID": tx.buyer_id,
                "Amount (RWF)": f"{tx.transaction_amount:,.2f}",
                "Tax Amount (RWF)": f"{tx.tax_amount:,.2f}",
                "Registration Fee (RWF)": f"{tx.registration_fee:,.2f}",
                "Status": tx.status.capitalize(),
                "Transaction Date": tx.transaction_date.strftime("%Y-%m-%d"),
                "Registered By": tx.registered_by
            })
        
        return report_data
    
    async def generate_tax_report_data(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        payment_status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Generate tax assessment report data"""
        query_filters = []
        
        if start_date:
            query_filters.append(TaxAssessment.assessment_date >= start_date)
        if end_date:
            query_filters.append(TaxAssessment.assessment_date <= end_date)
        if payment_status:
            query_filters.append(TaxAssessment.payment_status == payment_status)
        
        if query_filters:
            assessments = await TaxAssessment.find(*query_filters).to_list()
        else:
            assessments = await TaxAssessment.find().to_list()
        
        report_data = []
        for assessment in assessments:
            report_data.append({
                "Assessment ID": str(assessment.id),
                "Parcel ID": assessment.parcel_id,
                "Owner Name": assessment.owner_name,
                "Owner ID": assessment.owner_id,
                "Tax Year": assessment.tax_year,
                "Property Value (RWF)": f"{assessment.property_value:,.2f}",
                "Tax Rate (%)": f"{assessment.tax_rate}",
                "Tax Amount (RWF)": f"{assessment.tax_amount:,.2f}",
                "Payment Status": assessment.payment_status.capitalize(),
                "Due Date": assessment.due_date.strftime("%Y-%m-%d"),
                "Payment Date": assessment.payment_date.strftime("%Y-%m-%d") if assessment.payment_date else "",
                "Assessment Date": assessment.assessment_date.strftime("%Y-%m-%d")
            })
        
        return report_data
    
    async def generate_certificate_report_data(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """Generate certificate issuance report data"""
        query_filters = []
        
        if start_date:
            query_filters.append(Certificate.issued_date >= start_date)
        if end_date:
            query_filters.append(Certificate.issued_date <= end_date)
        
        if query_filters:
            certificates = await Certificate.find(*query_filters).to_list()
        else:
            certificates = await Certificate.find().to_list()
        
        report_data = []
        for cert in certificates:
            report_data.append({
                "Certificate Number": cert.certificate_number,
                "Parcel ID": cert.parcel_id,
                "Owner Name": cert.owner_name,
                "National ID": cert.national_id,
                "Province": cert.province,
                "District": cert.district,
                "Sector": cert.sector,
                "Cell": cert.cell,
                "Village": cert.village,
                "Land Size (sqm)": cert.land_size,
                "Issued Date": cert.issued_date.strftime("%Y-%m-%d"),
                "Issued By": cert.issued_by,
                "Status": "Active"
            })
        
        return report_data
    
    def generate_csv_report(self, data: List[Dict[str, Any]]) -> str:
        """
        Generate CSV report from data
        Returns CSV string
        """
        if not data:
            return ""
        
        output = io.StringIO()
        fieldnames = list(data[0].keys())
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        
        writer.writeheader()
        writer.writerows(data)
        
        return output.getvalue()
    
    async def generate_summary_statistics(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Generate summary statistics for report header
        """
        if not start_date:
            start_date = datetime.utcnow() - timedelta(days=30)
        if not end_date:
            end_date = datetime.utcnow()
        
        # Properties
        total_properties = await Claim.find(
            Claim.created_at >= start_date,
            Claim.created_at <= end_date
        ).count()
        
        approved_properties = await Claim.find(
            Claim.status == "approved",
            Claim.created_at >= start_date,
            Claim.created_at <= end_date
        ).count()
        
        # Transactions
        total_transactions = await LandTransaction.find(
            LandTransaction.transaction_date >= start_date,
            LandTransaction.transaction_date <= end_date
        ).count()
        
        transactions = await LandTransaction.find(
            LandTransaction.transaction_date >= start_date,
            LandTransaction.transaction_date <= end_date
        ).to_list()
        transaction_value = sum(t.transaction_amount for t in transactions)
        
        # Certificates
        total_certificates = await Certificate.find(
            Certificate.issued_date >= start_date,
            Certificate.issued_date <= end_date
        ).count()
        
        # Tax
        tax_assessments = await TaxAssessment.find(
            TaxAssessment.assessment_date >= start_date,
            TaxAssessment.assessment_date <= end_date,
            TaxAssessment.payment_status == "paid"
        ).to_list()
        tax_collected = sum(a.tax_amount for a in tax_assessments)
        
        return {
            "report_period": {
                "start": start_date.strftime("%Y-%m-%d"),
                "end": end_date.strftime("%Y-%m-%d")
            },
            "properties": {
                "total_registered": total_properties,
                "approved": approved_properties,
                "approval_rate": round((approved_properties / total_properties * 100) if total_properties > 0 else 0, 1)
            },
            "transactions": {
                "total": total_transactions,
                "total_value": transaction_value
            },
            "certificates": {
                "total_issued": total_certificates
            },
            "taxes": {
                "total_collected": tax_collected
            },
            "generated_at": datetime.utcnow().isoformat()
        }
