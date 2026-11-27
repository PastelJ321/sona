export const CLUB_INFO = {
  name: 'SONA',
  koreanName: '소나',
  affiliation: '양일고등학교 코딩동아리',
  domain: 'https://sona.quadraj.com',
  tagline: '직접 만들고, 실험하고, 기록하는 학생들의 디지털 아틀리에.',
  heroSubtitle:
    '양일고등학교 코딩동아리 SONA의 학생들이 만든 게임, 소프트웨어, 실험적인 웹 프로젝트를 전시하고 실제 작품으로 연결합니다.',
  aboutSummary: [
    'SONA는 양일고등학교의 학생들이 스스로 흥미를 느끼는 게임과 소프트웨어, 웹 실험을 직접 코드로 구현하고 서로 공유하는 코딩동아리입니다.',
    '이 사이트는 동아리의 활동을 과장해 꾸미는 홍보 페이지가 아니라, 부원들이 실제로 완성해 공개한 디지털 작업물을 정직하게 전시하고 연도별로 축적하기 위해 만들어진 독립 프로젝트 아카이브입니다.',
  ],
  principles: [
    {
      index: '01',
      title: '실제 작동하는 창작물 중심',
      body: '아이디어 설명에 머무르지 않고, 브라우저나 기기에서 방문자가 직접 열어 보고 체험할 수 있는 실제 결과물을 전시합니다.',
    },
    {
      index: '02',
      title: '제작자와 기여의 명확한 구분',
      body: '학생 개인이 주도해 만든 작품과 부원·외부 프로젝트가 연계된 작업물, 동아리 공동 작업물을 투명하게 구분해 기록합니다.',
    },
    {
      index: '03',
      title: '시간이 쌓이는 아카이브 구조',
      body: '새로운 게임이나 도구가 완성될 때마다 디자인을 새로 뜯어고치지 않고 연도별 아카이브에 자연스럽게 확장할 수 있도록 설계했습니다.',
    },
  ],
  integrityNotice:
    '이 웹사이트는 양일고등학교 코딩동아리 SONA의 부원 프로젝트를 소개하는 독립 아카이브이며, 학교 전체를 대변하는 공식 행정 사이트가 아닙니다.',
  hostPartner: {
    name: 'QuadraJ',
    url: 'https://quadraj.com/',
    note: '호스팅 및 웹 구축 지원',
    logoSrc: '/assets/partners/quadraj-flat-logo.svg',
  },
} as const;
