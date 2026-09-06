package com.tralala.game;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

// AYOS (hiling ng user): "dapat i full screen mo na rin sa mobile
// kasi may spacing pa siya" - lumalabas ang status bar ng Android
// (oras, baterya, signal) sa ITAAS ng laro (screenshot ng user) dahil
// WALANG anumang "immersive"/edge-to-edge na config dati ang buong
// app - default/plain lang na BridgeActivity. Dito, pinipilit ang
// TALAGANG "immersive sticky" fullscreen (kapareho ng mga totoong
// mobile game) - itinatago ang status bar AT navigation bar, pumupuno
// ang WebView (kung saan tumatakbo ang buong www/ na laro) sa BUONG
// screen ng device, WALANG spacing/gutter na naiiwan. Muling
// tinatawag ito sa onResume() AT sa onWindowFocusChanged() dahil
// karaniwang "nabubura"/lumalabas ulit ang system bars kapag lumipat
// ng app/bumalik mula sa ibang screen (hal. multitasking, notification
// shade) - kailangang i-reapply tuwing bumalik ang focus.
public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        applyImmersiveFullscreen();
    }

    @Override
    public void onResume() {
        super.onResume();
        applyImmersiveFullscreen();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) applyImmersiveFullscreen();
    }

    private void applyImmersiveFullscreen() {
        // "Edge-to-edge" - hinahayaang gumuhit ang content (WebView)
        // SA ILALIM/LIKOD mismo ng system bars (hindi na sila
        // "kumakain" ng espasyo sa layout), kaya TALAGANG BUONG screen
        // ang nagagamit.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        WindowInsetsControllerCompat controller =
                WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());

        if (controller != null) {
            // "Sticky immersive" - kapag nag-swipe ang user papasok ng
            // system bar (hal. aksidente), lumalabas ito nang saglit
            // tapos AWTOMATIKONG nagtatago ulit (hindi na kailangang
            // mano-manong i-trigger ulit) - pinakatamang behavior para
            // sa isang full-screen na laro.
            controller.setSystemBarsBehavior(
                    WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            controller.hide(WindowInsetsCompat.Type.systemBars());
        }

        // Ligtas na fallback para sa mas lumang Android version (bago
        // pa man ang WindowInsetsController API, mas mababa sa API 30) -
        // ang lumang "SYSTEM_UI_FLAG_*" na paraan, walang epekto kung
        // na-a-apply na ang bago sa itaas.
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
            getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
        }
    }
}
