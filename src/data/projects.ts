export type ProjectAuthorship = 'individual' | 'member-linked' | 'club';

export interface ProjectScreenshot {
  id: string;
  src: string;
  alt: string;
  label: string;
  caption: string;
  badge?: string;
  width: number;
  height: number;
}

export interface ProjectSubItem {
  title: string;
  genre: string;
  summary: string;
  url: string;
  ctaLabel: string;
  accent: string;
}

export interface ProjectFormatIcon {
  code: string;
  label: string;
  src: string;
  note: string;
}

export interface ProjectHighlight {
  index: string;
  title: string;
  body: string;
}

export interface ProjectSecondaryLink {
  label: string;
  url: string;
  kind: 'repo' | 'app' | 'info' | 'game';
}

export interface ProjectTheme {
  polarity: 'dark' | 'light';
  surface: string;
  surfaceElevated: string;
  ink: string;
  muted: string;
  accent: string;
  accentInk: string;
  accentSecondary: string;
  border: string;
  badgeBg: string;
  badgeInk: string;
  signalTint: [number, number, number];
}

export interface ProjectEntry {
  id: string;
  slug: string;
  indexLabel: string;
  title: string;
  englishTitle: string;
  creator: string;
  creatorRole: string;
  authorship: ProjectAuthorship;
  authorshipLabel: string;
  year: number;
  category: '게임' | '소프트웨어';
  categoryEn: string;
  status: string;
  tagline: string;
  description: string;
  extendedDescription: string[];
  externalUrl: string;
  externalLabel: string;
  secondaryLinks: ProjectSecondaryLink[];
  artwork: {
    coverSrc: string;
    coverAlt: string;
    wordmarkSrc?: string;
    wordmarkAlt?: string;
    wordmarkLightPlate?: boolean;
    iconSrc?: string;
    iconAlt?: string;
  };
  screenshots: ProjectScreenshot[];
  highlights: ProjectHighlight[];
  subItems?: ProjectSubItem[];
  formatIcons?: ProjectFormatIcon[];
  honestNotes?: string[];
  tags: string[];
  theme: ProjectTheme;
}

