// 브라우저 콘솔에서 실행할 테스트 코드
// 현재 로그인된 사용자의 위치를 shared_locations에 추가

async function addTestLocationData() {
  // Supabase 클라이언트 가져오기 (전역 변수에서)
  const supabase = window.supabase || (await import('/src/lib/supabase.js')).supabase;
  
  // 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.log('로그인된 사용자가 없습니다.');
    return;
  }
  
  console.log('현재 사용자 ID:', user.id);
  
  // 위치 공유 설정 추가/업데이트
  const { error: settingsError } = await supabase
    .from('user_location_settings')
    .upsert({
      user_id: user.id,
      sharing_status: 'friends_only',
      share_during_running: true,
      share_with_friends: true,
      location_update_interval: 5
    }, {
      onConflict: 'user_id'
    });
    
  if (settingsError) {
    console.error('위치 설정 오류:', settingsError);
  } else {
    console.log('위치 설정 완료');
  }
  
  // 현재 위치 데이터 추가 (서울 시내 임의 위치)
  const { data, error } = await supabase
    .from('shared_locations')
    .insert({
      user_id: user.id,
      latitude: 37.5665 + (Math.random() - 0.5) * 0.01, // 서울 시청 근처 랜덤 위치
      longitude: 126.9780 + (Math.random() - 0.5) * 0.01,
      accuracy: 5.0,
      speed: 0.0,
      heading: 0.0,
      is_running: false,
      shared_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1시간 후 만료
    })
    .select();
    
  if (error) {
    console.error('위치 데이터 추가 실패:', error);
  } else {
    console.log('위치 데이터 추가 성공:', data);
    
    // 페이지 새로고침으로 친구 위치 다시 로드
    window.location.reload();
  }
}

// 함수 실행
addTestLocationData();
