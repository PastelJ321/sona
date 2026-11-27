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
  zoneId: 'arcade' | 'asterism';
  indexLabel: string;
  title: string;
  shortTitle: string;
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
    zoneId: 'arcade',
    indexLabel: '01',
    title: '서준이네 오락실',
    shortTitle: '오락실',
    englishTitle: 'SEOJUN ARCADE',
    creator: '염서준',
    creatorRole: '개인 제작',
    authorship: 'individual',
    authorshipLabel: '개인 작품',
    year: 2026,
    category: '게임',
    categoryEn: 'WEB GAMES',
    status: '운영 중',
    tagline: '브라우저에서 바로 하는 웹게임 모음.',
    description:
      '염서준이 만든 웹게임 두 편이 올라가 있는 사이트입니다. 탭 클리커 〈키 키우기〉와 학교생활 시뮬레이션 〈나는 이번생은 양일고다!〉를 설치 없이 바로 할 수 있습니다.',
    extendedDescription: [
      '〈서준이네 오락실〉은 소나 부원 염서준이 운영하는 웹게임 사이트입니다. 들어가면 ‘PRESS START’ 아래로 게임 카드 두 개가 놓여 있어 원하는 쪽을 골라 바로 시작할 수 있습니다.',
      '〈키 키우기〉는 50cm 아기에서 출발해 화면을 탭하고 업그레이드를 사며 키를 키우는 클리커 게임이고, 〈나는 이번생은 양일고다!〉는 교실 칠판 화면에서 무작위 능력치로 입학해 3년을 보내며 엔딩을 모으는 시뮬레이션입니다.',
    ],
    externalUrl: 'https://flossseojun.github.io/',
    externalLabel: '사이트 열기',
    secondaryLinks: [
      {
        label: '키 키우기',
        url: 'https://flossseojun.github.io/Growth-/',
        kind: 'game',
      },
      {
        label: '나는 이번생은 양일고다!',
        url: 'https://flossseojun.github.io/yangil/',
        kind: 'game',
      },
      {
        label: 'GitHub',
        url: 'https://github.com/flossseojun/flossseojun.github.io',
        kind: 'repo',
      },
    ],
    artwork: {
      coverSrc: '/assets/projects/seojun-arcade/portal.webp',
      coverAlt: '서준이네 오락실 메인 화면 — 키 키우기와 나는 이번생은 양일고다! 선택 카드',
    },
    screenshots: [
      {
        id: 'portal',
        src: '/assets/projects/seojun-arcade/portal.webp',
        alt: '서준이네 오락실 메인 화면',
        label: '메인 화면',
        caption: 'flossseojun.github.io — 두 게임을 골라 들어가는 첫 화면',
        badge: 'PORTAL',
        width: 1440,
        height: 900,
      },
      {
        id: 'growth',
        src: '/assets/projects/seojun-arcade/growth.webp',
        alt: '키 키우기 플레이 화면',
        label: '키 키우기',
        caption: '50cm부터 시작해 탭·자동·강화·꾸미기로 키를 키우는 클리커',
        badge: 'CLICKER',
        width: 1440,
        height: 900,
      },
      {
        id: 'yangil',
        src: '/assets/projects/seojun-arcade/yangil.webp',
        alt: '나는 이번생은 양일고다! 시작 화면',
        label: '양일고 시뮬',
        caption: '무작위 능력치로 입학해 3년 동안 선택하며 엔딩을 모으는 게임',
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
          '화면을 탭해 키를 키우고 업그레이드와 30초 대결, 과제를 채워 가는 게임.',
        url: 'https://flossseojun.github.io/Growth-/',
        ctaLabel: '플레이',
        accent: '#5EF2C8',
      },
      {
        title: '나는 이번생은 양일고다!',
        genre: '학교생활 시뮬',
        summary:
          '무작위 능력치로 입학해 시험과 학교 사건을 겪으며 졸업 카드와 엔딩을 모으는 게임.',
        url: 'https://flossseojun.github.io/yangil/',
        ctaLabel: '플레이',
        accent: '#FFD23F',
      },
    ],
    highlights: [
      {
        index: '01',
        title: '설치 없이 바로 실행',
        body: '별도 로그인이나 앱 설치 없이 주소로 들어가 게임을 바로 시작할 수 있으며, 모바일 홈 화면 추가(PWA)도 지원합니다.',
      },
      {
        index: '02',
        title: '꾸준한 업데이트',
        body: '학기말 보스전과 신규 친구 이벤트 등이 계속 추가되고 있으며, 새 게임도 같은 포털에 올라갈 예정입니다.',
      },
    ],
    honestNotes: [
      '모든 게임은 제작자의 원본 사이트(flossseojun.github.io)에서 실행됩니다.',
    ],
    tags: ['웹게임', '클리커', '시뮬레이션', 'PWA'],
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
      badgeBg: 'rgba(255, 126, 182, 0.2)',
      badgeInk: '#FF9AC6',
      signalTint: [0.37, 0.95, 0.78],
    },
  },
  {
    id: 'asterism-write',
    slug: 'asterism-write',
    zoneId: 'asterism',
    indexLabel: '02',
    title: 'Asterism Write',
    shortTitle: 'Asterism',
    englishTitle: 'ASTERISM WRITE',
    creator: 'SONA 부원 · QuadraJ',
    creatorRole: '부원 · QuadraJ 연계',
    authorship: 'member-linked',
    authorshipLabel: '연계 프로젝트',
    year: 2026,
    category: '소프트웨어',
    categoryEn: 'DOCUMENT EDITOR',
    status: '웹 공개 · 1.0.0-rc.1 개발 중',
    tagline: '문서 편집과 PDF 필기를 함께 하는 프로그램.',
    description:
      '글, 표, 수식이 들어가는 보고서를 쓰고 PDF에 펜이나 형광펜으로 필기할 수 있습니다. 웹에서 로그인 없이 바로 열 수 있고, 데스크톱 버전은 준비 중입니다.',
    extendedDescription: [
      'Asterism Write는 브라우저와 데스크톱에서 쓸 수 있게 만들고 있는 문서 편집기입니다. 상단 리본과 눈금자, 오른쪽 글자·문단 패널에서 보고서나 회의록 서식을 다듬을 수 있습니다.',
      '자체 Rust 문서 엔진을 WebAssembly와 Tauri에 연결하는 구조이며, 현재 웹 버전에서는 계정 없이 새 문서를 만들거나 기기의 ASTW·DOCX·HWPX·PDF 파일을 열어 작업하고 저장할 수 있습니다.',
    ],
    externalUrl: 'https://asterism.quadraj.com/',
    externalLabel: '공식 사이트',
    secondaryLinks: [
      {
        label: '웹에서 열기',
        url: 'https://asterism.quadraj.com/app',
        kind: 'app',
      },
      {
        label: '설치 안내',
        url: 'https://asterism.quadraj.com/download/',
        kind: 'info',
      },
      {
        label: 'GitHub',
        url: 'https://github.com/PastelJ321/asterism-write',
        kind: 'repo',
      },
    ],
    artwork: {
      coverSrc: '/assets/projects/asterism-write/editor.webp',
      coverAlt: 'Asterism Write 문서 편집 화면',
      wordmarkSrc: '/assets/projects/asterism-write/wordmark.webp',
      wordmarkAlt: 'Asterism Write 공식 로고',
      wordmarkLightPlate: true,
      iconSrc: '/assets/projects/asterism-write/app-icon.webp',
      iconAlt: 'Asterism Write 앱 아이콘',
    },
    screenshots: [
      {
        id: 'editor',
        src: '/assets/projects/asterism-write/editor.webp',
        alt: 'Asterism Write 상단 리본, 눈금자, 기본 보고서 편집 화면',
        label: '편집기',
        caption: '리본 도구와 눈금자가 있는 보고서 편집 화면',
        badge: 'EDITOR',
        width: 1440,
        height: 960,
      },
      {
        id: 'properties',
        src: '/assets/projects/asterism-write/properties.webp',
        alt: '오른쪽 글자·문단 속성 패널이 열린 Asterism Write 1.0.0-rc.1 화면',
        label: '속성 패널',
        caption: '자간·장평·들여쓰기·문단 간격을 조정하는 오른쪽 패널',
        badge: 'PANEL',
        width: 1280,
        height: 900,
      },
      {
        id: 'pdf',
        src: '/assets/projects/asterism-write/pdf.webp',
        alt: '수식이 있는 PDF 위에 파란 펜으로 필기한 Asterism Write 화면',
        label: 'PDF 필기',
        caption: '펜·형광펜·텍스트 주석과 쪽 추출·병합을 지원하는 PDF 모드',
        badge: 'PDF',
        width: 1440,
        height: 2073,
      },
    ],
    highlights: [
      {
        index: '01',
        title: '문서 편집과 서식',
        body: '글꼴, 문단 간격, 용지 여백, 표 병합, 기본 수식을 편집할 수 있고 보고서·회의록 템플릿을 제공합니다.',
      },
      {
        index: '02',
        title: 'ASTW · DOCX · HWPX · PDF',
        body: '기본 저장은 ASTW를 사용하며 DOCX·HWPX·Markdown·HTML 열기와 내보내기, PDF 주석·병합·쪽 추출을 지원합니다.',
      },
      {
        index: '03',
        title: '로컬 기기 처리',
        body: '기본 문서 작업은 로그인 없이 브라우저 안에서 처리되며 결과는 내 기기 파일로 내려받습니다.',
      },
    ],
    formatIcons: [
      {
        code: 'ASTW',
        label: '기본 형식',
        src: '/assets/projects/asterism-write/formats/astw.webp',
        note: '기본 저장',
      },
      {
        code: 'DOCX',
        label: 'Word',
        src: '/assets/projects/asterism-write/formats/docx.webp',
        note: '열기·저장',
      },
      {
        code: 'HWPX',
        label: '한글 XML',
        src: '/assets/projects/asterism-write/formats/hwpx.webp',
        note: '열기·저장',
      },
      {
        code: 'PDF',
        label: 'PDF',
        src: '/assets/projects/asterism-write/formats/pdf.webp',
        note: '출력·필기',
      },
      {
        code: 'MD',
        label: 'Markdown',
        src: '/assets/projects/asterism-write/formats/md.webp',
        note: 'GFM 지원',
      },
      {
        code: 'HWP',
        label: 'HWP 5.x',
        src: '/assets/projects/asterism-write/formats/hwp.webp',
        note: '실험적 저장',
      },
    ],
    honestNotes: [
      '현재 1.0.0-rc.1 개발 단계입니다. 웹 버전은 쓸 수 있지만 Windows·macOS 정식 설치파일은 아직 나오지 않았습니다.',
      '복잡한 DOCX·HWPX 배치는 원본과 다를 수 있고, HWP 저장은 제한된 실험 기능입니다.',
      'PDF 모드에서는 주석과 쪽 편집만 가능하며 기존 PDF 본문을 워드 문서처럼 다시 고치는 기능은 없습니다.',
    ],
    tags: ['문서 편집기', 'PDF 필기', 'Rust/WASM', 'DOCX·HWPX'],
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

export function getProjectByZoneId(zoneId: 'arcade' | 'asterism'): ProjectEntry | undefined {
  return PROJECTS.find((p) => p.zoneId === zoneId);
}

export function getArchiveYears(): number[] {
  const years = Array.from(new Set(PROJECTS.map((p) => p.year)));
  return years.sort((a, b) => b - a);
}
