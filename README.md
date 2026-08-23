# Tralala Game — Android (Capacitor) na build

Ito ay isang **Capacitor** wrapper ng laro mo (`www/` = mismong laman
ng `my-game` mo - `index.html`/`js`/`style.css`/`assets`, walang
binago dito) - binabalot lang ito ng native Android shell (WebView) at
sinisigurong **landscape lang** (naka-lock sa antas ng
`AndroidManifest.xml`, hindi lang CSS).

May kasama nang `.github/workflows/android-build.yml` na awtomatikong
gagawa ng APK sa **GitHub Actions** - hindi mo na kailangan mag-install
ng Android Studio sa sarili mong computer.

## Paano gamitin (unang beses)

1. **Gumawa ng bagong GitHub repository** (public o private, kahit
   alin) - huwag munang lagyan ng README/gitignore doon (mas madali
   kung blangko).

2. **I-upload ang buong laman ng zip na ito** papunta sa repo -
   pinakamadali kung gagamit ka ng GitHub Desktop, o command line:

   ```bash
   cd my-game-android          # yung na-extract na folder na ito
   git init
   git add .
   git commit -m "Initial Capacitor Android wrapper"
   git branch -M main
   git remote add origin https://github.com/<username>/<repo-name>.git
   git push -u origin main
   ```

3. Sa GitHub, pumunta sa **Actions** tab ng repo mo - dapat may
   makita kang workflow na "Build Android APK" na tumatakbo na
   (awtomatiko itong nag-trigger sa unang push). Kung wala, i-click
   ang workflow sa kaliwa tapos pindutin ang **"Run workflow"**
   (manual trigger).

4. Hintayin matapos (2-5 minuto karaniwan) - kapag berde/tapos na,
   i-click ang workflow run, mag-scroll pababa sa **"Artifacts"**
   section, i-download ang **`tralala-game-debug-apk`** (zip na may
   laman na `app-debug.apk`).

5. I-transfer ang `app-debug.apk` papunta sa Android phone mo (Google
   Drive, USB, atbp), buksan ito - kakailanganin mong paganahin ang
   **"Install from unknown sources"** kapag unang beses (normal lang
   ito para sa APK na hindi galing sa Play Store).

## Susunod na beses (may binago ka sa laro)

Bawat push mo sa `main` branch (hal. pagkatapos mong i-edit ang
`www/js/player.js` o anumang file) - awtomatiko na ulit itong bubuo
ng bagong APK. Wala ka nang ibang gagawin bukod sa `git add` / `git
commit` / `git push`.

## Mahahalagang detalye

- **Landscape lock:** `android/app/src/main/AndroidManifest.xml` -
  `android:screenOrientation="landscape"` sa `<activity>`. Kung sakaling
  gusto mong bawiin ito balang araw, tanggalin lang ang attribute na
  iyon.
- **App ID:** `com.tralala.game` (`capacitor.config.json`) - kung
  gusto mo ng ibang package name (hal. `com.iyongpangalan.laro`),
  palitan mo ito BAGO mag-publish (mahirap nang baguhin pagkatapos
  ma-publish sa Play Store, kung balak mo doon ilagay balang araw).
- **Icon/splash:** default Capacitor placeholder icon pa ang gamit
  (asul na "cap" logo) - kung gusto mo ng custom na icon, sabihin mo
  lang, may hiwalay na proseso iyon (`@capacitor/assets` tool).
- **Debug vs. Release build:** ang workflow ay gumagawa ng **debug**
  APK (walang kailangang signing key, direkta nang ma-i-install) -
  sapat na ito para subukan/i-share sa mga kaibigan. Kung balak mong
  i-publish sa Google Play balang araw, kakailanganin ng "release"
  build na may sarili mong signing keystore (naka-store bilang GitHub
  Secret) - sabihin mo lang kapag dating na ang panahong iyon.
