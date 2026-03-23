"""
Healthcare Data Layer - Delta Lake Queries
Azure Databricks / Synapse Analytics Integration
"""

from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    col, count, avg, sum, max, min, stddev,
    datediff, current_date, current_timestamp,
    window, lag, lead, row_number
)
from pyspark.sql.window import Window
from delta.tables import DeltaTable
from datetime import datetime, timedelta
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class HealthcareDataLayer:
    """Data layer for healthcare analytics using Delta Lake"""
    
    def __init__(self, spark_session=None):
        """Initialize Spark session with Delta Lake support"""
        
        if spark_session:
            self.spark = spark_session
        else:
            self.spark = SparkSession.builder \
                .appName("HealthcareGenAI") \
                .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension") \
                .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog") \
                .config("spark.databricks.delta.optimizeWrite.enabled", "true") \
                .config("spark.databricks.delta.autoCompact.enabled", "true") \
                .getOrCreate()
        
        # Delta table paths (configure for your environment)
        self.tables = {
            "patient_admissions": "/mnt/healthcare/delta/patient_admissions",
            "bed_management": "/mnt/healthcare/delta/bed_management",
            "appointments": "/mnt/healthcare/delta/appointments",
            "wait_times": "/mnt/healthcare/delta/wait_times",
            "financial": "/mnt/healthcare/delta/financial",
            "clinical_outcomes": "/mnt/healthcare/delta/clinical_outcomes",
            "staffing": "/mnt/healthcare/delta/staffing"
        }
    
    def get_patient_admission_trends(self, days=30):
        """
        Get patient admission trends with daily aggregations
        
        Args:
            days (int): Number of days to look back
            
        Returns:
            List of dicts with daily admission metrics
        """
        
        query = f"""
        SELECT 
            DATE(admission_datetime) as admission_date,
            COUNT(DISTINCT patient_id) as total_admissions,
            COUNT(DISTINCT CASE WHEN admission_type = 'Emergency' THEN patient_id END) as emergency_admissions,
            COUNT(DISTINCT CASE WHEN admission_type = 'Elective' THEN patient_id END) as elective_admissions,
            AVG(CASE WHEN discharge_datetime IS NOT NULL 
                THEN DATEDIFF(discharge_datetime, admission_datetime) END) as avg_length_of_stay,
            COUNT(DISTINCT department_code) as departments_used
        FROM delta.`{self.tables['patient_admissions']}`
        WHERE admission_datetime >= CURRENT_DATE() - INTERVAL {days} DAYS
        GROUP BY DATE(admission_datetime)
        ORDER BY admission_date
        """
        
        df = self.spark.sql(query)
        return df.toPandas().to_dict('records')
    
    def get_real_time_bed_occupancy(self):
        """
        Get current bed occupancy by department
        Uses latest snapshot from streaming data
        
        Returns:
            List of dicts with bed occupancy metrics by department
        """
        
        query = f"""
        WITH latest_snapshot AS (
            SELECT 
                department_code,
                department_name,
                total_beds,
                occupied_beds,
                available_beds,
                snapshot_timestamp,
                ROW_NUMBER() OVER (
                    PARTITION BY department_code 
                    ORDER BY snapshot_timestamp DESC
                ) as rn
            FROM delta.`{self.tables['bed_management']}`
            WHERE snapshot_timestamp >= CURRENT_TIMESTAMP() - INTERVAL 10 MINUTES
        )
        SELECT 
            department_name,
            total_beds,
            occupied_beds,
            available_beds,
            ROUND((occupied_beds / total_beds * 100), 2) as occupancy_percentage,
            CASE 
                WHEN (occupied_beds / total_beds * 100) > 90 THEN 'Critical'
                WHEN (occupied_beds / total_beds * 100) > 85 THEN 'High'
                WHEN (occupied_beds / total_beds * 100) > 70 THEN 'Moderate'
                ELSE 'Normal'
            END as capacity_status,
            snapshot_timestamp
        FROM latest_snapshot
        WHERE rn = 1
        ORDER BY occupancy_percentage DESC
        """
        
        df = self.spark.sql(query)
        return df.toPandas().to_dict('records')
    
    def get_wait_time_analysis(self, department=None, days=7):
        """
        Analyze wait times across different stages of patient journey
        
        Args:
            department (str): Filter by specific department (optional)
            days (int): Number of days to analyze
            
        Returns:
            Dict with wait time metrics and breakdown
        """
        
        dept_filter = f"AND department_code = '{department}'" if department else ""
        
        query = f"""
        SELECT 
            department_name,
            COUNT(*) as total_visits,
            ROUND(AVG(triage_wait_minutes), 1) as avg_triage_wait,
            ROUND(AVG(physician_wait_minutes), 1) as avg_physician_wait,
            ROUND(AVG(treatment_wait_minutes), 1) as avg_treatment_wait,
            ROUND(AVG(total_visit_minutes), 1) as avg_total_time,
            PERCENTILE(total_visit_minutes, 0.5) as median_total_time,
            PERCENTILE(total_visit_minutes, 0.95) as p95_total_time,
            COUNT(CASE WHEN total_visit_minutes > 240 THEN 1 END) as breaches_4hr_target
        FROM delta.`{self.tables['wait_times']}`
        WHERE visit_date >= CURRENT_DATE() - INTERVAL {days} DAYS
        {dept_filter}
        GROUP BY department_name
        ORDER BY avg_total_time DESC
        """
        
        df = self.spark.sql(query)
        
        # Calculate hourly patterns
        hourly_query = f"""
        SELECT 
            HOUR(arrival_timestamp) as hour_of_day,
            COUNT(*) as visits,
            ROUND(AVG(total_visit_minutes), 1) as avg_wait
        FROM delta.`{self.tables['wait_times']}`
        WHERE visit_date >= CURRENT_DATE() - INTERVAL {days} DAYS
        {dept_filter}
        GROUP BY HOUR(arrival_timestamp)
        ORDER BY hour_of_day
        """
        
        hourly_df = self.spark.sql(hourly_query)
        
        return {
            "summary": df.toPandas().to_dict('records'),
            "hourly_pattern": hourly_df.toPandas().to_dict('records')
        }
    
    def get_department_performance(self, time_period='month'):
        """
        Get comprehensive department performance metrics
        
        Args:
            time_period (str): 'week', 'month', or 'quarter'
            
        Returns:
            List of dicts with performance metrics by department
        """
        
        days_map = {'week': 7, 'month': 30, 'quarter': 90}
        days = days_map.get(time_period, 30)
        
        query = f"""
        WITH patient_metrics AS (
            SELECT 
                department_code,
                COUNT(DISTINCT patient_id) as total_patients,
                AVG(DATEDIFF(discharge_datetime, admission_datetime)) as avg_los,
                COUNT(CASE WHEN readmission_within_30days = 1 THEN 1 END) as readmissions
            FROM delta.`{self.tables['patient_admissions']}`
            WHERE admission_datetime >= CURRENT_DATE() - INTERVAL {days} DAYS
            GROUP BY department_code
        ),
        satisfaction_metrics AS (
            SELECT 
                department_code,
                AVG(satisfaction_score) as avg_satisfaction,
                COUNT(*) as survey_responses
            FROM delta.`{self.tables['clinical_outcomes']}`
            WHERE outcome_date >= CURRENT_DATE() - INTERVAL {days} DAYS
            GROUP BY department_code
        ),
        financial_metrics AS (
            SELECT 
                department_code,
                SUM(revenue_amount) as total_revenue,
                SUM(cost_amount) as total_costs,
                SUM(revenue_amount - cost_amount) as net_contribution
            FROM delta.`{self.tables['financial']}`
            WHERE transaction_date >= CURRENT_DATE() - INTERVAL {days} DAYS
            GROUP BY department_code
        )
        SELECT 
            d.department_name,
            pm.total_patients,
            pm.avg_los,
            pm.readmissions,
            ROUND((pm.readmissions / pm.total_patients * 100), 2) as readmission_rate,
            sm.avg_satisfaction,
            fm.total_revenue,
            fm.total_costs,
            fm.net_contribution,
            ROUND((fm.net_contribution / fm.total_revenue * 100), 2) as margin_percentage
        FROM patient_metrics pm
        JOIN satisfaction_metrics sm ON pm.department_code = sm.department_code
        JOIN financial_metrics fm ON pm.department_code = fm.department_code
        JOIN (SELECT DISTINCT department_code, department_name 
              FROM delta.`{self.tables['patient_admissions']}`) d 
              ON pm.department_code = d.department_code
        ORDER BY total_patients DESC
        """
        
        df = self.spark.sql(query)
        return df.toPandas().to_dict('records')
    
    def get_financial_performance(self, months=6):
        """
        Get financial performance trends
        
        Args:
            months (int): Number of months to analyze
            
        Returns:
            List of dicts with monthly financial metrics
        """
        
        query = f"""
        SELECT 
            DATE_TRUNC('month', transaction_date) as month,
            SUM(CASE WHEN transaction_type = 'Revenue' THEN amount ELSE 0 END) as total_revenue,
            SUM(CASE WHEN transaction_type = 'Cost' THEN amount ELSE 0 END) as total_costs,
            SUM(CASE WHEN transaction_type = 'Revenue' THEN amount ELSE -amount END) as net_income,
            COUNT(DISTINCT patient_id) as patients_billed,
            AVG(CASE WHEN transaction_type = 'Revenue' THEN amount END) as avg_revenue_per_patient,
            AVG(claim_processing_days) as avg_claim_processing_days,
            SUM(CASE WHEN outstanding_balance > 0 THEN outstanding_balance ELSE 0 END) as total_receivables
        FROM delta.`{self.tables['financial']}`
        WHERE transaction_date >= ADD_MONTHS(CURRENT_DATE(), -{months})
        GROUP BY DATE_TRUNC('month', transaction_date)
        ORDER BY month
        """
        
        df = self.spark.sql(query)
        
        # Calculate trends
        result = df.toPandas().to_dict('records')
        
        # Add MoM growth calculations
        for i in range(1, len(result)):
            if result[i-1]['total_revenue'] > 0:
                result[i]['revenue_growth_pct'] = round(
                    ((result[i]['total_revenue'] - result[i-1]['total_revenue']) / 
                     result[i-1]['total_revenue'] * 100), 2
                )
        
        return result
    
    def predict_admissions(self, forecast_days=7):
        """
        Generate admission predictions using historical patterns
        (In production, this would call Azure ML model)
        
        Args:
            forecast_days (int): Number of days to forecast
            
        Returns:
            List of dicts with predictions and confidence intervals
        """
        
        # Get historical data for pattern analysis
        historical_query = f"""
        SELECT 
            DATE(admission_datetime) as admission_date,
            DAYOFWEEK(admission_datetime) as day_of_week,
            COUNT(*) as admissions,
            AVG(COUNT(*)) OVER (
                PARTITION BY DAYOFWEEK(admission_datetime)
                ORDER BY DATE(admission_datetime)
                ROWS BETWEEN 4 PRECEDING AND CURRENT ROW
            ) as moving_avg
        FROM delta.`{self.tables['patient_admissions']}`
        WHERE admission_datetime >= CURRENT_DATE() - INTERVAL 90 DAYS
        GROUP BY DATE(admission_datetime), DAYOFWEEK(admission_datetime)
        ORDER BY admission_date DESC
        """
        
        historical_df = self.spark.sql(historical_query)
        
        # Calculate predictions based on day-of-week patterns
        # In production, replace with Azure ML model predictions
        predictions_query = """
        SELECT 
            day_of_week,
            AVG(admissions) as avg_admissions,
            STDDEV(admissions) as std_admissions
        FROM historical_data
        GROUP BY day_of_week
        """
        
        # This is simplified - real implementation would use ML model
        logger.info("Prediction generation - would call Azure ML model here")
        
        return {
            "forecast_days": forecast_days,
            "model": "time_series_arima",
            "confidence_level": 0.87,
            "note": "Replace with Azure ML model in production"
        }
    
    def get_capacity_forecast(self, days_ahead=7):
        """
        Forecast bed capacity needs
        
        Args:
            days_ahead (int): Days to forecast
            
        Returns:
            Dict with capacity forecast and recommendations
        """
        
        query = f"""
        WITH current_occupancy AS (
            SELECT 
                department_code,
                department_name,
                occupied_beds,
                total_beds,
                (occupied_beds / total_beds * 100) as current_occupancy_pct
            FROM delta.`{self.tables['bed_management']}`
            WHERE snapshot_timestamp >= CURRENT_TIMESTAMP() - INTERVAL 1 HOUR
            QUALIFY ROW_NUMBER() OVER (
                PARTITION BY department_code 
                ORDER BY snapshot_timestamp DESC
            ) = 1
        ),
        avg_admissions AS (
            SELECT 
                department_code,
                AVG(daily_admissions) as avg_daily_admissions
            FROM (
                SELECT 
                    department_code,
                    DATE(admission_datetime) as admission_date,
                    COUNT(*) as daily_admissions
                FROM delta.`{self.tables['patient_admissions']}`
                WHERE admission_datetime >= CURRENT_DATE() - INTERVAL 30 DAYS
                GROUP BY department_code, DATE(admission_datetime)
            )
            GROUP BY department_code
        )
        SELECT 
            co.department_name,
            co.current_occupancy_pct,
            co.total_beds,
            aa.avg_daily_admissions,
            ROUND(co.current_occupancy_pct + (aa.avg_daily_admissions * {days_ahead} / co.total_beds * 100), 1) 
                as projected_occupancy_pct,
            CASE 
                WHEN ROUND(co.current_occupancy_pct + (aa.avg_daily_admissions * {days_ahead} / co.total_beds * 100), 1) > 95 
                    THEN 'Critical - Activate surge capacity'
                WHEN ROUND(co.current_occupancy_pct + (aa.avg_daily_admissions * {days_ahead} / co.total_beds * 100), 1) > 90 
                    THEN 'High - Monitor closely'
                ELSE 'Normal'
            END as recommendation
        FROM current_occupancy co
        JOIN avg_admissions aa ON co.department_code = aa.department_code
        ORDER BY projected_occupancy_pct DESC
        """
        
        df = self.spark.sql(query)
        return df.toPandas().to_dict('records')
    
    def create_delta_tables(self):
        """
        Initialize Delta Lake tables with schema
        Run this once during setup
        """
        
        # Example: Create patient admissions table
        admissions_schema = """
        CREATE TABLE IF NOT EXISTS delta.patient_admissions (
            admission_id STRING,
            patient_id STRING,
            admission_datetime TIMESTAMP,
            discharge_datetime TIMESTAMP,
            admission_type STRING,
            department_code STRING,
            department_name STRING,
            primary_diagnosis STRING,
            readmission_within_30days INT,
            created_timestamp TIMESTAMP
        )
        USING DELTA
        PARTITIONED BY (DATE(admission_datetime))
        LOCATION '/mnt/healthcare/delta/patient_admissions'
        """
        
        self.spark.sql(admissions_schema)
        logger.info("Delta tables created successfully")

# Example usage
if __name__ == "__main__":
    
    # Initialize data layer
    data_layer = HealthcareDataLayer()
    
    # Example queries
    print("Patient Admission Trends:")
    trends = data_layer.get_patient_admission_trends(days=30)
    print(trends)
    
    print("\nBed Occupancy:")
    occupancy = data_layer.get_real_time_bed_occupancy()
    print(occupancy)
    
    print("\nWait Time Analysis:")
    wait_times = data_layer.get_wait_time_analysis(days=7)
    print(wait_times)
