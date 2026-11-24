yAdd-Type -AssemblyName System.Drawing

$desktop = "C:\Users\HP\Desktop"
$logoPath = Join-Path $desktop "logo.jpeg"
$logoSrc = [System.Drawing.Image]::FromFile($logoPath)

$banner = New-Object System.Drawing.Bitmap(1024, 500)
$g = [System.Drawing.Graphics]::FromImage($banner)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

# 1. Fond Dégradé Bleu Royal / Nuit (#002B66 vers #003880)
$rect = New-Object System.Drawing.Rectangle(0, 0, 1024, 500)
$c1 = [System.Drawing.Color]::FromArgb(0, 38, 95)
$c2 = [System.Drawing.Color]::FromArgb(0, 56, 128)
$gradientBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $c1, $c2, 45.0)
$g.FillRectangle($gradientBrush, $rect)

# 2. Cercle ou badge blanc élégant pour faire ressortir le logo à gauche
$cardSize = 340
$cardX = 70
$cardY = 80

# Ombre douce du badge
$shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(40, 0, 0, 0))
$g.FillEllipse($shadowBrush, ($cardX - 4), ($cardY + 6), ($cardSize + 8), ($cardSize + 8))

# Badge blanc pour le logo
$whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$g.FillEllipse($whiteBrush, $cardX, $cardY, $cardSize, $cardSize)

# Logo dessiné à l'intérieur du badge blanc
$pad = 26
$g.DrawImage($logoSrc, ($cardX + $pad), ($cardY + $pad), ($cardSize - 2 * $pad), ($cardSize - 2 * $pad))

# 3. Textes à droite (Police Segoe UI / Arial)
$titleFont = New-Object System.Drawing.Font("Segoe UI", 48, [System.Drawing.FontStyle]::Bold)
$subFont = New-Object System.Drawing.Font("Segoe UI", 21, [System.Drawing.FontStyle]::Bold)
$badgeFont = New-Object System.Drawing.Font("Segoe UI", 13, [System.Drawing.FontStyle]::Bold)

$textX = 450

# Petit badge "SÉNÉGAL" en haut
$tagRect = New-Object System.Drawing.Rectangle($textX, 120, 140, 30)
$tagBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(232, 160, 8)) # Or chaud #E8A008
$tagTextBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0, 38, 95))
$g.FillRectangle($tagBrush, $tagRect)

$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center
$g.DrawString("SÉNÉGAL", $badgeFont, $tagTextBrush, [System.Drawing.RectangleF]::op_Implicit($tagRect), $sf)

# Titre Principal : Logetudiant
$whiteTextBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$g.DrawString("Logetudiant", $titleFont, $whiteTextBrush, $textX, 165)

# Sous-titre : Logement & Colocation
$goldBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(245, 185, 60))
$g.DrawString("Logement & Colocation", $subFont, $goldBrush, $textX, 255)

# Troisième ligne : Près de votre université
$grayBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(210, 225, 250))
$descFont = New-Object System.Drawing.Font("Segoe UI", 16, [System.Drawing.FontStyle]::Regular)
$g.DrawString("Près des universités et grandes écoles", $descFont, $grayBrush, $textX, 300)

# Sauvegarde
$outPath = Join-Path $desktop "banniere_bleue_1024x500.png"
if (Test-Path $outPath) { Remove-Item $outPath -Force -ErrorAction SilentlyContinue }
$banner.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$gradientBrush.Dispose()
$whiteBrush.Dispose()
$shadowBrush.Dispose()
$tagBrush.Dispose()
$tagTextBrush.Dispose()
$whiteTextBrush.Dispose()
$goldBrush.Dispose()
$grayBrush.Dispose()
$titleFont.Dispose()
$subFont.Dispose()
$badgeFont.Dispose()
$descFont.Dispose()
$banner.Dispose()
$logoSrc.Dispose()

Write-Host "Banniere bleue générée avec succès sur le Bureau !"
