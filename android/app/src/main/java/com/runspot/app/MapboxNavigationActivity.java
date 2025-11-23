package com.runspot.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Color;
import android.location.Location;
import android.os.Bundle;
import android.util.Log;
import android.view.Gravity;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import com.mapbox.android.core.permissions.PermissionsListener;
import com.mapbox.android.core.permissions.PermissionsManager;
import com.mapbox.geojson.Point;
import com.mapbox.maps.CameraOptions;
import com.mapbox.maps.MapView;
import com.mapbox.maps.Style;
import com.mapbox.maps.plugin.animation.MapAnimationOptions;
import com.mapbox.maps.plugin.animation.CameraAnimationsPlugin;
import com.mapbox.maps.plugin.locationcomponent.LocationComponentPlugin;
import com.mapbox.navigation.base.options.NavigationOptions;
import com.mapbox.navigation.base.route.NavigationRoute;
import com.mapbox.navigation.core.MapboxNavigation;
import com.mapbox.navigation.core.MapboxNavigationProvider;
import com.mapbox.navigation.core.trip.session.LocationMatcherResult;
import com.mapbox.navigation.core.trip.session.LocationObserver;
import com.mapbox.navigation.core.trip.session.RouteProgressObserver;
import com.mapbox.navigation.ui.maps.NavigationStyles;
import com.mapbox.navigation.ui.maps.location.NavigationLocationProvider;
import com.mapbox.navigation.ui.maps.route.line.api.MapboxRouteLineApi;
import com.mapbox.navigation.ui.maps.route.line.api.MapboxRouteLineView;
import com.mapbox.navigation.ui.maps.route.line.model.MapboxRouteLineOptions;
import com.mapbox.api.directions.v5.models.DirectionsRoute;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;

public class MapboxNavigationActivity extends AppCompatActivity implements PermissionsListener {

    private static final String TAG = "MapboxNavigation";

    // Mapbox Navigation 컴포넌트들
    private MapView mapView;
    private MapboxNavigation mapboxNavigation;
    private NavigationLocationProvider navigationLocationProvider;
    
    // UI 컴포넌트들 (동적 생성)
    private FrameLayout rootContainer;
    private LinearLayout statusContainer;
    private TextView speedText;
    private TextView distanceText;
    private TextView directionText;
    
    // 데이터
    private List<Point> routePoints = new ArrayList<>();
    private JSONObject navigationData;
    private PermissionsManager permissionsManager;
    
    // 브로드캐스트 리시버
    private BroadcastReceiver stopNavigationReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if ("com.runspot.app.STOP_NAVIGATION".equals(intent.getAction())) {
                Log.d(TAG, "🛑 네비게이션 종료 신호 수신");
                finish();
            }
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        Log.d(TAG, "🎯 Mapbox Navigation Activity 시작 (Java + 동적 UI)");
        
        // Mapbox 초기화 (setContentView 전에 필수)
        try {
            String mapboxToken = getString(R.string.mapbox_access_token);
            Log.d(TAG, "✅ Mapbox 토큰 준비 완료: " + (mapboxToken != null ? "있음" : "없음"));
        } catch (Exception e) {
            Log.e(TAG, "❌ Mapbox 토큰 초기화 실패", e);
        }
        
        // 네비게이션 데이터 파싱
        parseNavigationData();
        
        // UI 동적 생성 (XML 없음)
        createDynamicUI();
        
        // Mapbox Navigation 초기화
        initializeMapboxNavigation();
        
