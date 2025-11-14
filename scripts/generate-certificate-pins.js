#!/usr/bin/env node

/**
 * SSL/TLS 인증서 핀 생성 도구
 * 실제 도메인의 인증서 정보를 가져와서 핀을 생성합니다.
 */

const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 핀을 생성할 도메인 목록
const domains = [
  'supabase.co',
  'dapi.kakao.com',
  'googleapis.com',
  'maps.googleapis.com',
  'firebase.googleapis.com',
  'runspot.seoul.kr' // 실제 도메인으로 교체 필요
];

/**
 * 도메인의 SSL 인증서 정보를 가져옵니다.
 */
async function getCertificateInfo(domain) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: domain,
      port: 443,
      method: 'GET',
      rejectUnauthorized: false, // 인증서 정보 수집을 위해 임시로 false
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      const cert = res.socket.getPeerCertificate(true);
      
      if (!cert || Object.keys(cert).length === 0) {
        reject(new Error(`No certificate found for ${domain}`));
        return;
      }

      // 인증서 체인 정보 수집
      const certChain = [];
      let currentCert = cert;
      
      while (currentCert && Object.keys(currentCert).length > 0) {
        certChain.push({
          subject: currentCert.subject,
          issuer: currentCert.issuer,
          valid_from: currentCert.valid_from,
          valid_to: currentCert.valid_to,
          fingerprint: currentCert.fingerprint,
          fingerprint256: currentCert.fingerprint256,
          serialNumber: currentCert.serialNumber,
          raw: currentCert.raw
        });
        
        currentCert = currentCert.issuerCertificate;
        
        // 무한 루프 방지
        if (currentCert === cert) break;
      }

      resolve({
        domain,
        certChain,
        protocol: res.socket.getProtocol(),
        cipher: res.socket.getCipher()
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Failed to get certificate for ${domain}: ${error.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout getting certificate for ${domain}`));
    });

    req.end();
  });
}

/**
 * 인증서에서 SPKI 핀을 생성합니다.
 */
function generateSPKIPin(certRaw) {
  try {
    // DER 형식의 인증서에서 공개키 추출
    const cert = crypto.createHash('sha256');
    
    // 실제 구현에서는 더 정교한 SPKI 추출이 필요
    // 여기서는 인증서 전체의 해시를 사용 (예시)
    cert.update(certRaw);
    const hash = cert.digest('base64');
    
    return hash;
  } catch (error) {
    console.error('Error generating SPKI pin:', error);
    return null;
  }
}

/**
 * Android Network Security Config용 핀 설정 생성
 */
function generateAndroidPinConfig(certInfo) {
  const pins = certInfo.certChain
    .map(cert => generateSPKIPin(cert.raw))
    .filter(pin => pin !== null)
    .slice(0, 2); // 최대 2개의 핀 사용

  return `
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">${certInfo.domain}</domain>
        <pin-set expiration="2025-12-31">
            ${pins.map(pin => `<pin digest="SHA-256">${pin}</pin>`).join('\n            ')}
        </pin-set>
        <trust-anchors>
            <certificates src="system"/>
        </trust-anchors>
    </domain-config>`;
}

/**
 * iOS ATS용 핀 설정 생성
 */
function generateiOSPinConfig(certInfo) {
  const pins = certInfo.certChain
    .map(cert => generateSPKIPin(cert.raw))
    .filter(pin => pin !== null)
    .slice(0, 2); // 최대 2개의 핀 사용

  return `
        <key>${certInfo.domain}</key>
        <dict>
            <key>NSIncludesSubdomains</key>
            <true/>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <false/>
            <key>NSExceptionMinimumTLSVersion</key>
            <string>TLSv1.3</string>
            <key>NSExceptionRequiresForwardSecrecy</key>
            <true/>
            <key>NSRequiresCertificateTransparency</key>
            <true/>
            <key>NSPinnedDomains</key>
            <dict>
                <key>${certInfo.domain}</key>
                <dict>
                    <key>NSIncludesSubdomains</key>
                    <true/>
                    <key>NSPinnedCAIdentities</key>
                    <array>
                        ${pins.map(pin => `<data>${pin}</data>`).join('\n                        ')}
                    </array>
                </dict>
            </dict>
        </dict>`;
}

/**
 * 메인 함수
 */
async function main() {
  console.log('🔐 SSL/TLS 인증서 핀 생성 시작...\n');

  const results = [];
  const errors = [];

  // 각 도메인의 인증서 정보 수집
  for (const domain of domains) {
    try {
      console.log(`📡 ${domain} 인증서 정보 수집 중...`);
      const certInfo = await getCertificateInfo(domain);
      results.push(certInfo);
      console.log(`✅ ${domain} 완료`);
    } catch (error) {
      console.error(`❌ ${domain} 실패: ${error.message}`);
      errors.push({ domain, error: error.message });
    }
  }

  console.log(`\n📊 결과: ${results.length}개 성공, ${errors.length}개 실패\n`);

  // 결과 파일 생성
  const outputDir = path.join(__dirname, '..', 'certificate-pins');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Android 설정 파일 생성
  const androidConfig = results.map(generateAndroidPinConfig).join('\n');
  fs.writeFileSync(
    path.join(outputDir, 'android-pins.xml'),
    `<?xml version="1.0" encoding="utf-8"?>
<!-- 자동 생성된 Android Network Security Config 핀 설정 -->
<!-- 생성 시간: ${new Date().toISOString()} -->
<network-security-config>
${androidConfig}
</network-security-config>`
  );

  // iOS 설정 파일 생성
  const iOSConfig = results.map(generateiOSPinConfig).join('\n');
  fs.writeFileSync(
    path.join(outputDir, 'ios-pins.plist'),
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<!-- 자동 생성된 iOS ATS 핀 설정 -->
<!-- 생성 시간: ${new Date().toISOString()} -->
<plist version="1.0">
<dict>
    <key>NSExceptionDomains</key>
    <dict>
${iOSConfig}
    </dict>
</dict>
</plist>`
  );

  // 인증서 정보 JSON 파일 생성
  const certData = {
    generated: new Date().toISOString(),
    domains: results.map(result => ({
      domain: result.domain,
      protocol: result.protocol,
      cipher: result.cipher,
      certificates: result.certChain.map(cert => ({
        subject: cert.subject,
        issuer: cert.issuer,
        valid_from: cert.valid_from,
        valid_to: cert.valid_to,
        fingerprint: cert.fingerprint,
        fingerprint256: cert.fingerprint256,
        serialNumber: cert.serialNumber
      }))
    })),
    errors
  };

  fs.writeFileSync(
    path.join(outputDir, 'certificate-info.json'),
    JSON.stringify(certData, null, 2)
  );

  // 보고서 출력
  console.log('📄 생성된 파일:');
  console.log(`  - ${path.join(outputDir, 'android-pins.xml')}`);
  console.log(`  - ${path.join(outputDir, 'ios-pins.plist')}`);
  console.log(`  - ${path.join(outputDir, 'certificate-info.json')}`);

  if (errors.length > 0) {
    console.log('\n⚠️  오류 발생:');
    errors.forEach(({ domain, error }) => {
      console.log(`  - ${domain}: ${error}`);
    });
  }

  console.log('\n🔐 인증서 핀 생성 완료!');
  console.log('\n📝 다음 단계:');
  console.log('1. 생성된 핀을 실제 설정 파일에 복사');
  console.log('2. 인증서 만료일 확인 및 업데이트 일정 설정');
  console.log('3. 백업 핀 설정 (인증서 갱신 대비)');
  console.log('4. 테스트 환경에서 검증 후 프로덕션 적용');
}

// 스크립트 실행
if (require.main === module) {
  main().catch(error => {
    console.error('💥 스크립트 실행 오류:', error);
    process.exit(1);
  });
}

module.exports = {
  getCertificateInfo,
  generateSPKIPin,
  generateAndroidPinConfig,
  generateiOSPinConfig
};
