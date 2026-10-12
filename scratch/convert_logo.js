const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const jpgPath = 'C:\\Users\\DANISH KHAN\\.gemini\\antigravity-ide\\brain\\7e427c7a-907c-48aa-81f1-5bf9e7da24c0\\.user_uploaded\\media_1791261729618.jpg';
const psScript = `
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile('${jpgPath.replace(/\\/g, '\\\\')}')
Write-Host "Loaded image: $($img.Width) x $($img.Height)"
$out1 = 'c:\\Users\\DANISH KHAN\\Desktop\\Kea_Project\\KEA-Mobile-App\\assets\\kea-logo-new-uploaded.png'
$img.Save($out1, [System.Drawing.Imaging.ImageFormat]::Png)
$img.Dispose()
Write-Host "Saved PNG successfully"
`;

fs.writeFileSync(path.join(__dirname, 'convert.ps1'), psScript);
const scriptPath = path.join(__dirname, 'convert.ps1');
const output = execSync(`powershell -ExecutionPolicy Bypass -File "${scriptPath}"`).toString();
console.log(output);
