# SONA — 양일고등학교 코딩동아리

**SONA — Material Signal 2.0**

양일고등학교 코딩동아리 **소나(SONA)**의 공식 프로젝트 웹사이트(`sona.quadraj.com`)입니다.  
부원들이 제작한 게임과 소프트웨어를 일관된 **Lamella Signal** 시각 언어와 실시간 3D 스튜디오, 에디토리얼 타이포그래피로 전시·기록합니다.

## 주요 구성

- **Arrival Hero**: 23개의 에어포일 알루미늄·티타늄 라멜라와 광학 유리 코어로 구성된 키네틱 시그널 조형물 및 다층 스프링 포인터 반응
- **Signal Transformation**: 히어로에서 작품 전시로 이어지는 스크롤 연동 위상 전환 브리지
- **서준이네 오락실 (`01`)**: 염서준 제작 웹게임 포털 — 백라이트 마키·라멜라 스피커·실제 게임 스크린샷 CRT가 결합된 3D 아케이드 스튜디오 + 2종 플레이 포스터 상세 전시
- **Asterism Write (`02`)**: SONA 부원 · QuadraJ 연계 문서 편집기 — 알루미늄 교정 플레이트, 5장의 곡면 코튼 페이퍼, 삼각 광학 프리즘으로 구성된 데이라이트 아틀리에 + 스위스 포맷 매트릭스 상세 전시
- **Archive & About**: 커서 연동 미리보기 아카이브(`/archive`)와 동일한 스프링 물리 기반 2D 제너레이티브 시그널 매트릭스(`/about`)
- **Unified Motion**: 3D·2D·DOM이 공유하는 감쇠 스프링 물리(`src/motion/SignalMotion.ts`)와 5-라멜라 라우트 셔터 전환(`SignalShutter`)

## 개발 및 빌드

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run build
```

Cloudflare Pages 정적 배포용 `public/_redirects` 및 `public/_headers`가 포함되어 있습니다.
