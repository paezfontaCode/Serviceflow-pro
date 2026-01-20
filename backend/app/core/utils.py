from datetime import datetime, timedelta

def calculate_warranty_expiration(start_date: datetime, days: int = 7) -> datetime:
    """
    Calculates warranty expiration date adding 'days' business days.
    Skips Sundays.
    Hardcoded holidays can be added here.
    """
    current_date = start_date
    added_days = 0
    while added_days < days:
        current_date += timedelta(days=1)
        # 6 = Sunday (Monday is 0)
        if current_date.weekday() != 6:
            added_days += 1
            
    # Set time to end of day? Or same time? Usually end of day is better for customer.
    # User didn't specify, but same time is standard.
    return current_date
