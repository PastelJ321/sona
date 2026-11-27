# SONA — 양일고등학교 코딩동아리 웹사이트

양일고등학교 코딩동아리 **SONA**의 프로젝트 웹사이트(`sona.quadraj.com`)입니다.  
Three.js 기반 3D Living Signal 공간에서 부원들이 만든 게임과 프로그램을 둘러보고, 원본 사이트로 바로 이동할 수 있습니다.

## 구성

- **3D Signal World** (`src/world/`):
  - **Living Signal 지형** (`SignalTerrain.ts`): 간섭장·공명격자·파면 세 가지 모드와 클릭 파동, 공명 펄스에 반응하는 GLSL 변위 지형과 InstancedMesh 기둥.
  - **SONA Core** (`SonaCorePavilion.ts`): 중앙 자이로스코프 구조물과 양쪽 전시 공간으로 이어지는 신호 브리지.
  - **서준이네 오락실** (`SeojunArcadePavilion.ts`): `flossseojun.github.io`의 실제 화면을 전환해 볼 수 있는 3D 아케이드 캐비닛과 게임 키오스크.
  - **Asterism Write Studio** (`AsterismStudioPavilion.ts`): 공식 로고·아이콘·실제 편집기/PDF 화면과 종이 레이어 구조로 구성한 스튜디오 공간.
  - **탐색 방식**: 기본 **가이드 카메라**(곡선 스플라인 이동 + 드래그 회전 / 모바일 스와이프)와 선택형 **자유 탐험**(`SignalProbe.ts`, WASD/방향키·모바일 조이스틱 + 3개 중계기 발견).
- **프로젝트 기록 & 소개** (`src/pages/ArchivePage.tsx`, `src/pages/AboutPage.tsx`, `src/pages/ProjectDetailPage.tsx`): WebGL이 없거나 빠른 탐색을 원할 때 바로 이용할 수 있는 HTML 목록과 상세 페이지.

## 새 작품 추가

1. 프로젝트 이미지를 `public/assets/projects/<project-id>/`에 추가합니다.
2. `src/data/projects.ts`의 `PROJECTS` 배열에 항목을 추가합니다.
3. 3D 공간에 새 구역을 배치하려면 `src/world/zoneRegistry.ts`에 좌표와 기기별 카메라 구도를 등록합니다.

## 실행 및 배포

```sh
npm install
npm run dev        # 개발 서버
npm run typecheck  # TypeScript 검사
npm run lint       # ESLint 검사
npm run build      # 프로덕션 빌드 (dist/)
```

- **Cloudflare Pages**: Build command `npm run build`, Output directory `dist` (`public/_redirects`, `public/_headers` 포함).
- **서체 라이선스**: IBM Plex Sans KR, IBM Plex Mono (SIL OFL 1.1, `public/fonts/`).
