# 쓰레드 단기 토큰(1시간)을 장기 토큰(60일)으로 바꿔 클립보드에 복사한다.
# 입력값과 결과 토큰은 화면에 찍지 않는다. 사용자가 직접 실행한다.
# 실행: powershell -ExecutionPolicy Bypass -File scriptsexchange-threads-token.ps1
$short = Read-Host "쓰레드 단기 토큰을 붙여넣고 Enter" -AsSecureString
$secret = Read-Host "쓰레드 앱 시크릿(Threads 앱 시크릿 코드)을 붙여넣고 Enter" -AsSecureString
function Plain($s) { [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)) }
try {
  $r = Invoke-RestMethod -Uri "https://graph.threads.net/access_token" -Body @{ grant_type = "th_exchange_token"; client_secret = (Plain $secret); access_token = (Plain $short) }
} catch {
  Write-Host "교환 실패. 토큰이 이미 장기 토큰이거나, 1시간이 지났거나, 시크릿이 다릅니다." -ForegroundColor Red
  Write-Host $_.ErrorDetails.Message
  exit 1
}
Set-Clipboard -Value $r.access_token
$days = [math]::Round($r.expires_in / 86400)
Write-Host "장기 토큰을 클립보드에 복사했어요 (약 $days 일 유효). GitHub Secret THREADS_TOKEN 에 붙여넣으세요." -ForegroundColor Green
