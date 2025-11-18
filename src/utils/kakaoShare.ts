// 카카오톡 공유 기능 유틸리티

declare global {
  interface Window {
    Kakao: any;
  }
}

// 카카오 SDK 초기화
export const initKakaoSDK = () => {
  if (typeof window !== 'undefined' && window.Kakao && !window.Kakao.isInitialized()) {
    const kakaoJsKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
    if (kakaoJsKey) {
      window.Kakao.init(kakaoJsKey);
      console.log('✅ Kakao SDK 초기화 완료:', kakaoJsKey.substring(0, 10) + '...');
      return true;
    } else {
      console.error('❌ NEXT_PUBLIC_KAKAO_JS_KEY 환경변수가 설정되지 않았습니다.');
      return false;
    }
  }
  return window.Kakao?.isInitialized() || false;
}

// 런닝 코스 공유하기 (지도 형태)
export const shareRunningCourse = (courseData: {
  name: string;
  area: string;
  distance: number;
  difficulty: string;
  description?: string;
  imageUrl?: string;
  courseId: string;
  startPoint?: { lat: number; lng: number };
}) => {
  if (typeof window === 'undefined' || !window.Kakao) {
    console.error('카카오 SDK가 로드되지 않았습니다.');
    return;
  }

  const shareUrl = `${window.location.origin}/course/${courseData.courseId}`;
  
  // 시작점 좌표가 있으면 Location 템플릿 사용 (지도 형태)
  if (courseData.startPoint) {
    window.Kakao.Share.sendDefault({
      objectType: 'location',
      address: courseData.area,
      addressTitle: `🏃‍♂️ ${courseData.name}`,
      content: {
        title: `${courseData.name} 런닝 코스`,
        description: `📍 ${courseData.area}\n📏 거리: ${courseData.distance}km\n⭐ 난이도: ${courseData.difficulty}\n\n${courseData.description || '함께 달려요! 🏃‍♀️'}`,
        imageUrl: courseData.imageUrl || `${window.location.origin}/images/default-course.jpg`,
        link: {
          mobileWebUrl: shareUrl,
          webUrl: shareUrl,
        },
      },
      social: {
        likeCount: Math.floor(Math.random() * 100), // 임시 좋아요 수
        commentCount: Math.floor(Math.random() * 20), // 임시 댓글 수
      },
      buttons: [
        {
          title: '코스 보기',
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
        },
        {
          title: '길찾기',
          link: {
            mobileWebUrl: `https://map.kakao.com/link/to/${encodeURIComponent(courseData.name)},${courseData.startPoint.lat},${courseData.startPoint.lng}`,
            webUrl: `https://map.kakao.com/link/to/${encodeURIComponent(courseData.name)},${courseData.startPoint.lat},${courseData.startPoint.lng}`,
          },
        },
      ],
    });
  } else {
    // 좌표가 없으면 기본 Feed 템플릿 사용
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: `🏃‍♂️ ${courseData.name}`,
        description: `${courseData.area} • ${courseData.distance}km • ${courseData.difficulty}\n${courseData.description || '함께 달려요!'}`,
        imageUrl: courseData.imageUrl || `${window.location.origin}/images/default-course.jpg`,
        link: {
          mobileWebUrl: shareUrl,
          webUrl: shareUrl,
        },
      },
      buttons: [
        {
          title: '코스 보기',
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
        },
        {
          title: '앱에서 열기',
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
        },
      ],
    });
  }
}

// 런닝 기록 공유하기
export const shareRunningRecord = (recordData: {
  courseName: string;
  distance: number;
  time: number;
  pace: number;
  date: string;
  courseId: string;
}) => {
  if (typeof window === 'undefined' || !window.Kakao) {
    console.error('카카오 SDK가 로드되지 않았습니다.');
    return;
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPace = (paceMinutes: number) => {
    const minutes = Math.floor(paceMinutes);
    const seconds = Math.round((paceMinutes - minutes) * 60);
    return `${minutes}'${seconds.toString().padStart(2, '0')}"`;
  };

  const shareUrl = `${window.location.origin}/course/${recordData.courseId}`;
  
  window.Kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title: `🏃‍♂️ 런닝 완주! ${recordData.courseName}`,
      description: `📏 거리: ${recordData.distance.toFixed(2)}km\n⏱️ 시간: ${formatTime(recordData.time)}\n⚡ 페이스: ${formatPace(recordData.pace)}\n📅 ${recordData.date}`,
      imageUrl: `${window.location.origin}/images/running-achievement.jpg`,
      link: {
        mobileWebUrl: shareUrl,
        webUrl: shareUrl,
      },
    },
    buttons: [
      {
        title: '이 코스 도전하기',
        link: {
          mobileWebUrl: shareUrl,
          webUrl: shareUrl,
        },
      },
    ],
  });
}

// 일반 웹 공유 (카카오톡이 없는 경우)
export const shareWithWebAPI = (data: {
  title: string;
  text: string;
  url: string;
}) => {
  if (navigator.share) {
    navigator.share({
      title: data.title,
      text: data.text,
      url: data.url,
    }).catch((error) => {
      console.log('공유 취소:', error);
    });
  } else {
    // Web Share API를 지원하지 않는 경우 클립보드에 복사
    navigator.clipboard.writeText(data.url).then(() => {
      alert('링크가 클립보드에 복사되었습니다!');
    }).catch(() => {
      // 클립보드 API도 지원하지 않는 경우
      const textArea = document.createElement('textarea');
      textArea.value = data.url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('링크가 클립보드에 복사되었습니다!');
    });
  }
}
