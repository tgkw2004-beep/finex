$base_url = "https://raw.githubusercontent.com/supabase/supabase/master/docker/volumes"

# Create directories in target
$dirs = @(
    "volumes/api",
    "volumes/db",
    "volumes/functions",
    "volumes/logs",
    "volumes/pooler",
    "volumes/snippets",
    "volumes/storage"
)

foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir
    }
}

# Download files
$files = @(
    @{ Path = "volumes/api/kong.yml"; Url = "$base_url/api/kong.yml" },
    @{ Path = "volumes/logs/vector.yml"; Url = "$base_url/logs/vector.yml" },
    @{ Path = "volumes/pooler/pooler.exs"; Url = "$base_url/pooler/pooler.exs" },
    @{ Path = "volumes/db/realtime.sql"; Url = "$base_url/db/realtime.sql" },
    @{ Path = "volumes/db/webhooks.sql"; Url = "$base_url/db/webhooks.sql" },
    @{ Path = "volumes/db/roles.sql"; Url = "$base_url/db/roles.sql" },
    @{ Path = "volumes/db/jwt.sql"; Url = "$base_url/db/jwt.sql" },
    @{ Path = "volumes/db/_supabase.sql"; Url = "$base_url/db/_supabase.sql" },
    @{ Path = "volumes/db/logs.sql"; Url = "$base_url/db/logs.sql" },
    @{ Path = "volumes/db/pooler.sql"; Url = "$base_url/db/pooler.sql" }
)

foreach ($file in $files) {
    if (-not (Test-Path $file.Path)) {
        Invoke-WebRequest -Uri $file.Url -OutFile $file.Path
    }
}

Write-Host "Volume setup complete in $(Get-Location)"
ls -R volumes
