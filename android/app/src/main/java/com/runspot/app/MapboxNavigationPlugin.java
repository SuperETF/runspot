package com.runspot.app;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import android.content.Intent;
import android.util.Log;

@CapacitorPlugin(name = "MapboxNavigationPlugin")
public class MapboxNavigationPlugin extends Plugin {
    
    private static final String TAG = "MapboxNavigationPlugin";
    
    @PluginMethod
    public void startNavigation(PluginCall call) {
        Log.d(TAG, "🎯🎯🎯 Mapbox Navigation 시작 요청 - 플러그인 호출됨!");
        System.out.println("🎯🎯🎯 Mapbox Navigation 시작 요청 - 플러그인 호출됨!");
        
        try {
            JSArray waypoints = call.getArray("waypoints");
            JSObject currentLocation = call.getObject("currentLocation");
            String courseName = call.getString("courseName", "런닝 코스");
            
            if (waypoints == null || waypoints.length() < 2) {
                call.reject("경로 데이터가 부족합니다.");
                return;
            }
            
            // MapboxNavigationActivity에 전달할 데이터 구성
            JSObject navigationData = new JSObject();
            navigationData.put("waypoints", waypoints);
            navigationData.put("courseName", courseName);
            if (currentLocation != null) {
                navigationData.put("currentLocation", currentLocation);
            }
            
            // MapboxNavigationActivity (Kotlin) 시작
            Intent intent = new Intent(getContext(), MapboxNavigationActivity.class);
            intent.putExtra("navigationData", navigationData.toString());
            
            getActivity().startActivity(intent);
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "네비게이션이 시작되었습니다.");
            call.resolve(result);
            
            Log.d(TAG, "✅ Mapbox Navigation Activity 시작 완료");
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Navigation 시작 실패: " + e.getMessage());
            call.reject("네비게이션 시작 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void stopNavigation(PluginCall call) {
        Log.d(TAG, "🛑 Mapbox Navigation 종료 요청");
        
        try {
            // MapboxNavigationActivity에 종료 신호 전송
            Intent intent = new Intent("com.runspot.app.STOP_NAVIGATION");
            getContext().sendBroadcast(intent);
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "네비게이션이 종료되었습니다.");
            call.resolve(result);
            
            Log.d(TAG, "✅ Mapbox Navigation 종료 완료");
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Navigation 종료 실패: " + e.getMessage());
            call.reject("네비게이션 종료 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void isNavigationActive(PluginCall call) {
        // 네비게이션 활성 상태 확인 (추후 구현)
        JSObject result = new JSObject();
        result.put("active", false);
        call.resolve(result);
    }
}
