Write-Host "`n=== COMPREHENSIVE SEARCH TESTS ===`n" -ForegroundColor Cyan

function Test-Product {
    param($Product, $Category)
    
    try {
        $uri = "http://localhost:8000/api/v1/nearby-selling-points?product=$Product&location=Kopergaon&radius=5000"
        $response = Invoke-WebRequest -Uri $uri -UseBasicParsing -ErrorAction Stop
        $data = $response.Content | ConvertFrom-Json
        
        $count = $data.total_count
        $topNames = ($data.selling_points | Select-Object -First 2 name).name
        
        if ($count -eq 0) {
            Write-Host "  $Product : 0 results" -ForegroundColor $(if ($Category -eq "Non-Agricultural") { "Green" } else { "Red" })
        } else {
            Write-Host "  $Product : $count results" -ForegroundColor Green
            Write-Host "    Top: $($topNames -join ', ')" -ForegroundColor Gray
        }
    } catch {
        Write-Host "  $Product : ERROR - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Vegetables
Write-Host "VEGETABLES (Should show Markets/Mandis):" -ForegroundColor Yellow
Test-Product "Onion" "Vegetable"
Test-Product "Tomato" "Vegetable"
Test-Product "Potato" "Vegetable"
Test-Product "Ladyfinger" "Vegetable"
Test-Product "Broccoli" "Vegetable"
Test-Product "Carrot" "Vegetable"

# Fruits
Write-Host "`nFRUITS (Should show Fruit Markets):" -ForegroundColor Yellow
Test-Product "Apple" "Fruit"
Test-Product "Mango" "Fruit"
Test-Product "Banana" "Fruit"

# Dairy
Write-Host "`nDAIRY (Should show Dairy Centers):" -ForegroundColor Yellow
Test-Product "Milk" "Dairy"
Test-Product "Ghee" "Dairy"
Test-Product "Paneer" "Dairy"

# Spices
Write-Host "`nSPICES (Should show Kirana/Grocery Stores):" -ForegroundColor Yellow
Test-Product "Turmeric" "Spice"
Test-Product "Ginger" "Spice"
Test-Product "Garlic" "Spice"
Test-Product "Coriander" "Spice"

# Grains
Write-Host "`nGRAINS (Should show Grain Markets):" -ForegroundColor Yellow
Test-Product "Wheat" "Grain"
Test-Product "Rice" "Grain"
Test-Product "Maize" "Grain"

# Poultry/Eggs
Write-Host "`nPOULTRY/EGGS (Should show Kirana Stores):" -ForegroundColor Yellow
Test-Product "Eggs" "Poultry"
Test-Product "Chicken" "Poultry"

# Fish
Write-Host "`nFISH (Should show Fish Markets):" -ForegroundColor Yellow
Test-Product "Fish" "Fish"

# Commercial Crops
Write-Host "`nCOMMERCIAL CROPS (Should show APMC/Mandis):" -ForegroundColor Yellow
Test-Product "Cotton" "Commercial"
Test-Product "Sugarcane" "Commercial"

# Non-Agricultural (should return 0)
Write-Host "`nNON-AGRICULTURAL (Should be 0 results):" -ForegroundColor Yellow
Test-Product "book" "Non-Agricultural"
Test-Product "laptop" "Non-Agricultural"
Test-Product "phone" "Non-Agricultural"

Write-Host "`n=== TESTS COMPLETE ===`n" -ForegroundColor Cyan
