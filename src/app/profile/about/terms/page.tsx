'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function TermsPage() {
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
          <h1 className="text-lg font-semibold">서비스 이용약관</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        <div className="bg-gray-900/80 glass rounded-2xl p-6 border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-6">서비스 이용약관</h2>
          
          <div className="space-y-6 text-gray-300 leading-relaxed">
            <div>
              <p className="mb-4 text-sm text-gray-400">
                시행일자: 2025년 1월 1일 | 최종 수정일: 2024년 12월 1일
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">제1조 (목적)</h3>
              <p className="mb-4">
                이 약관은 RunSpot Seoul(이하 "회사")이 제공하는 런닝 코스 플랫폼 서비스(이하 "서비스")의 이용조건 및 절차, 회사와 이용자의 권리, 의무, 책임사항과 기타 필요한 사항을 규정함을 목적으로 합니다.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">제2조 (정의)</h3>
              <p className="mb-4">이 약관에서 사용하는 용어의 정의는 다음과 같습니다:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>"서비스"라 함은 회사가 제공하는 런닝 코스 정보, GPS 추적, 커뮤니티 기능 등 모든 서비스를 의미합니다.</li>
                <li>"이용자"라 함은 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</li>
                <li>"회원"이라 함은 회사에 개인정보를 제공하여 회원등록을 한 자로서, 회사의 정보를 지속적으로 제공받으며 회사가 제공하는 서비스를 계속적으로 이용할 수 있는 자를 말합니다.</li>
                <li>"콘텐츠"라 함은 회사가 서비스에서 제공하는 문자, 음성, 음향, 화상, 동영상 등의 정보 및 그 밖의 자료를 의미합니다.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">제3조 (약관의 효력 및 변경)</h3>
              <p className="mb-4">
                이 약관은 서비스를 이용하고자 하는 모든 이용자에 대하여 그 효력을 발생합니다.
              </p>
              <p className="mb-4">
                회사는 필요하다고 인정되는 경우 이 약관을 변경할 수 있으며, 약관을 변경하였을 경우에는 지체없이 이를 공시합니다. 변경된 약관은 공시와 동시에 효력을 발생합니다.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">제4조 (서비스의 제공 및 변경)</h3>
              <p className="mb-4">회사는 다음과 같은 서비스를 제공합니다:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>런닝 코스 정보 제공 및 검색 서비스</li>
                <li>GPS를 이용한 실시간 위치 추적 서비스</li>
                <li>런닝 기록 저장 및 통계 서비스</li>
                <li>코스 리뷰 및 평점 서비스</li>
                <li>커뮤니티 및 소셜 기능</li>
                <li>기타 회사가 정하는 서비스</li>
              </ul>
              <p className="mt-4">
                회사는 운영상, 기술상의 필요에 따라 제공하고 있는 서비스를 변경할 수 있으며, 변경 전에 해당 내용을 서비스 내에 공지합니다.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">제5조 (회원가입)</h3>
              <p className="mb-4">
                이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로서 회원가입을 신청합니다.
              </p>
              <p className="mb-4">
                회사는 제1항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각 호에 해당하지 않는 한 회원으로 등록합니다:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>가입신청자가 이 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우</li>
                <li>등록 내용에 허위, 기재누락, 오기가 있는 경우</li>
                <li>기타 회원으로 등록하는 것이 회사의 기술상 현저히 지장이 있다고 판단되는 경우</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">제6조 (회원정보의 변경)</h3>
              <p className="mb-4">
                회원은 개인정보관리화면을 통하여 언제든지 본인의 개인정보를 열람하고 수정할 수 있습니다.
              </p>
              <p className="mb-4">
                회원은 회원가입 시 기재한 사항이 변경되었을 경우 온라인으로 수정을 하거나 전자우편 기타 방법으로 회사에 그 변경사항을 알려야 합니다.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">제7조 (개인정보보호 의무)</h3>
              <p className="mb-4">
                회사는 관련법령이 정하는 바에 따라서 회원 등록정보를 포함한 회원의 개인정보를 보호하기 위하여 노력합니다. 회원의 개인정보보호에 관해서는 관련법령 및 회사가 정하는 개인정보처리방침에 정한 바에 의합니다.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">제8조 (이용자의 의무)</h3>
              <p className="mb-4">이용자는 다음 행위를 하여서는 안됩니다:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>신청 또는 변경시 허위내용의 등록</li>
                <li>타인의 정보도용</li>
                <li>회사가 게시한 정보의 변경</li>
                <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
                <li>회사 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
                <li>회사 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위</li>
                <li>기타 불법적이거나 부당한 행위</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">제9조 (저작권의 귀속 및 이용제한)</h3>
              <p className="mb-4">
                회사가 작성한 저작물에 대한 저작권 기타 지적재산권은 회사에 귀속합니다.
              </p>
              <p className="mb-4">
                이용자는 서비스를 이용함으로써 얻은 정보 중 회사에게 지적재산권이 귀속된 정보를 회사의 사전 승낙없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리목적으로 이용하거나 제3자에게 이용하게 하여서는 안됩니다.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">제10조 (데이터 수집 및 활용)</h3>
              <p className="mb-4">
                회사는 서비스 제공 및 개선을 위하여 다음과 같은 데이터를 수집하고 활용할 수 있습니다:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>서비스 이용 패턴 및 통계 데이터</li>
                <li>런닝 기록 및 코스 이용 현황</li>
                <li>위치 정보 및 이동 경로 (동의 시)</li>
                <li>앱 사용 로그 및 오류 정보</li>
              </ul>
              <p className="mt-4">
                수집된 데이터는 개인식별정보를 제거한 후 다음 목적으로 활용될 수 있습니다:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>서비스 품질 개선 및 신규 서비스 개발</li>
                <li>통계 분석 및 시장 조사</li>
                <li>마케팅 및 광고 활동 (사전 동의 시)</li>
                <li>제휴사와의 협력 사업 (익명화된 데이터에 한함)</li>
                <li>학술 연구 및 공익 목적 (익명화된 데이터에 한함)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">제11조 (서비스 이용의 제한)</h3>
              <p className="mb-4">
                회사는 이용자가 다음 각 호에 해당하는 경우 사전통지 없이 서비스 이용을 제한하거나 중단할 수 있습니다:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>이 약관을 위반한 경우</li>
                <li>정상적인 서비스 운영을 방해한 경우</li>
                <li>타인의 권리를 침해하거나 명예를 훼손한 경우</li>
                <li>법령을 위반하거나 공서양속에 반하는 행위를 한 경우</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">제12조 (면책조항)</h3>
              <p className="mb-4">
                회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.
              </p>
              <p className="mb-4">
                회사는 이용자의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.
              </p>
              <p className="mb-4">
                회사는 이용자가 서비스를 이용하여 기대하는 손익이나 결과를 얻지 못한 것에 대하여는 책임을 지지 않습니다.
              </p>
              <p className="mb-4">
                회사는 이용자간 또는 이용자와 제3자간에 서비스를 매개로 발생한 분쟁에 대해 개입할 의무가 없으며, 이로 인한 손해를 배상할 책임도 없습니다.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">제13조 (준거법 및 관할법원)</h3>
              <p className="mb-4">
                이 약관의 해석 및 회사와 이용자간의 분쟁에 대하여는 대한민국의 법을 적용하며, 서비스 이용으로 발생한 분쟁에 대해 소송이 제기되는 경우 민사소송법상의 관할법원에 제기합니다.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">제14조 (기타)</h3>
              <p className="mb-4">
                이 약관에서 정하지 아니한 사항과 이 약관의 해석에 관하여는 전자상거래 등에서의 소비자보호에 관한 법률, 약관의 규제 등에 관한 법률, 공정거래위원회가 정하는 전자상거래 등에서의 소비자 보호지침 및 관계법령 또는 상관례에 따릅니다.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">부칙</h3>
              <p className="mb-4">
                이 약관은 2025년 1월 1일부터 적용됩니다.
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
