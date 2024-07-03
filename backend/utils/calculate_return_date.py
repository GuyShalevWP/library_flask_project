from datetime import datetime, timedelta

# Calculate return date 
def calculate_return_date(borrow_date, return_type):
    borrow_date = datetime.strptime(borrow_date, '%d-%m-%Y')
    if return_type == 1:
        return borrow_date + timedelta(days=10)
    elif return_type == 2:
        return borrow_date + timedelta(days=5)
    elif return_type == 3:
        return borrow_date + timedelta(days=2)
    else:
        raise ValueError('Invalid return type')