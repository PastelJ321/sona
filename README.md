# SONA — 양일고등학교 코딩동아리 웹사이트

양일고등학교 코딩동아리 **SONA**의 프로젝트 웹사이트(`sona.quadraj.com`)입니다.  
마우스 움직임과 자연스러운 스크롤만으로 키네틱 3D 조형물과 부원들이 만든 게임·소프트웨어를 둘러보고 원본 사이트로 바로 이동할 수 있습니다.

## 구성

- **Material Signal 3D 스튜디오** (`src/studio/`):
  - **스튜디오 환경 & PBR 재질** (`StudioEnvironment.ts`, `MaterialLibrary.ts`): 다크/데이라이트 소프트박스 라이트포머 PMREM 환경맵과 절차적 브러시드 알루미늄·비드블라스트 티타늄·광학 유리·곡면 코튼 종이·고광택 래커 폴리머 텍스처.
  - **스프링 포인터 물리** (`SpringPhysics.ts`): 3단계 가상 질량(광학 유리·기계식 블레이드·구조 프레임)과 포인터 속도 기반 관성 반응.
  - **히어로 조형물** (`HeroSignalSculpture.ts`): 23개 가공 금속 블레이드와 선반 가공 광학 유리 렌즈로 구성한 키네틱 레조네이터.
  - **스크롤 연동 3D 전시** (`ArcadeSculpture.ts`, `AsterismSculpture.ts`, `MaterialSignalStudio.ts`): 어두운 바살트 → 벨벳 인디고(서준이네 오락실) → 밝은 데이라이트 포슬린(Asterism Write)으로 이어지는 단일 캔버스 연출.
- **프로젝트 기록 & 소개** (`src/pages/`): 시맨틱 HTML 기반 작품 목록(`/archive`), 개별 상세 페이지(`/works/:slug`), 동아리 소개(`/about`), WebGL 미지원 대체 화면.

## 새 작품 추가

1. 최적화된 프로젝트 이미지를 `public/assets/projects/<project-id>/`에 추가합니다.
2. `src/data/projects.ts`의 `PROJECTS` 배열에 새 항목을 등록합니다.

## 로컬 실행 및 배포

```sh
npm install
npm run dev        # 개발 서버
npm run typecheck  # TypeScript 검사
npm run lint       # ESLint 검사
npm run build      # 프로덕션 빌드 (dist/)
```

- **Cloudflare Pages**: Build command `npm run build`, Output directory `dist` (`public/_redirects`, `public/_headers` 포함).
- **서체 라이선스**: IBM Plex Sans KR, IBM Plex Mono (SIL OFL 1.1, `public/fonts/`).
