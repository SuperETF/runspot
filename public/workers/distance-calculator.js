// 거리 계산 전용 Web Worker
// CPU 집약적인 Haversine 공식 계산을 백그라운드에서 처리

// Haversine 공식으로 두 지점 간 거리 계산 (km 단위)
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// 경로의 총 거리 계산
function calculateRouteDistance(points) {
  if (points.length < 2) return 0;
  
  let totalDistance = 0;
  for (let i = 1; i < points.length; i++) {
    totalDistance += calculateDistance(
      points[i-1].lat, points[i-1].lng,
      points[i].lat, points[i].lng
    );
  }
  
  return totalDistance;
}

// 여러 지점과의 거리 계산 (주변 코스 검색용)
function calculateMultipleDistances(userLat, userLng, points) {
  return points.map(point => ({
    ...point,
    distance: calculateDistance(userLat, userLng, point.lat, point.lng)
  }));
}

// 경로 단순화 (Douglas-Peucker 알고리즘)
function simplifyRoute(points, tolerance = 0.001) {
  if (points.length <= 2) return points;
  
  // 시작점과 끝점 찾기
  let maxDistance = 0;
  let maxIndex = 0;
  
  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(
      points[i], 
      points[0], 
      points[points.length - 1]
    );
    
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }
  
  // 허용 오차보다 큰 점이 있으면 재귀적으로 단순화
  if (maxDistance > tolerance) {
    const leftPart = simplifyRoute(points.slice(0, maxIndex + 1), tolerance);
    const rightPart = simplifyRoute(points.slice(maxIndex), tolerance);
    
    return leftPart.slice(0, -1).concat(rightPart);
  } else {
    return [points[0], points[points.length - 1]];
  }
}

// 점과 직선 사이의 수직 거리 계산
function perpendicularDistance(point, lineStart, lineEnd) {
  const A = lineEnd.lat - lineStart.lat;
  const B = lineStart.lng - lineEnd.lng;
  const C = lineEnd.lng * lineStart.lat - lineStart.lng * lineEnd.lat;
  
  return Math.abs(A * point.lng + B * point.lat + C) / Math.sqrt(A * A + B * B);
}

// 배터리 최적화를 위한 적응형 처리
function adaptiveProcessing(data, batteryLevel = 1.0) {
  // 배터리 레벨에 따라 처리 정밀도 조정
  let tolerance = 0.001; // 기본 허용 오차
  
  if (batteryLevel < 0.2) {
    // 배터리 20% 미만: 매우 낮은 정밀도
    tolerance = 0.01;
  } else if (batteryLevel < 0.5) {
    // 배터리 50% 미만: 낮은 정밀도
    tolerance = 0.005;
  }
  
  return {
    ...data,
    tolerance,
    highAccuracy: batteryLevel > 0.5
  };
}

// 메시지 처리
self.onmessage = function(e) {
  const { type, data, id } = e.data;
  
  try {
    let result;
    
    switch (type) {
      case 'CALCULATE_DISTANCE':
        result = calculateDistance(
          data.lat1, data.lng1, 
          data.lat2, data.lng2
        );
        break;
        
      case 'CALCULATE_ROUTE_DISTANCE':
        result = calculateRouteDistance(data.points);
        break;
        
      case 'CALCULATE_MULTIPLE_DISTANCES':
        result = calculateMultipleDistances(
          data.userLat, data.userLng, 
          data.points
        );
        break;
        
      case 'SIMPLIFY_ROUTE':
        const processedData = adaptiveProcessing(data, data.batteryLevel);
        result = simplifyRoute(data.points, processedData.tolerance);
        break;
        
      case 'BATCH_PROCESS':
        // 여러 작업을 배치로 처리
        result = data.tasks.map(task => {
          switch (task.type) {
            case 'distance':
              return calculateDistance(
                task.lat1, task.lng1,
                task.lat2, task.lng2
              );
            default:
              return null;
          }
        });
        break;
        
      default:
        throw new Error(`Unknown task type: ${type}`);
    }
    
    // 결과 전송
    self.postMessage({
      id,
      type: 'SUCCESS',
      result
    });
    
  } catch (error) {
    // 오류 전송
    self.postMessage({
      id,
      type: 'ERROR',
      error: error.message
    });
  }
};

// 워커 준비 완료 신호
self.postMessage({
  type: 'READY'
});
