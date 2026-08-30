"""
Direct test of data.gov.in AGMARKNET API for Allied commodities.
This script tests OUTSIDE of FastAPI to verify actual data availability.
"""

import requests
import json
import time

# API configuration
BASE_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
API_KEY = "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b"

# Commodities to test
COMMODITIES = [
    "Egg",
    "Fish",
    "Rohu",
    "Katla",
    "Chicken",
    "Broiler",
    "Mutton",
    "Goat"
]

def test_commodity(commodity_name, with_state=False, timeout=30):
    """
    Test a single commodity against the AGMARKNET API.
    
    Args:
        commodity_name: Name of commodity to search
        with_state: Whether to include state filter
        timeout: Request timeout in seconds
    
    Returns:
        Dict with test results
    """
    print(f"\n{'='*80}")
    print(f"Testing: {commodity_name}")
    print(f"{'='*80}")
    
    # Build request parameters
    params = {
        "api-key": API_KEY,
        "format": "json",
        "limit": "1",
        "offset": "0",
        "filters[commodity]": commodity_name
    }
    
    if with_state:
        params["filters[state]"] = "Maharashtra"
        print(f"State Filter: Maharashtra")
    else:
        print(f"State Filter: None (all states)")
    
    print(f"Timeout: {timeout}s")
    print(f"\nRequest URL: {BASE_URL}")
    print(f"Parameters: {json.dumps(params, indent=2)}")
    
    try:
        print(f"\nMaking HTTP request...")
        start_time = time.time()
        
        response = requests.get(
            BASE_URL,
            params=params,
            timeout=timeout
        )
        
        elapsed = time.time() - start_time
        print(f"Response time: {elapsed:.2f}s")
        print(f"HTTP Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            total = data.get("total", 0)
            count = data.get("count", 0)
            records = data.get("records", [])
            
            print(f"\nResponse Summary:")
            print(f"  Total records: {total}")
            print(f"  Count returned: {count}")
            print(f"  Records in response: {len(records)}")
            
            if records:
                print(f"\n✅ DATA FOUND!")
                print(f"\nFirst Record (Raw JSON):")
                print(json.dumps(records[0], indent=2))
                
                # Extract key fields
                record = records[0]
                print(f"\n📋 Key Fields:")
                print(f"  Commodity (exact): '{record.get('commodity', 'N/A')}'")
                print(f"  State: {record.get('state', 'N/A')}")
                print(f"  District: {record.get('district', 'N/A')}")
                print(f"  Market: {record.get('market', 'N/A')}")
                print(f"  Min Price: {record.get('min_price', 'N/A')}")
                print(f"  Max Price: {record.get('max_price', 'N/A')}")
                print(f"  Modal Price: {record.get('modal_price', 'N/A')}")
                print(f"  Variety: {record.get('variety', 'N/A')}")
                print(f"  Grade: {record.get('grade', 'N/A')}")
                print(f"  Date: {record.get('price_date', 'N/A')}")
                
                return {
                    "commodity": commodity_name,
                    "status": "SUCCESS",
                    "http_status": response.status_code,
                    "total_records": total,
                    "exact_commodity_name": record.get('commodity'),
                    "sample_record": record
                }
            else:
                print(f"\n❌ NO DATA - API returned 0 records")
                return {
                    "commodity": commodity_name,
                    "status": "NO_DATA",
                    "http_status": response.status_code,
                    "total_records": 0,
                    "exact_commodity_name": None,
                    "sample_record": None
                }
        
        elif response.status_code == 429:
            print(f"\n⚠️ RATE LIMITED")
            print(f"Response: {response.text[:200]}")
            return {
                "commodity": commodity_name,
                "status": "RATE_LIMITED",
                "http_status": 429,
                "total_records": None,
                "exact_commodity_name": None,
                "sample_record": None
            }
        
        else:
            print(f"\n❌ HTTP ERROR")
            print(f"Response: {response.text[:200]}")
            return {
                "commodity": commodity_name,
                "status": "HTTP_ERROR",
                "http_status": response.status_code,
                "total_records": None,
                "exact_commodity_name": None,
                "sample_record": None
            }
    
    except requests.exceptions.Timeout:
        print(f"\n⏱️ TIMEOUT - Request exceeded {timeout}s")
        return {
            "commodity": commodity_name,
            "status": "TIMEOUT",
            "http_status": None,
            "total_records": None,
            "exact_commodity_name": None,
            "sample_record": None
        }
    
    except requests.exceptions.RequestException as e:
        print(f"\n❌ REQUEST ERROR: {type(e).__name__}: {str(e)}")
        return {
            "commodity": commodity_name,
            "status": "REQUEST_ERROR",
            "http_status": None,
            "total_records": None,
            "exact_commodity_name": None,
            "sample_record": None,
            "error": str(e)
        }
    
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {type(e).__name__}: {str(e)}")
        return {
            "commodity": commodity_name,
            "status": "ERROR",
            "http_status": None,
            "total_records": None,
            "exact_commodity_name": None,
            "sample_record": None,
            "error": str(e)
        }


def main():
    """Run tests for all commodities."""
    print("\n" + "="*80)
    print("AGMARKNET API DIRECT TEST - Allied Commodities")
    print("="*80)
    print(f"\nAPI Endpoint: {BASE_URL}")
    print(f"Resource ID: 9ef84268-d588-465a-a308-a864a43d0070")
    print(f"Testing {len(COMMODITIES)} commodities")
    print("\nThis test runs OUTSIDE FastAPI to verify actual data availability.")
    
    results = []
    
    # First pass: Test with no state filter, short timeout
    print("\n" + "="*80)
    print("PASS 1: No state filter, 30s timeout")
    print("="*80)
    
    for commodity in COMMODITIES:
        result = test_commodity(commodity, with_state=False, timeout=30)
        results.append(result)
        
        # If rate limited, wait before next request
        if result["status"] == "RATE_LIMITED":
            print("\n⏳ Rate limited - waiting 10 seconds...")
            time.sleep(10)
        else:
            # Small delay between requests
            time.sleep(2)
    
    # Check if we got any timeouts and retry with longer timeout
    timeout_commodities = [r for r in results if r["status"] == "TIMEOUT"]
    if timeout_commodities:
        print("\n" + "="*80)
        print(f"PASS 2: Retry {len(timeout_commodities)} timed-out commodities with 60s timeout")
        print("="*80)
        
        for result in timeout_commodities:
            commodity = result["commodity"]
            retry_result = test_commodity(commodity, with_state=False, timeout=60)
            
            # Update result
            idx = next(i for i, r in enumerate(results) if r["commodity"] == commodity)
            results[idx] = retry_result
            
            time.sleep(2)
    
    # Final Summary
    print("\n" + "="*80)
    print("FINAL SUMMARY")
    print("="*80)
    
    print("\n✅ CONFIRMED AVAILABLE (Real Data):")
    available = [r for r in results if r["status"] == "SUCCESS"]
    if available:
        for r in available:
            print(f"  - {r['commodity']:15} (Exact name in API: '{r['exact_commodity_name']}', Records: {r['total_records']})")
    else:
        print("  None")
    
    print("\n❌ NO DATA (Not in AGMARKNET):")
    no_data = [r for r in results if r["status"] == "NO_DATA"]
    if no_data:
        for r in no_data:
            print(f"  - {r['commodity']:15} (API returned 0 records)")
    else:
        print("  None")
    
    print("\n⚠️ ERRORS/ISSUES:")
    errors = [r for r in results if r["status"] not in ["SUCCESS", "NO_DATA"]]
    if errors:
        for r in errors:
            print(f"  - {r['commodity']:15} ({r['status']})")
    else:
        print("  None")
    
    print("\n" + "="*80)
    print("RECOMMENDATIONS FOR agmarknet.py")
    print("="*80)
    
    if available:
        print("\n✅ Update ALLIED_COMMODITIES with confirmed names:")
        
        # Group by apparent category
        eggs = [r for r in available if 'egg' in r['commodity'].lower()]
        fish = [r for r in available if any(x in r['commodity'].lower() for x in ['fish', 'rohu', 'katla'])]
        poultry = [r for r in available if any(x in r['commodity'].lower() for x in ['chicken', 'broiler'])]
        meat = [r for r in available if any(x in r['commodity'].lower() for x in ['mutton', 'goat'])]
        
        if eggs:
            print('\n"egg": [')
            for r in eggs:
                print(f'    "{r["exact_commodity_name"]}",')
            print('],')
        
        if fish:
            print('\n"fish": [')
            for r in fish:
                print(f'    "{r["exact_commodity_name"]}",')
            print('],')
        
        if poultry:
            print('\n"poultry": [')
            for r in poultry:
                print(f'    "{r["exact_commodity_name"]}",')
            print('],')
        
        if meat:
            print('\n"meat": [')
            for r in meat:
                print(f'    "{r["exact_commodity_name"]}",')
            print('],')
    
    if no_data:
        print("\n❌ Remove from ALLIED_COMMODITIES (no data):")
        for r in no_data:
            print(f'    # "{r["commodity"]}" - NO DATA IN AGMARKNET')
    
    print("\n" + "="*80)
    print("TEST COMPLETE")
    print("="*80)
    
    # Save results to file
    with open("agmarknet_test_results.json", "w") as f:
        json.dump(results, f, indent=2, default=str)
    
    print("\n📄 Detailed results saved to: agmarknet_test_results.json")


if __name__ == "__main__":
    main()