        // 브로드캐스트 리시버 등록
        registerReceiver(stopNavigationReceiver, new IntentFilter("com.runspot.app.STOP_NAVIGATION"));
    }
    
    /**
     * XML 없이 UI를 동적으로 생성
     */
    private void createDynamicUI() {
        // 루트 컨테이너
        rootContainer = new FrameLayout(this);
        rootContainer.setLayoutParams(new ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));
        rootContainer.setBackgroundColor(Color.BLACK);
        
        // MapView 동적 생성 (토큰 포함)
        try {
            // ResourceOptions에 토큰 설정
            String mapboxToken = BuildConfig.MAPBOX_ACCESS_TOKEN;
            if (mapboxToken == null || mapboxToken.isEmpty()) {
                // 실제 Mapbox 퍼블릭 토큰
                mapboxToken = "pk.eyJ1IjoiamFjb2JjaGFuIiwiYSI6ImNtaTl1ZjJtazBlNjIyanEweHhxeXdoODUifQ.EC6ECxMIzMqj7kjYq7r03w";
                Log.w(TAG, "⚠️ 환경변수에서 토큰을 찾을 수 없어 하드코딩된 토큰 사용");
            }
            
            com.mapbox.maps.ResourceOptions resourceOptions = new com.mapbox.maps.ResourceOptions.Builder()
                .accessToken(mapboxToken)
                .build();
            
            // MapInitOptions 생성
            com.mapbox.maps.MapInitOptions mapInitOptions = new com.mapbox.maps.MapInitOptions(
                this,
                resourceOptions
            );
            
            // MapView 생성 (토큰 포함)
            mapView = new MapView(this, mapInitOptions);
            mapView.setLayoutParams(new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            ));
            
            Log.d(TAG, "✅ MapView 생성 완료 (토큰 포함)");
        } catch (Exception e) {
            Log.e(TAG, "❌ MapView 생성 실패: " + e.getMessage());
            throw e;
        }
        rootContainer.addView(mapView);
        
        // 상태 정보 컨테이너
        statusContainer = new LinearLayout(this);
        FrameLayout.LayoutParams statusParams = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.WRAP_CONTENT
        );
        statusParams.gravity = Gravity.TOP;
        statusParams.setMargins(32, 100, 32, 0);
        statusContainer.setLayoutParams(statusParams);
        statusContainer.setOrientation(LinearLayout.HORIZONTAL);
        statusContainer.setBackgroundColor(Color.parseColor("#80000000"));
        statusContainer.setPadding(32, 24, 32, 24);
        
        // 속도 표시
        speedText = new TextView(this);
        speedText.setLayoutParams(new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));
        speedText.setText("0 km/h");
        speedText.setTextSize(16f);
        speedText.setTextColor(Color.WHITE);
        speedText.setGravity(Gravity.CENTER);
        statusContainer.addView(speedText);
        
        // 남은 거리 표시
        distanceText = new TextView(this);
        distanceText.setLayoutParams(new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));
        distanceText.setText("0 km");
        distanceText.setTextSize(16f);
        distanceText.setTextColor(Color.WHITE);
        distanceText.setGravity(Gravity.CENTER);
        statusContainer.addView(distanceText);
        
        // 방향 표시
        directionText = new TextView(this);
        directionText.setLayoutParams(new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));
        directionText.setText("N");
        directionText.setTextSize(16f);
        directionText.setTextColor(Color.WHITE);
        directionText.setGravity(Gravity.CENTER);
        statusContainer.addView(directionText);
        
        rootContainer.addView(statusContainer);
        
        // 루트 뷰 설정
        setContentView(rootContainer);
        
        Log.d(TAG, "✅ 동적 UI 생성 완료 (XML 없음)");
    }
    
    /**
     * Mapbox Navigation 초기화
     */
    private void initializeMapboxNavigation() {
        // 위치 권한 확인
        if (!PermissionsManager.areLocationPermissionsGranted(this)) {
            permissionsManager = new PermissionsManager(this);
            permissionsManager.requestLocationPermissions(this);
            return;
        }
        
        try {
            // Navigation 옵션 설정 (MapView와 동일한 토큰 사용)
            String mapboxToken = BuildConfig.MAPBOX_ACCESS_TOKEN;
            if (mapboxToken == null || mapboxToken.isEmpty()) {
                mapboxToken = "pk.eyJ1IjoiamFjb2JjaGFuIiwiYSI6ImNtaTl1ZjJtazBlNjIyanEweHhxeXdoODUifQ.EC6ECxMIzMqj7kjYq7r03w";
            }
            
            NavigationOptions navigationOptions = new NavigationOptions.Builder(this)
                .accessToken(mapboxToken)
                .build();
            
            // MapboxNavigation 인스턴스 생성
            mapboxNavigation = MapboxNavigationProvider.create(navigationOptions);
            
            // NavigationLocationProvider 초기화
            navigationLocationProvider = new NavigationLocationProvider();
            
            // MapView 설정
            setupMapView();
            
            // 옵저버 등록
            registerObservers();
            
            Log.d(TAG, "✅ Mapbox Navigation 초기화 완료");
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Mapbox Navigation 초기화 실패", e);
        }
    }
    
    /**
     * MapView 설정
     */
    private void setupMapView() {
        mapView.getMapboxMap().loadStyleUri(NavigationStyles.NAVIGATION_DAY_STYLE, new Style.OnStyleLoaded() {
            @Override
            public void onStyleLoaded(Style style) {
                Log.d(TAG, "🗺️ 지도 스타일 로드 완료");
                
                // 위치 컴포넌트 설정
                try {
                    LocationComponentPlugin locationComponent = mapView.getPlugin("MAPBOX_LOCATION_COMPONENT_PLUGIN_ID");
                    if (locationComponent != null) {
                        locationComponent.setLocationProvider(navigationLocationProvider);
                        locationComponent.setEnabled(true);
                    }
                } catch (Exception e) {
                    Log.w(TAG, "위치 컴포넌트 설정 실패: " + e.getMessage());
                }
                
                // 초기 카메라 위치 설정
                if (!routePoints.isEmpty()) {
                    Point firstPoint = routePoints.get(0);
                    CameraOptions cameraOptions = new CameraOptions.Builder()
                        .center(firstPoint)
                        .zoom(16.0)
                        .pitch(45.0) // 3D 효과
                        .build();
                    
                    mapView.getMapboxMap().setCamera(cameraOptions);
                    Log.d(TAG, "📍 초기 카메라 위치 설정: " + firstPoint.latitude() + ", " + firstPoint.longitude());
                    
                    // GPX 경로를 지도에 그리기
                    drawRouteOnMap(style);
                    
                    // 기본 네비게이션 시작 (단순 추적 모드)
                    startBasicNavigation();
                }
            }
        });
    }
    
    /**
     * 옵저버 등록
     */
    private void registerObservers() {
        // 위치 옵저버
        mapboxNavigation.registerLocationObserver(new LocationObserver() {
            @Override
            public void onNewRawLocation(Location rawLocation) {
                // Raw location 업데이트
            }
            
            @Override
            public void onNewLocationMatcherResult(LocationMatcherResult locationMatcherResult) {
                Location location = locationMatcherResult.getEnhancedLocation();
                
                // 위치 업데이트
                navigationLocationProvider.changePosition(
                    location,
                    locationMatcherResult.getKeyPoints(),
                    null,
                    null
                );
                
                // 속도 업데이트
                int speedKmh = (int) (location.getSpeed() * 3.6f);
                speedText.setText(speedKmh + " km/h");
                
                // 방향 업데이트
                int bearing = (int) location.getBearing();
                directionText.setText(bearing + "°");
                
                // 카메라 업데이트 (헤딩업 모드)
                updateCamera(location);
            }
        });
        
        // 경로 진행률 옵저버
        mapboxNavigation.registerRouteProgressObserver(new RouteProgressObserver() {
            @Override
            public void onRouteProgressChanged(com.mapbox.navigation.base.trip.model.RouteProgress routeProgress) {
                double remainingDistance = routeProgress.getDistanceRemaining();
                String distanceKm = String.format("%.1f km", remainingDistance / 1000.0);
                distanceText.setText(distanceKm);
                
                Log.d(TAG, "📊 진행률 업데이트 - 남은 거리: " + distanceKm);
            }
        });
    }
    
    /**
     * GPX 경로를 지도에 그리기
     */
    private void drawRouteOnMap(Style style) {
        if (routePoints.isEmpty()) {
            Log.w(TAG, "경로 포인트가 없어 경로를 그릴 수 없습니다");
            return;
        }
        
        try {
            // LineString 생성
            com.mapbox.geojson.LineString lineString = com.mapbox.geojson.LineString.fromLngLats(routePoints);
            
            // GeoJSON Feature 생성
            com.mapbox.geojson.Feature feature = com.mapbox.geojson.Feature.fromGeometry(lineString);
            com.mapbox.geojson.FeatureCollection featureCollection = com.mapbox.geojson.FeatureCollection.fromFeature(feature);
            
            // 경로 데이터 준비 완료 (실제 그리기는 추후 구현)
            Log.d(TAG, "🛣️ 경로 데이터 준비 완료 - LineString 생성됨");
            
            Log.d(TAG, "✅ GPX 경로 처리 완료: " + routePoints.size() + "개 포인트");
            
        } catch (Exception e) {
            Log.e(TAG, "❌ GPX 경로 그리기 실패: " + e.getMessage(), e);
        }
    }
    
    /**
     * 기본 네비게이션 시작 (단순 추적 모드)
     */
    private void startBasicNavigation() {
        try {
            // 기본 위치 추적 시작
            if (mapboxNavigation != null) {
                mapboxNavigation.startTripSession();
                Log.d(TAG, "✅ 기본 네비게이션 추적 시작");
            }
            
            // GPS 경로 포인트 로깅
            if (!routePoints.isEmpty()) {
                Log.d(TAG, "🗺️ 경로 포인트 " + routePoints.size() + "개 준비 완료");
                Log.d(TAG, "📍 시작점: " + routePoints.get(0).latitude() + ", " + routePoints.get(0).longitude());
                if (routePoints.size() > 1) {
                    Point lastPoint = routePoints.get(routePoints.size() - 1);
                    Log.d(TAG, "🏁 끝점: " + lastPoint.latitude() + ", " + lastPoint.longitude());
                }
            }
            
        } catch (Exception e) {
            Log.e(TAG, "❌ 기본 네비게이션 시작 실패: " + e.getMessage(), e);
        }
    }
    
    /**
     * 카메라 업데이트 (헤딩업 모드)
     */
    private void updateCamera(Location location) {
        CameraOptions cameraOptions = new CameraOptions.Builder()
            .center(Point.fromLngLat(location.getLongitude(), location.getLatitude()))
            .bearing((double) location.getBearing())
            .pitch(45.0)
            .zoom(18.0)
            .build();
        
        try {
            CameraAnimationsPlugin cameraPlugin = mapView.getPlugin("MAPBOX_CAMERA_PLUGIN_ID");
            if (cameraPlugin != null) {
                cameraPlugin.easeTo(
                    cameraOptions,
                    new MapAnimationOptions.Builder().duration(1000L).build()
                );
            }
        } catch (Exception e) {
            Log.w(TAG, "카메라 애니메이션 실패: " + e.getMessage());
            // Fallback: 직접 카메라 설정
            mapView.getMapboxMap().setCamera(cameraOptions);
        }
    }
    
    /**
     * 네비게이션 데이터 파싱
     */
    private void parseNavigationData() {
        String dataString = getIntent().getStringExtra("navigationData");
        if (dataString == null) {
            Log.w(TAG, "네비게이션 데이터가 없습니다");
            return;
        }
        
        try {
            navigationData = new JSONObject(dataString);
            
            // Capacitor 플러그인에서 전달된 waypoints 파싱
            if (navigationData.has("waypoints")) {
                JSONArray waypoints = navigationData.getJSONArray("waypoints");
                
                for (int i = 0; i < waypoints.length(); i++) {
                    JSONObject waypoint = waypoints.getJSONObject(i);
                    double lat = waypoint.getDouble("latitude");
                    double lng = waypoint.getDouble("longitude");
                    routePoints.add(Point.fromLngLat(lng, lat));
                }
                
                Log.d(TAG, "✅ Capacitor waypoints 파싱 완료: " + routePoints.size() + "개 포인트");
            }
            
        } catch (JSONException e) {
            Log.e(TAG, "❌ 네비게이션 데이터 파싱 실패", e);
        }
    }
    
    @Override
    protected void onStart() {
        super.onStart();
        if (mapView != null) {
            mapView.onStart();
        }
        if (mapboxNavigation != null) {
            mapboxNavigation.startTripSession();
        }
    }
    
    @Override
    protected void onStop() {
        super.onStop();
        if (mapView != null) {
            mapView.onStop();
        }
        if (mapboxNavigation != null) {
            mapboxNavigation.stopTripSession();
        }
    }
    
    @Override
    protected void onDestroy() {
        super.onDestroy();
        
        // 브로드캐스트 리시버 해제
        try {
            unregisterReceiver(stopNavigationReceiver);
        } catch (Exception e) {
            Log.w(TAG, "브로드캐스트 리시버 해제 실패: " + e.getMessage());
        }
        
        // Mapbox Navigation 정리
        if (mapboxNavigation != null) {
            mapboxNavigation.onDestroy();
        }
        if (mapView != null) {
            mapView.onDestroy();
        }
        
        Log.d(TAG, "🛑 Mapbox Navigation Activity 종료");
    }
    
    // 권한 관련 메서드들
    @Override
    public void onExplanationNeeded(List<String> permissionsToExplain) {
        Log.d(TAG, "위치 권한 설명 필요");
    }
    
    @Override
    public void onPermissionResult(boolean granted) {
        if (granted) {
            Log.d(TAG, "✅ 위치 권한 승인됨");
            initializeMapboxNavigation();
        } else {
            Log.w(TAG, "❌ 위치 권한 거부됨");
            finish();
        }
    }
    
    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (permissionsManager != null) {
            permissionsManager.onRequestPermissionsResult(requestCode, permissions, grantResults);
        }
    }
}
