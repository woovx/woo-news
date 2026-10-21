# 쓰레드 토큰을 확인하고, 1시간짜리면 60일짜리로 바꿔 클립보드에 복사한다.
# 이미 60일짜리면 교환 없이 그대로 클립보드에 복사한다.
# 입력값과 결과 토큰은 화면에 찍지 않는다. 사용자가 직접 실행한다.
# 실행: powershell -ExecutionPolicy Bypass -File scriptsexchange-threads-token.ps1
$api = "https://graph.threads.net"
function Plain($s) { [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)) }
function ErrText($e) {
  if ($e.ErrorDetails -and $e.ErrorDetails.Message) { return $e.ErrorDetails.Message }
  try { return (New-Object IO.StreamReader($e.Exception.Response.GetResponseStream())).ReadToEnd() } catch { return $e.Exception.Message }
}

$token = (Plain (Read-Host "쓰레드 토큰을 붙여넣고 Enter" -AsSecureString)).Trim()
if (-not $token) { Write-Host "토큰이 비어 있어요." -ForegroundColor Red; exit 1 }

# 1) 토큰 확인: 어느 계정인지, 언제 만료되는지
try {
  $me = Invoke-RestMethod -Uri "$api/v1.0/me" -Body @{ fields = "id,username"; access_token = $token }
  Write-Host "토큰 계정: @$($me.username)"
} catch {
  Write-Host "토큰이 유효하지 않아요 (만료됐거나 잘못 복사됨)." -ForegroundColor Red
  Write-Host (ErrText $_)
  exit 1
}
$days = $null
try {
  $dbg = (Invoke-RestMethod -Uri "$api/v1.0/debug_token" -Body @{ input_token = $token; access_token = $token }).data
  if ($dbg.expires_at -gt 0) {
    $days = [math]::Round(($dbg.expires_at - [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()) / 86400, 1)
    Write-Host "남은 기간: 약 $days 일"
  }
  if ($dbg.scopes) { Write-Host "권한: $($dbg.scopes -join ", ")" }
} catch {
  Write-Host "(만료일 확인은 건너뜀)"
}

# 2) 이미 장기 토큰(남은 기간 1일 초과)이면 그대로 복사
if ($days -ne $null -and $days -gt 1) {
  Set-Clipboard -Value $token
  Write-Host "이미 장기 토큰이에요. 그대로 클립보드에 복사했어요. GitHub Secret THREADS_TOKEN 에 붙여넣으세요." -ForegroundColor Green
  exit 0
}

# 3) 단기 토큰이면 앱 시크릿으로 교환
$secret = (Plain (Read-Host "단기 토큰이에요. Threads 앱 시크릿 코드를 붙여넣고 Enter" -AsSecureString)).Trim()
try {
  $r = Invoke-RestMethod -Uri "$api/access_token" -Body @{ grant_type = "th_exchange_token"; client_secret = $secret; access_token = $token }
} catch {
  Write-Host "교환 실패. 아래 메시지를 알려 주세요 (토큰 값은 들어 있지 않아요)." -ForegroundColor Red
  Write-Host (ErrText $_)
  exit 1
}
Set-Clipboard -Value $r.access_token
$d = [math]::Round($r.expires_in / 86400)
Write-Host "장기 토큰을 클립보드에 복사했어요 (약 $d 일 유효). GitHub Secret THREADS_TOKEN 에 붙여넣으세요." -ForegroundColor Green
