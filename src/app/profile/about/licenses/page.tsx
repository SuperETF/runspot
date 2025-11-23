'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function LicensesPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 상단 헤더 */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-muted rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">오픈소스 라이선스</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        <div className="bg-card/80 glass rounded-2xl p-6 border border-border">
          <h2 className="text-xl font-bold text-foreground mb-6">오픈소스 라이선스</h2>
          
          <div className="space-y-6 text-foreground/80 leading-relaxed">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">사용된 오픈소스 라이브러리</h3>
              <p className="mb-4">
                RunSpot Seoul 애플리케이션은 다음과 같은 오픈소스 라이브러리를 사용합니다:
              </p>
            </div>

            <div>
              <h4 className="text-md font-semibold text-foreground mb-2">React (MIT License)</h4>
              <p className="mb-2">Copyright (c) Meta Platforms, Inc. and affiliates.</p>
              <p className="mb-4">
                Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the &quot;Software&quot;), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software.
              </p>
            </div>

            <div>
              <h4 className="text-md font-semibold text-foreground mb-2">Next.js (MIT License)</h4>
              <p className="mb-2">Copyright (c) 2024 Vercel, Inc.</p>
              <p className="mb-4">
                Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the &quot;Software&quot;), to deal in the Software without restriction.
              </p>
            </div>

            <div>
              <h4 className="text-md font-semibold text-foreground mb-2">Tailwind CSS (MIT License)</h4>
              <p className="mb-2">Copyright (c) Tailwind Labs, Inc.</p>
              <p className="mb-4">
                Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files.
              </p>
            </div>

            <div>
              <h4 className="text-md font-semibold text-foreground mb-2">Lucide React (ISC License)</h4>
              <p className="mb-2">Copyright (c) 2024 Lucide Contributors</p>
              <p className="mb-4">
                Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted.
              </p>
            </div>

            <div>
              <h4 className="text-md font-semibold text-foreground mb-2">TypeScript (Apache 2.0 License)</h4>
              <p className="mb-2">Copyright (c) Microsoft Corporation.</p>
              <p className="mb-4">
                Licensed under the Apache License, Version 2.0. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">라이선스 고지</h3>
              <p className="mb-4">
                본 애플리케이션에 사용된 모든 오픈소스 라이브러리는 각각의 라이선스 조건에 따라 사용되었으며, 해당 라이선스의 모든 조건을 준수합니다.
              </p>
              <p className="mb-4">
                각 라이브러리의 전체 라이선스 텍스트는 해당 라이브러리의 공식 저장소에서 확인할 수 있습니다.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">저작권 정보</h3>
              <p className="mb-4">
                RunSpot Seoul 애플리케이션의 고유 코드 및 디자인은 RunSpot Team의 저작물입니다.
              </p>
              <p>
                오픈소스 라이브러리를 제외한 모든 코드, 디자인, 콘텐츠에 대한 저작권은 RunSpot Team에 있습니다.
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
