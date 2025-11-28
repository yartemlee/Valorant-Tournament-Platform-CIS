# Script to safely replace simple any types with unknown
# Only for simple cases: error parameters, value parameters, event handlers

$files = @(
    "src\components\profile\SettingsTab.tsx",
    "src\components\profile\SocialLinks.tsx", 
    "src\components\teams\TeamActivitySection.tsx",
    "src\components\teams\TeamHeroSection.tsx",
    "src\components\teams\TeamRosterSection.tsx",
    "src\components\teams\TeamStatsSection.tsx",
    "src\components\teams\manage\TeamApplicationsTab.tsx",
    "src\pages\Profile.tsx",
    "src\pages\TeamDetails.tsx",
    "src\pages\TeamManage.tsx",
    "src\pages\TournamentDetails.tsx",
    "src\pages\Tournaments.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -Encoding UTF8
        
        # Simple safe replacements
        $content = $content -replace 'error: any\)', 'error: unknown)'
        $content = $content -replace 'value: any\)', 'value: unknown)'
        $content = $content -replace ': any\[\]', ': unknown[]'
        $content = $content -replace 'icon: any', 'icon: React.ComponentType<{ className?: string }> | null'
        $content = $content -replace 'userProfile\?: any', 'userProfile?: unknown'
        $content = $content -replace 'members: any\[\]', 'members: unknown[]'
        
        # Save with UTF8 without BOM
        [System.IO.File]::WriteAllText((Resolve-Path $file).Path, $content, (New-Object System.Text.UTF8Encoding $false))
        Write-Host "Processed: $file"
    } else {
        Write-Host "Not found: $file" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Done! Run 'npm run lint' to verify." -ForegroundColor Green