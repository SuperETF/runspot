package com.runspot.app;

import android.app.Application;

public class RunSpotApplication extends Application {
    
    @Override
    public void onCreate() {
        super.onCreate();
        
        // RunSpot 하이브리드 앱 초기화
        // - WebView: 카카오맵 JavaScript SDK 사용 (환경변수 불필요)
        // - 네이티브: Mapbox Navigation SDK만 사용
        android.util.Log.d("RunSpotApp", "RunSpot 하이브리드 앱 초기화 완료");
        android.util.Log.d("RunSpotApp", "- WebView: 카카오맵 JavaScript SDK");
        android.util.Log.d("RunSpotApp", "- 네이티브: Mapbox Navigation SDK");
    }
}