export const PROJECTS: ProjectEntry[] = [
  {
    id: 'seojun-arcade',
    slug: 'seojun-arcade',
    indexLabel: '01',
    title: '서준이네 오락실',
    englishTitle: 'SEOJUN ARCADE',
    creator: '염서준',
    creatorRole: 'SONA 부원 · 개인 제작',
    authorship: 'individual',
    authorshipLabel: '학생 개인 작품',
    year: 2026,
    category: '게임',
    categoryEn: 'WEB GAME PORTAL',
    status: '웹 공개 · 운영 중',
    tagline: '브라우저에서 바로 골라 들어가는 학생 제작 웹게임 포털.',
    description:
      '별빛이 흐르는 레트로 오락실 화면에서 직접 만든 웹게임들을 한데 모아 둔 독립 포털입니다. 탭 클리커 〈키 키우기〉와 학교생활 시뮬레이션 〈나는 이번생은 양일고다!〉를 설치 없이 바로 플레이할 수 있습니다.',
    extendedDescription: [
      '〈서준이네 오락실〉은 SONA 부원 염서준이 직접 기획하고 제작해 운영하는 독립 웹게임 포털입니다. 첫 화면에 들어서면 ‘PRESS START’ 배지와 함께 두 게임의 일러스트 카드가 나란히 놓여 있어, 오락실 기기 앞에서 오늘 즐길 게임을 고르듯 가볍게 진입할 수 있습니다.',
      '포털에 수록된 〈키 키우기〉는 화면을 탭해 50cm 아기에서 시작해 의자(80cm) 등 단계별 목표와 업그레이드를 달성하며 자라는 탭 클리커이며, 〈나는 이번생은 양일고다!〉는 칠판 UI를 무대로 무작위 능력치를 받아 양일고에서의 3년과 다양한 엔딩을 경험하는 학교생활 시뮬레이션입니다.',
      'SONA 아카이브는 원본 포털의 분위기와 게임 구성을 존중해 전시하며, 실제 플레이와 기록은 제작자의 공식 웹 포털로 직접 연결합니다.',
    ],
    externalUrl: 'https://flossseojun.github.io/',
    externalLabel: '서준이네 오락실 방문',
    secondaryLinks: [
      {
        label: '키 키우기 바로 플레이',
        url: 'https://flossseojun.github.io/Growth-/',
        kind: 'game',
      },
      {
        label: '나는 이번생은 양일고다! 플레이',
        url: 'https://flossseojun.github.io/yangil/',
        kind: 'game',
      },
      {
        label: 'GitHub 공개 저장소',
        url: 'https://github.com/flossseojun/flossseojun.github.io',
        kind: 'repo',
      },
    ],
    artwork: {
      coverSrc: '/assets/projects/seojun-arcade/portal.webp',
      coverAlt: '서준이네 오락실 메인 포털 화면 — 키 키우기와 나는 이번생은 양일고다! 게임 선택 카드',
    },
    screenshots: [
      {
        id: 'portal',
        src: '/assets/projects/seojun-arcade/portal.webp',
        alt: '서준이네 오락실 메인 화면. PRESS START 배지 아래 키 키우기와 나는 이번생은 양일고다! 카드가 나란히 배치되어 있다.',
        label: '오락실 메인',
        caption: 'flossseojun.github.io — 두 개의 웹게임을 바로 골라 들어가는 밤하늘 오락실 포털',
        badge: 'PORTAL',
        width: 1440,
        height: 900,
      },
      {
        id: 'growth',
        src: '/assets/projects/seojun-arcade/growth.webp',
        alt: '키 키우기 실제 플레이 화면. 50cm에서 시작해 의자 80cm 목표를 향해 탭하고 업그레이드하는 인터페이스.',
        label: '키 키우기',
        caption: '탭 클리커 — 50cm부터 시작해 탭·자동·강화·특별·꾸미기·과제로 키를 키우는 성장 게임',
        badge: 'TAP CLICKER',
        width: 1440,
        height: 900,
      },
      {
        id: 'yangil',
        src: '/assets/projects/seojun-arcade/yangil.webp',
        alt: '나는 이번생은 양일고다! 시작 화면. 교실 칠판 스타일 배경에 참되게 바르게 알차게 교훈과 새 인생 시작 버튼이 보인다.',
        label: '나는 이번생은 양일고다!',
        caption: '학교생활 시뮬레이션 — 무작위 능력치로 입학해 선택으로 3년을 살아내는 양일고 팬 게임',
        badge: 'SCHOOL SIM',
        width: 1440,
        height: 900,
      },
    ],
    subItems: [
      {
        title: '키 키우기',
        genre: '탭 클리커',
        summary:
          '마구 탭해서 키를 쭉쭉 키워 보자. 50cm에서 출발해 30초 대결, 업그레이드, 꾸미기와 과제를 거쳐 친구들보다 더 크게 자라는 클리커 게임.',
        url: 'https://flossseojun.github.io/Growth-/',
        ctaLabel: '키 키우러 가기',
        accent: '#5EF2C8',
      },
      {
        title: '나는 이번생은 양일고다!',
        genre: '학교생활 시뮬',
        summary:
          '무작위 능력치로 입학해서 졸업까지. 교실 칠판 위에서 펼쳐지는 사건과 시험 보스전, 선택에 따라 갈리는 여러 엔딩을 모으는 시뮬레이션.',
        url: 'https://flossseojun.github.io/yangil/',
        ctaLabel: '입학하러 가기',
        accent: '#FFD23F',
      },
    ],
    highlights: [
      {
        index: '01',
        title: '독립 웹게임 포털 구조',
        body: '설치나 로그인 절차 없이 주소 하나로 여러 게임을 탐색하고 바로 실행할 수 있으며, 홈 화면 추가(PWA 아이콘·매니페스트)도 갖추고 있습니다.',
      },
      {
        index: '02',
        title: '개성 있는 시각 연출과 유머',
        body: '포털의 밤하늘 오락실 톤부터 〈키 키우기〉의 경쾌한 룰러 UI, 〈나는 이번생은 양일고다!〉의 교실 칠판 인터페이스까지 게임마다 고유한 분위기를 설계했습니다.',
      },
      {
        index: '03',
        title: '계속 확장되는 개인 게임 모음',
        body: '기존 게임의 업데이트(학기말 보스전, 신규 친구 이벤트 등)가 꾸준히 이어지고 있으며, 새로운 게임도 포털에 추가될 예정입니다.',
      },
    ],
    honestNotes: [
      '모든 게임 플레이와 기존 시스템은 제작자의 원본 사이트(flossseojun.github.io)에서 그대로 동작하며, SONA는 외부 링크로 직접 연결합니다.',
    ],
    tags: ['웹게임', '탭 클리커', '시뮬레이션', 'HTML5', 'PWA'],
    theme: {
      polarity: 'dark',
      surface: '#1B1640',
      surfaceElevated: '#261E56',
      ink: '#FFF8EC',
      muted: '#C9C0FF',
      accent: '#FFD23F',
      accentInk: '#1B1640',
      accentSecondary: '#5EF2C8',
      border: 'rgba(201, 192, 255, 0.22)',
      badgeBg: 'rgba(255, 126, 182, 0.18)',
      badgeInk: '#FF9AC6',
      signalTint: [0.37, 0.95, 0.78],
    },
  },
  {
    id: 'asterism-write',
    slug: 'asterism-write',
    indexLabel: '02',
    title: 'Asterism Write',
    englishTitle: 'ASTERISM WRITE',
    creator: 'SONA 부원 · QuadraJ',
    creatorRole: '부원 개발 · QuadraJ 소프트웨어 프로젝트',
    authorship: 'member-linked',
    authorshipLabel: '부원 · QuadraJ 연계 프로젝트',
    year: 2026,
    category: '소프트웨어',
    categoryEn: 'DOCUMENT & PDF STUDIO',
    status: '웹 버전 공개 · 1.0.0-rc.1 개발 중',
    tagline: '문서 작성과 PDF 필기를 한곳에서 다루는 웹·데스크톱 문서 편집기.',
    description:
      '보고서, 연구 기록, 회의록처럼 글·표·수식이 함께 담긴 문서를 브라우저에서 바로 작성하고 PDF 필기까지 이어서 작업할 수 있는 독립 문서 편집 소프트웨어입니다.',
    extendedDescription: [
      'Asterism Write는 종이 페이지의 질서와 디지털 편집 환경의 정밀함을 함께 설계한 문서 편집 소프트웨어입니다. 상단 리본 도구, 가로 눈금자, 문맥별 오른쪽 글자·문단 속성 패널을 중심으로 페이지 위에서 직접 문서를 다듬을 수 있습니다.',
      '독립 Rust 문서 엔진을 WebAssembly와 데스크톱(Tauri) 환경으로 연결하는 구조로 개발되고 있으며, 현재 웹 버전에서는 설치와 계정 로그인 없이 새 문서를 만들거나 기기의 로컬 문서·PDF를 열어 편집하고 파일로 저장할 수 있습니다.',
      '기본 저장 형식인 ASTW와 함께 DOCX·HWPX·Markdown·HTML·PDF 작업을 지원하며, 데스크톱 설치 파일(Windows·macOS)은 정식 배포를 준비 중인 1.0.0-rc.1 개발 후보 단계입니다.',
    ],
    externalUrl: 'https://asterism.quadraj.com/',
    externalLabel: 'Asterism Write 공식 사이트',
    secondaryLinks: [
      {
        label: '웹 편집기 바로 열기',
        url: 'https://asterism.quadraj.com/app',
        kind: 'app',
      },
      {
        label: '설치 안내 보기',
        url: 'https://asterism.quadraj.com/download/',
        kind: 'info',
      },
      {
        label: 'GitHub 개발 소식',
        url: 'https://github.com/PastelJ321/asterism-write',
        kind: 'repo',
      },
    ],
    artwork: {
      coverSrc: '/assets/projects/asterism-write/editor.webp',
      coverAlt: 'Asterism Write 실제 문서 편집 화면 — 리본 메뉴, 눈금자, 기본 보고서 편집 영역',
      wordmarkSrc: '/assets/projects/asterism-write/wordmark.webp',
      wordmarkAlt: 'Asterism Write 공식 워드마크',
      wordmarkLightPlate: true,
      iconSrc: '/assets/projects/asterism-write/app-icon.webp',
      iconAlt: 'Asterism Write 공식 앱 아이콘',
    },
    screenshots: [
      {
        id: 'editor',
        src: '/assets/projects/asterism-write/editor.webp',
        alt: 'Asterism Write의 상단 리본 메뉴, 가로 눈금자, 기본 보고서 템플릿이 열린 실제 편집 화면',
        label: '문서 편집기',
        caption: '리본 도구와 가로 눈금자 위에서 보고서·연구 기록·회의록을 편집하는 실제 웹 앱 화면',
        badge: 'EDITOR',
        width: 1440,
        height: 960,
      },
      {
        id: 'properties',
        src: '/assets/projects/asterism-write/properties.webp',
        alt: '오른쪽에 글자 모양과 문단 모양 속성 패널이 열린 실제 Asterism Write 1.0.0-rc.1 화면',
        label: '글자·문단 속성',
        caption: '자간·장평·들여쓰기·문단 간격·줄 간격을 실시간으로 조정하는 오른쪽 속성 패널',
        badge: 'TYPOGRAPHY',
        width: 1280,
        height: 900,
      },
      {
        id: 'pdf',
        src: '/assets/projects/asterism-write/pdf.webp',
        alt: '수식이 포함된 PDF 페이지 위에 파란 펜 필기가 표시된 Asterism Write PDF 작업 화면',
        label: 'PDF 필기',
        caption: '기존 PDF를 열어 펜·형광펜·텍스트 주석을 남기고 쪽 추출·병합까지 수행하는 PDF 작업 모드',
        badge: 'PDF STUDIO',
        width: 1440,
        height: 2073,
      },
    ],
    highlights: [
      {
        index: '01',
        title: '페이지 중심 편집과 서식 정밀도',
        body: '리본 도구, 눈금자, 오른쪽 글자·문단 속성 패널을 통해 글꼴·스타일·여백·용지 크기·표 셀 병합과 기본 수식을 한 화면에서 다듬습니다.',
      },
      {
        index: '02',
        title: 'ASTW · DOCX · HWPX 문서 흐름',
        body: '기본 형식 ASTW에 편집 내용과 원본 정보를 함께 보관하며, DOCX·HWPX·Markdown·HTML·PDF 형식의 열기와 내보내기를 지원합니다.',
      },
      {
        index: '03',
        title: '읽고 필기하는 통합 PDF 모드',
        body: '작성한 문서를 PDF로 내보내는 것은 물론, 기존 PDF에 펜·형광펜·텍스트 주석을 추가하고 쪽 병합과 추출을 수행할 수 있습니다.',
      },
      {
        index: '04',
        title: '로컬 우선 · 계정 없는 시작',
        body: '기본 문서 작업과 PDF 필기는 로그인이나 문서 서버 전송 없이 기기 안에서 바로 처리되며, 결과는 사용자의 로컬 파일로 저장합니다.',
      },
    ],
    formatIcons: [
      {
        code: 'ASTW',
        label: '기본 저장',
        src: '/assets/projects/asterism-write/formats/astw.webp',
        note: '편집·원본 보관',
      },
      {
        code: 'DOCX',
        label: '열기 · 내보내기',
        src: '/assets/projects/asterism-write/formats/docx.webp',
        note: '본문·표·서식',
      },
      {
        code: 'HWPX',
        label: '열기 · 내보내기',
        src: '/assets/projects/asterism-write/formats/hwpx.webp',
        note: 'OWPML 문서',
      },
      {
        code: 'PDF',
        label: '내보내기 · 필기',
        src: '/assets/projects/asterism-write/formats/pdf.webp',
        note: '주석·병합·추출',
      },
      {
        code: 'MD',
        label: 'Markdown',
        src: '/assets/projects/asterism-write/formats/md.webp',
        note: 'CommonMark/GFM',
      },
      {
        code: 'HWP',
        label: '가져오기 · 실험',
        src: '/assets/projects/asterism-write/formats/hwp.webp',
        note: '제한적 실험 저장',
      },
    ],
    honestNotes: [
      '현재 1.0.0-rc.1 개발 후보 단계로, 웹 버전은 바로 이용할 수 있으나 Windows·macOS 정식 설치 파일은 아직 공개되지 않았습니다.',
      'DOCX·HWPX의 복잡한 원본 배치나 일부 개체는 차이가 있을 수 있으며, HWP 저장은 제한된 실험 기능으로 제공됩니다.',
      'PDF 모드에서는 주석·필기·쪽 정리를 지원하며, 기존 PDF 본문을 일반 워드 문서처럼 재편집(reflow)하는 기능은 제공하지 않습니다.',
    ],
    tags: ['문서 편집기', 'PDF 필기', 'Rust/WASM', 'ASTW', 'DOCX·HWPX'],
    theme: {
      polarity: 'light',
      surface: '#F4F6FA',
      surfaceElevated: '#FFFFFF',
      ink: '#171C28',
      muted: '#556075',
      accent: '#405CC8',
      accentInk: '#FFFFFF',
      accentSecondary: '#1E2942',
      border: 'rgba(23, 28, 40, 0.12)',
      badgeBg: '#E7EEFF',
      badgeInk: '#2F48AD',
      signalTint: [0.36, 0.46, 1.0],
    },
  },
];

export function getProjectBySlug(slug: string): ProjectEntry | undefined {
  return PROJECTS.find((p) => p.slug === slug || p.id === slug);
}

export function getArchiveYears(): number[] {
  const years = Array.from(new Set(PROJECTS.map((p) => p.year)));
  return years.sort((a, b) => b - a);
}
