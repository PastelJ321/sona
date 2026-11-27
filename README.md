# PROJECT SONA — Living Digital Atelier

양일고등학교 코딩동아리 **SONA**의 공식 프로젝트 전시 및 디지털 아카이브 웹사이트(`sona.quadraj.com`) 코드베이스입니다.

## 주요 구성

- **Living Signal 인터랙티브 스테이지** (`src/engine/LivingSignalEngine.ts`, `src/components/LivingSignalStage.tsx`): 단일 패스 해석적 그래디언트 WebGL 셰이더와 고해상도 2D 벡터 오버레이를 결합한 실시간 파동 간섭·공명 그래픽 시스템입니다. 클릭/탭으로 공명 노드 배치, 모드 전환(간섭장 / 공명격자 / 파면), 선택적 Web Audio 배음 신스(`src/engine/SignalAudio.ts`), Canvas2D 폴백, WebGL 컨텍스트 복구, 화면 밖 렌더 일시정지, `prefers-reduced-motion` 정적 구도를 지원합니다.
- **전시 작품 쇼케이스** (`src/components/ProjectExhibition.tsx`, `src/pages/ProjectDetailPage.tsx`):
  - **01 · 서준이네 오락실** (`https://flossseojun.github.io/`, 제작자 염서준 · 학생 개인 작품)
  - **02 · Asterism Write** (`https://asterism.quadraj.com/`, SONA 부원 · QuadraJ 연계 프로젝트)
- **확장 가능한 연도별 아카이브** (`src/data/projects.ts`, `src/components/ArchiveIndex.tsx`, `src/pages/ArchivePage.tsx`): 분야·제작 구분 필터와 인덱스/보드 전환을 제공합니다.
- **적응형 반응형 경험** (`src/hooks/useViewportProfile.ts`): 데스크톱(비대칭 12컬럼 스테이지), 태블릿 가로/세로(분할 갤러리·터치 스위치), 모바일(엄지 하단 독 내비게이션·스크롤 스냅 갤러리·Safe Area 대응)에 맞춘 전용 레이아웃과 상호작용을 제공합니다.

## 새 프로젝트 추가 방법

페이지를 다시 설계하지 않고 데이터와 에셋만 추가하면 홈페이지 전시, 상세 전시 페이지(`/works/<slug>`), 연도별 아카이브에 자동으로 반영됩니다.

1. 프로젝트 이미지를 `public/assets/projects/<project-id>/`에 최적화(WebP 권장)해 추가합니다.
2. `src/data/projects.ts`의 `PROJECTS` 배열에 새 `ProjectEntry` 객체를 추가합니다.
   - `authorship` 필드로 학생 개인 작품(`'individual'`), 부원·연계 프로젝트(`'member-linked'`), 동아리 공동 작업물(`'club'`)을 명확히 구분합니다.

## 로컬 실행 및 검증

```sh
npm install
npm run dev        # 개발 서버 (http://127.0.0.1:5173)
npm run typecheck  # TypeScript 검사
npm run lint       # ESLint 검사
npm run build      # 프로덕션 정적 빌드 (dist/)
npm run preview    # 프로덕션 빌드 로컬 미리보기
```

## Cloudflare Pages 배포 및 도메인 연결 (`sona.quadraj.com`)

이 프로젝트는 독립 GitHub 저장소(`sona-website`)와 독립 Cloudflare Pages 프로젝트로 배포하도록 구성되어 있습니다.

1. **독립 GitHub 저장소 생성 및 푸시**
   - 새 저장소(예: `sona-website`)를 생성하고 이 디렉터리 내용을 푸시합니다.
2. **Cloudflare Pages 프로젝트 연결**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node.js version: `22` 이상 권장
   - SPA 라우팅(`public/_redirects`)과 정적 자산 캐시·보안 헤더(`public/_headers`)가 빌드 산출물(`dist/`)에 자동 포함됩니다.
3. **커스텀 도메인(`sona.quadraj.com`) 연결**
   - Cloudflare Pages 프로젝트의 **Custom domains**에서 `sona.quadraj.com`을 추가합니다.
   - `quadraj.com` DNS 영역에 Cloudflare가 안내하는 `CNAME` 레코드(`sona` → `<project>.pages.dev`)를 등록합니다.
4. **기존 `quadraj.com`과의 상호 링크**
   - 기존 QuadraJ 디자인과 구조를 변경하지 않고, 원할 때 QuadraJ 측 내비게이션 또는 프로젝트 목록에 `https://sona.quadraj.com/` 링크를 추가합니다.

## 라이선스 및 자산 고지

- UI 서체: IBM Plex Sans KR, IBM Plex Mono (SIL Open Font License 1.1, `public/fonts/`에 원문 포함).
- 외부 프로젝트의 로고·스크린샷·콘텐츠 권리는 각 제작자 및 원 프로젝트에 있으며, Asterism Write 공식 워드마크와 아이콘은 원형을 변경하지 않고 사용했습니다.
