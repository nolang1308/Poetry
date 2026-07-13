import poetWeb from '../assets/images/poet-web.png'
import poetMobile from '../assets/images/poet-mobile.png'

// 홈 화면에 들어가는 사진 + 문구 전체
export interface HomeContent {
  // 사진
  webImage: string
  mobileImage: string
  // 웹 히어로
  eyebrow: string
  headline1: string
  headline2: string
  intro: string
  ctaLabel: string
  secondaryLabel: string
  verseWeb: string
  // 모바일
  mobileTitle: string
  mobileEyebrow: string
  poetName: string
  mobileIntro: string
  verseMobile: string
}

// 기본값(현재 하드코딩되어 있던 내용). 사진 기본값은 번들 에셋 URL.
export const defaultHome: HomeContent = {
  webImage: poetWeb,
  mobileImage: poetMobile,
  eyebrow: '시인 권일원',
  headline1: '말이 되지 못한 마음을',
  headline2: '시로 적어 둡니다',
  intro:
    '안녕하세요, 계절의 결을 따라 시를 쓰는 권일원입니다. 하루의 끝에 남은 문장들을 이곳에 조용히 모아 둡니다. 천천히 머물다 가세요.',
  ctaLabel: '시 읽으러 가기',
  secondaryLabel: '시인 소개 →',
  verseWeb: '바람이 지나간 자리마다\n한 줄의 시가 남았다',
  mobileTitle: '권일원',
  mobileEyebrow: '시인 · POET',
  poetName: '권일원',
  mobileIntro:
    '오래 바라본 것들에 대하여 씁니다.\n계절과 마음, 그 사이에 머무는\n작은 언어들을 모읍니다.',
  verseMobile: '“바람이 지나간 자리마다\n네 이름이 피었다”',
}
