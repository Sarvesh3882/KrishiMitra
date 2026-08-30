"""
Test script to verify which Allied commodity data sources are actually available.

Tests:
1. data.gov.in Agmarknet API (known to timeout)
2. Alternative government APIs
3. Document findings

DO NOT USE WEB SCRAPING.
"""

import requests
import json
import time
from datetime import datetime

def test_data_gov_in_agmarknet():
    """Test the data.gov.in Agmarknet API for Allied commodities."""
    print("\n" + "="*80)
    print("Testing data.gov.in Agmarknet API")
    print("="*80)
    
    resource_id = "9ef84268-d588-465a-a308-a864a43d0070"
    base_url = "https://api.data.gov.in/resource/" + resource_id
    api_key = "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b"
    
    # Test commodities mentioned by user
    test_commodities = ["Egg", "Fish", "Rohu", "Katla", "Chicken", "Broiler", "Mutton", "Goat"]
    
    for commodity in test_commodities:
        print(f"\n--- Testing: {commodity} ---")
        
        params = {
            "api-key": api_key,
            "format": "json",
            "limit": 1,
            "filters[commodity]": commodity
        }
        
        try:
            start_time = time.time()
            response = requests.get(base_url, params=params, timeout=60)
            elapsed = time.time() - start_time
            
            print(f"HTTP Status: {response.status_code}")
            print(f"Response Time: {elapsed:.2f}s")
            
            if response.status_code == 200:
                data = response.json()
                records = data.get("records", [])
                print(f"Records Found: {len(records)}")
                
                if records:
                    print("First Record:")
                    print(json.dumps(records[0], indent=2))
                else:
                    print("No records found for this commodity")
            else:
                print(f"Error: {response.text[:200]}")
                
        except requests.Timeout:
            elapsed = time.time() - start_time
            print(f"TIMEOUT after {elapsed:.2f}s")
        except Exception as e:
            print(f"ERROR: {str(e)}")
    
    print("\n" + "="*80)


def test_alternative_apis():
    """Test alternative government APIs for Allied commodities."""
    print("\n" + "="*80)
    print("Testing Alternative APIs")
    print("="*80)
    
    # Test if any newer Agmarknet APIs exist
    test_urls = [
        "https://api.agmarknet.gov.in/v1/prices",
        "https://api.agmarknet.gov.in/v1/commodities",
        "https://agmarknet.gov.in/api/v1/prices",
        "https://api.agmarknet.nic.in/v1/prices"
    ]
    
    for url in test_urls:
        print(f"\nTesting: {url}")
        try:
            response = requests.get(url, timeout=10)
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                print(f"Response: {response.text[:500]}")
        except requests.Timeout:
            print("TIMEOUT")
        except Exception as e:
            print(f"ERROR: {str(e)}")
    
    print("\n" + "="*80)


def main():
    """Run all tests."""
    print("\n" + "="*80)
    print("ALLIED COMMODITY DATA SOURCE VERIFICATION")
    print(f"Test Date: {datetime.now().isoformat()}")
    print("="*80)
    
    print("\nUSER REQUIREMENTS:")
    print("- DO NOT use web scraping")
    print("- DO NOT create fake data")
    print("- ONLY use real APIs with actual data")
    print("- Test: Egg, Fish, Chicken, Poultry, Meat commodities")
    
    # Test data.gov.in Agmarknet
    test_data_gov_in_agmarknet()
    
    # Test alternative APIs
    test_alternative_apis()
    
    # Summary
    print("\n" + "="*80)
    print("SUMMARY & RECOMMENDATIONS")
    print("="*80)
    print("""
Based on testing:

1. data.gov.in Agmarknet API:
   - Previous tests showed 30-60s+ timeouts
   - This test will confirm current status
   
2. Agmarknet 2.0 API (api.agmarknet.gov.in):
   - User mentioned this, testing if it exists
   
3. Alternative Sources:
   - NECC egg data: Available on websites but NO public API
   - Fish prices: No public API found
   - Meat/Chicken: No public API found
   - Milk: No public API found

HONEST ASSESSMENT:
If no working APIs are found, providers should return NOT_AVAILABLE
rather than generating fake data.

The architecture is ready. Each provider can be updated independently
when a reliable data source becomes available.
    """)


if __name__ == "__main__":
    main()
