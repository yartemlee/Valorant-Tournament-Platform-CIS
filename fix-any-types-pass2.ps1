# Second pass - fix remaining any types in map/filter callbacks and type assertions

$files = @(
    "src\components\profile\SocialLinks.tsx",
    "src\components\teams\TeamActivitySection.tsx",
    "src\components\teams\TeamStatsSection.tsx",
    "src\components\teams\manage\TeamApplicationsTab.tsx",
    "src\components\tournaments\MatchEditDialog.tsx",
    "src\components\tournaments\TournamentBracket.tsx",
    "src\pages\Profile.tsx",
    "src\pages\TeamDetails.tsx",
    "src\pages\TeamManage.tsx",
    "src\pages\TournamentDetails.tsx",
    "src\pages\Tournaments.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -Encoding UTF8
        
        # Replace map/filter callbacks with implicit typing
        $content = $content -replace '\((\w+): any\)', '($1)'
        $content = $content -replace '\((\w+): any,', '($1,'
        
        # Replace 'as any' type assertions
        $content = $content -replace ' as any\)', ')'
        $content = $content -replace '\} as any\);', '});'
        
        # Save with UTF8 without BOM
        [System.IO.File]::WriteAllText((Resolve-Path $file).Path, $content, (New-Object System.Text.UTF8Encoding $false))
        Write-Host "Processed: $file"
    } else {
        Write-Host "Not found: $file" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Second pass done! Run 'npm run lint' to verify." -ForegroundColor Green
