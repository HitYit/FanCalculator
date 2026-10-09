Add-Type -AssemblyName System.Drawing
$iconRoot = Join-Path $PSScriptRoot '..\public\icons'
foreach ($size in @(192, 512)) {
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#13765b'))
    $scale = $size / 512.0
    $graphics.ScaleTransform($scale, $scale)
    $shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#0a513f'))
    $faceBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#fffdf4'))
    $greenBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#14765b'))
    $redBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#cc604a'))
    $graphics.FillRectangle($shadowBrush, 130, 100, 252, 330)
    $graphics.FillRectangle($faceBrush, 130, 78, 252, 330)
    foreach ($barY in @(143, 202, 261)) { $graphics.FillRectangle($greenBrush, 199, $barY, 114, 30) }
    $graphics.FillEllipse($redBrush, 242, 334, 28, 28)
    $bitmap.Save((Join-Path $iconRoot "icon-$size.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $shadowBrush.Dispose(); $faceBrush.Dispose(); $greenBrush.Dispose(); $redBrush.Dispose()
    $graphics.Dispose(); $bitmap.Dispose()
}
