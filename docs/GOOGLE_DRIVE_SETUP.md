# OSKA PLAY — Google Drive 5TB Integration Setup

## 1. Overview
The owner's 5TB Google Drive acts as the private master repository for all game source code, compiled WebAssembly builds, artwork, and backup archives.

---

## 2. Directory Hierarchy

Create the following folder structure inside the root of your Google Drive:

```
OSKA-PLAY/
|-- 01-GAME-SOURCE-LIBRARY/
|   |-- Browser-Ready/
|   |-- Source-Available/
|   |-- Windows-Native/
|
|-- 02-APPROVED-BROWSER-BUILDS/
|   |-- freedoom-v0.13.0-wasm.zip
|   |-- 2048-html5-canvas-bundle.zip
|   |-- dungeon-3d-raycaster.zip
|
|-- 03-NATIVE-PC-DOWNLOADS/
|   |-- opentyrian-v2.1-windows-x64.zip
|
|-- 04-GAME-ARTWORK/
|   |-- covers/
|   |-- banners/
|   |-- screenshots/
|
|-- 05-GAME-METADATA/
|   |-- catalog.json
|
|-- 06-LICENSE-DOCUMENTS/
|   |-- GPL-2.0.txt
|   |-- BSD-3-Clause.txt
|
|-- 07-PRIVATE-BACKUPS/
```

---

## 3. Google Cloud OAuth 2.0 Configuration

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project named `OSKA-PLAY-ADMIN`.
3. Under **APIs & Services**, enable the **Google Drive API**.
4. Configure the **OAuth Consent Screen**:
   - User Type: External (Testing).
   - Test users: Add the owner's Google account email.
5. Create Credentials -> **OAuth client ID**:
   - Application type: Web application.
   - Authorized JavaScript origins: `http://localhost:5173`, `https://your-domain.pages.dev`.
   - Authorized redirect URIs: `http://localhost:5173/auth/callback`.
6. Select the minimal required OAuth scope:
   - `https://www.googleapis.com/auth/drive.file` (Permits access only to files opened or created by the application, preventing exposure of the user's personal Drive contents).
