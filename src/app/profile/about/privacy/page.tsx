'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PrivacyPolicyPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-black text-white">
      {/* 상단 헤더 */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-800 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">개인정보 처리방침</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        <div className="bg-gray-900/80 glass rounded-2xl p-6 border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-6">개인정보 처리방침</h2>
          
          <div className="space-y-6 text-gray-300 leading-relaxed">
            <div>
              <p className="mb-4 text-sm text-gray-400">
                시행일자: 2025년 1월 1일 | 최종 수정일: 2024년 12월 1일
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">제1조 (개인정보의 처리목적)</h3>
              <p className="mb-4">
                RunSpot Seoul(이하 "회사")은 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>회원 가입 및 관리: 회원 식별, 서비스 이용에 따른 본인확인, 회원자격 유지·관리</li>
                <li>서비스 제공: 런닝 코스 정보 제공, GPS 추적 서비스, 개인화된 콘텐츠 제공</li>
                <li>마케팅 및 광고: 이벤트 정보 및 참여기회 제공, 광고성 정보 제공, 서비스의 유효성 확인</li>
                <li>서비스 개선: 서비스 이용 통계 분석, 신규 서비스 개발, 기존 서비스 개선</li>
                <li>데이터 분석 및 활용: 런닝 패턴 분석, 코스 추천 알고리즘 개발, 시장 조사</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">제2조 (개인정보의 처리 및 보유기간)</h3>
              <p className="mb-4">
                회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>회원정보: 회원탈퇴 시까지 (단, 관계법령 위반에 따른 수사·조사 등이 진행중인 경우에는 해당 수사·조사 종료 시까지)</li>
                <li>런닝 기록: 회원탈퇴 후 3년간 보관 (통계 분석 목적)</li>
                <li>위치정보: 수집 후 1년간 보관</li>
                <li>서비스 이용기록: 3년간 보관 (통신비밀보호법)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">제3조 (처리하는 개인정보 항목)</h3>
              <p className="mb-4">회사는 다음의 개인정보 항목을 처리하고 있습니다:</p>
              <div className="mb-4">
                <h4 className="font-semibold text-white mb-2">필수항목:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>이름, 이메일주소, 휴대전화번호</li>
                  <li>서비스 이용기록, 접속로그, 쿠키, 접속IP정보</li>
                  <li>위치정보 (GPS 좌표)</li>
                </ul>
              </div>
              <div className="mb-4">
                <h4 className="font-semibold text-white mb-2">선택항목:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>프로필 사진, 생년월일, 성별</li>
                  <li>런닝 선호도, 관심 코스 정보</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">제4조 (개인정보의 제3자 제공)</h3>
              <p className="mb-4">
                회사는 원칙적으로 정보주체의 개인정보를 수집·이용 목적으로 명시한 범위 내에서 처리하며, 정보주체의 사전 동의 없이는 본래의 목적 범위를 초과하여 처리하거나 제3자에게 제공하지 않습니다.
              </p>
              <p className="mb-4">
                다만, 다음의 경우에는 예외로 합니다:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>정보주체로부터 별도의 동의를 받은 경우</li>
                <li>법률에 특별한 규정이 있거나 법령상 의무를 준수하기 위하여 불가피한 경우</li>
                <li>정보주체 또는 그 법정대리인이 의사표시를 할 수 없는 상태에 있거나 주소불명 등으로 사전 동의를 받을 수 없는 경우로서 명백히 정보주체 또는 제3자의 급박한 생명, 신체, 재산의 이익을 위하여 필요하다고 인정되는 경우</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">제5조 (개인정보의 처리위탁)</h3>
              <p className="mb-4">
                회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>위탁받는 자: Supabase Inc. / 위탁하는 업무의 내용: 데이터베이스 관리 및 서버 호스팅</li>
                <li>위탁받는 자: Vercel Inc. / 위탁하는 업무의 내용: 웹 애플리케이션 호스팅</li>
                <li>위탁받는 자: 카카오 / 위탁하는 업무의 내용: 지도 서비스 제공</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">제6조 (정보주체의 권리·의무 및 행사방법)</h3>
              <p className="mb-4">
                정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>개인정보 처리현황 통지요구</li>
                <li>개인정보 열람요구</li>
                <li>개인정보 정정·삭제요구</li>
                <li>개인정보 처리정지요구</li>
              </ul>
              <p className="mt-4">
                위의 권리 행사는 개인정보보호법 시행령 제41조제1항에 따라 서면, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며 회사는 이에 대해 지체없이 조치하겠습니다.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">제7조 (데이터의 상업적 활용)</h3>
              <p className="mb-4">
                회사는 서비스 개선 및 사업 확장을 위하여 수집된 데이터를 다음과 같이 활용할 수 있습니다:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>개인식별정보를 제외한 통계 데이터의 분석 및 가공</li>
                <li>런닝 패턴, 코스 선호도 등의 익명화된 데이터 분석</li>
                <li>마케팅 및 광고 목적의 데이터 활용 (사전 동의 시)</li>
                <li>제휴사와의 협력을 위한 익명화된 통계 정보 제공</li>
                <li>신규 서비스 개발을 위한 데이터 분석</li>
              </ul>
              <p className="mt-4">
                단, 개인을 식별할 수 있는 정보는 절대 상업적 목적으로 판매하거나 제공하지 않으며, 모든 데이터 활용은 관련 법령을 준수하여 진행됩니다.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">제8조 (개인정보보호책임자)</h3>
              <p className="mb-4">
                회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보보호책임자를 지정하고 있습니다:
              </p>
              <div className="bg-gray-800 p-4 rounded-lg">
                <p>개인정보보호책임자: 채정욱</p>
                <p>연락처: pab.jeonguk@gmail.com</p>
                <p>처리시간: 평일 09:00 ~ 18:00 (주말, 공휴일 제외)</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">제9조 (개인정보 처리방침 변경)</h3>
              <p className="mb-4">
                이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
              </p>
            </div>
          </div>
        </div>

        {/* 하단 여백 */}
        <div className="h-20"></div>
      </div>
    </div>
  )
}
