import { lazy, Suspense, ComponentType } from 'react'
import { Loader2 } from 'lucide-react'

// 로딩 컴포넌트
const LoadingSpinner = ({ message = '로딩 중...' }: { message?: string }) => (
  <div className="flex items-center justify-center p-8">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-[#00FF88]" />
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  </div>
)

// 페이지별 로딩 컴포넌트
const PageLoadingSpinner = ({ message = '페이지를 불러오는 중...' }: { message?: string }) => (
  <div className="min-h-screen bg-black text-white flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-16 h-16 border-4 border-gray-800 border-t-[#00FF88] rounded-full animate-spin"></div>
      <p className="text-gray-400">{message}</p>
    </div>
  </div>
)

// HOC for lazy loading with error boundary
const withLazyLoading = <P extends object>(
  Component: ComponentType<P>,
  fallback?: React.ReactNode,
  errorFallback?: React.ReactNode
) => {
  return (props: P) => (
    <Suspense fallback={fallback || <LoadingSpinner />}>
      <Component {...props} />
    </Suspense>
  )
}

// 지연 로딩할 컴포넌트들
export const LazyRunningMap = lazy(() => 
  import('./common/RunningMapOptimized').then(module => ({
    default: module.default
  }))
)

export const LazyKakaoMap = lazy(() => 
  import('./common/KakaoMap').then(module => ({
    default: module.default
  }))
)

export const LazyNavigationGuide = lazy(() => 
  import('./common/NavigationGuide').then(module => ({
    default: module.default
  }))
)

export const LazyAuthenticationBanner = lazy(() => 
  import('./common/AuthenticationBanner').then(module => ({
    default: module.default
  }))
)

// 페이지 컴포넌트들 (더 큰 번들 크기)
export const LazyRunningPage = lazy(() => 
  import('../app/running/page').then(module => ({
    default: module.default
  }))
)

export const LazyRunningStartPage = lazy(() => 
  import('../app/running/start/page').then(module => ({
    default: module.default
  }))
)

export const LazySpotsPage = lazy(() => 
  import('../app/spots/page').then(module => ({
    default: module.default
  }))
)

export const LazyProfilePage = lazy(() => 
  import('../app/profile/page').then(module => ({
    default: module.default
  }))
)

export const LazyAdminPage = lazy(() => 
  import('../app/admin/page').then(module => ({
    default: module.default
  }))
)

// 래핑된 컴포넌트들 (Suspense 포함)
export const RunningMapWithSuspense = withLazyLoading(
  LazyRunningMap,
  <LoadingSpinner message="지도를 불러오는 중..." />
)

export const KakaoMapWithSuspense = withLazyLoading(
  LazyKakaoMap,
  <LoadingSpinner message="지도를 불러오는 중..." />
)

export const NavigationGuideWithSuspense = withLazyLoading(
  LazyNavigationGuide,
  <LoadingSpinner message="네비게이션을 준비하는 중..." />
)

export const AuthenticationBannerWithSuspense = withLazyLoading(
  LazyAuthenticationBanner,
  <div className="h-12 bg-gray-900 animate-pulse rounded-lg" />
)

// 페이지 컴포넌트들 (전체 페이지 로딩)
export const RunningPageWithSuspense = withLazyLoading(
  LazyRunningPage,
  <PageLoadingSpinner message="런닝 페이지를 불러오는 중..." />
)

export const RunningStartPageWithSuspense = withLazyLoading(
  LazyRunningStartPage,
  <PageLoadingSpinner message="런닝을 준비하는 중..." />
)

export const SpotsPageWithSuspense = withLazyLoading(
  LazySpotsPage,
  <PageLoadingSpinner message="제휴 스팟을 불러오는 중..." />
)

export const ProfilePageWithSuspense = withLazyLoading(
  LazyProfilePage,
  <PageLoadingSpinner message="프로필을 불러오는 중..." />
)

export const AdminPageWithSuspense = withLazyLoading(
  LazyAdminPage,
  <PageLoadingSpinner message="관리자 페이지를 불러오는 중..." />
)
