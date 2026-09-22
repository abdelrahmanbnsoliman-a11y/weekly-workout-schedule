Add-Type -AssemblyName System.Drawing
$sizes = 16, 32, 48, 256
$pngs = foreach ($n in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap $n, $n
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'AntiAlias'
    $g.Clear([System.Drawing.Color]::Transparent)
    $r = $n * 0.2
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc(0, 0, $r * 2, $r * 2, 180, 90); $path.AddArc($n - $r * 2 - 1, 0, $r * 2, $r * 2, 270, 90)
    $path.AddArc($n - $r * 2 - 1, $n - $r * 2 - 1, $r * 2, $r * 2, 0, 90); $path.AddArc(0, $n - $r * 2 - 1, $r * 2, $r * 2, 90, 90)
    $g.FillPath((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(0xC2, 0x3B, 0x33))), $path)
    # dumbbell
    $w = [System.Drawing.Brushes]::White
    $u = $n / 16.0
    $g.FillRectangle($w, 3.5 * $u, 7.2 * $u, 9 * $u, 1.6 * $u)
    $g.FillRectangle($w, 2 * $u, 4.5 * $u, 2 * $u, 7 * $u)
    $g.FillRectangle($w, 12 * $u, 4.5 * $u, 2 * $u, 7 * $u)
    $g.FillRectangle($w, 0.9 * $u, 5.8 * $u, 1.3 * $u, 4.4 * $u)
    $g.FillRectangle($w, 13.8 * $u, 5.8 * $u, 1.3 * $u, 4.4 * $u)
    $g.Dispose()
    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    , $ms.ToArray()
}
$out = New-Object System.IO.MemoryStream
$bw = New-Object System.IO.BinaryWriter $out
$bw.Write([UInt16]0); $bw.Write([UInt16]1); $bw.Write([UInt16]$sizes.Count)
$offset = 6 + 16 * $sizes.Count
for ($i = 0; $i -lt $sizes.Count; $i++) {
    $s = $sizes[$i]; $b = if ($s -ge 256) { 0 } else { $s }
    $bw.Write([byte]$b); $bw.Write([byte]$b); $bw.Write([byte]0); $bw.Write([byte]0)
    $bw.Write([UInt16]1); $bw.Write([UInt16]32); $bw.Write([UInt32]$pngs[$i].Length); $bw.Write([UInt32]$offset)
    $offset += $pngs[$i].Length
}
foreach ($p in $pngs) { $bw.Write($p) }
[System.IO.File]::WriteAllBytes("$PSScriptRoot\app.ico", $out.ToArray())
