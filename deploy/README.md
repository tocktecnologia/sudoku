# Deploy (PowerShell)

Execute a partir da raiz do projeto (`video-relevant-cuts`):

```powershell
python .\deploy\deploy_web_hostgator.py --skip-install --build-dir dist
```

## Se der erro de dependencias no Windows

```powershell
npm install
python .\deploy\deploy_web_hostgator.py --skip-install --build-dir dist
```
