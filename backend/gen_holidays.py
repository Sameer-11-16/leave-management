import holidays
import json
from datetime import date

def generate():
    # India holidays for the next 50 years (2026 to 2076)
    in_holidays = holidays.India(years=range(2026, 2077))
    
    holiday_list = []
    # Use items() to get date and name
    for dt, name in sorted(in_holidays.items()):
        holiday_list.append({
            "name": name,
            "date": dt.strftime("%Y-%m-%d")
        })
    
    with open('holidays_50yrs.json', 'w', encoding='utf-8') as f:
        json.dump(holiday_list, f, indent=2, ensure_ascii=False)
    
    print(f"Generated {len(holiday_list)} holidays in holidays_50yrs.json")

if __name__ == "__main__":
    generate()
