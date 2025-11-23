package com.runspot.app;

import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    private static final String TAG = "MainActivity";
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Capacitor 플러그인 등록
        registerPlugin(MapboxNavigationPlugin.class);
        
        // WebView 메시지 리스너 설정 (Fallback)
        setupWebViewMessageHandler();
        
        Log.d(TAG, "🚀🚀🚀 MainActivity 초기화 완료 - Capacitor 플러그인 등록됨");
        System.out.println("🚀🚀🚀 MainActivity 초기화 완료 - Capacitor 플러그인 등록됨");
    }
    
    private void setupWebViewMessageHandler() {
        // Capacitor 플러그인 방식으로 전환됨 - WebView 메시지는 fallback용으로만 유지
        Log.d(TAG, "WebView 메시지 핸들러 설정 (Capacitor 플러그인 우선 사용)");
    }
}
