export const CLUB_INFO = {
  name: 'SONA',
  koreanName: '소나',
  affiliation: '양일고등학교 코딩동아리',
  domain: 'https://sona.quadraj.com',
  shortLine: '양일고 코딩동아리 소나. 부원들이 만든 게임과 프로그램을 모았습니다.',
  aboutParagraphs: [
    '양일고등학교 코딩동아리 소나(SONA)입니다. 부원들이 관심 있는 게임, 웹 서비스, 데스크톱 프로그램을 만들어 공유합니다.',
    '이 사이트에는 부원 개인이 완성한 작품과 외부 프로젝트와 연계해 만든 소프트웨어를 구분해 올려 두었습니다. 새 작업물이 나오면 연도별로 이어서 기록합니다.',
  ],
  facts: [
    { label: '동아리', value: '양일고등학교 코딩동아리 SONA' },
    { label: '현재 등록 작품', value: '2개 (서준이네 오락실, Asterism Write)' },
    { label: '주소', value: 'sona.quadraj.com' },
  ],
  integrityNotice:
    '소나 부원들의 작업물을 모아 두는 동아리 사이트이며, 양일고등학교 공식 행정 홈페이지가 아닙니다.',
  hostPartner: {
    name: 'QuadraJ',
    url: 'https://quadraj.com/',
    note: '호스팅 지원',
    logoSrc: '/assets/partners/quadraj-flat-logo.svg',
  },
} as const;
