export interface Poem {
  title: string
  likes: string
  date: string
  image: string
  content?: string // 시 본문 (관리자 등록 시 입력)
  note?: string // 시인의 노트 (관리자 등록 시 입력)
}

// Firestore 문서(문서 id 포함)
export interface PoemDoc extends Poem {
  id: string
}

// Unsplash photo id -> 이미지 URL
const img = (id: string) =>
  `https://images.unsplash.com/${id}?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=800&h=1000`

// Web - Poems (5열 × 4행 = 20편)
export const webPoems: Poem[] = [
  { title: '봄밤의 산책', likes: '342', date: '2026.06.14', image: img('photo-1680796564091-0952395b0c28') },
  { title: '겨울 창가', likes: '318', date: '2026.01.09', image: img('photo-1772366088815-78352eb7f5ba') },
  { title: '바다의 문장', likes: '301', date: '2026.05.02', image: img('photo-1610393144490-a930182ad2f1') },
  { title: '오후 세 시', likes: '287', date: '2026.04.18', image: img('photo-1718139972568-34f5e60687fd') },
  { title: '낡은 우산', likes: '264', date: '2026.03.30', image: img('photo-1643717583148-950284638774') },
  { title: '첫눈 오는 날', likes: '251', date: '2025.12.21', image: img('photo-1575640781759-4c790e8585e2') },
  { title: '골목의 온도', likes: '238', date: '2026.02.11', image: img('photo-1764751587071-7d627440a6df') },
  { title: '여름의 끝', likes: '229', date: '2025.08.27', image: img('photo-1688320243376-69b68a8f656f') },
  { title: '달의 뒷면', likes: '214', date: '2026.06.01', image: img('photo-1592029383200-73fb26a5b925') },
  { title: '빈 의자', likes: '203', date: '2026.04.05', image: img('photo-1780863168999-4171f8a9541e') },
  { title: '새벽 두 시', likes: '191', date: '2026.03.12', image: img('photo-1699185168534-615fe9d97e80') },
  { title: '오래된 편지', likes: '178', date: '2025.11.19', image: img('photo-1741370023779-3ceef44c31d1') },
  { title: '나무의 기억', likes: '166', date: '2026.05.20', image: img('photo-1779653448871-0d1c0d1ec19b') },
  { title: '비 오는 정류장', likes: '154', date: '2026.02.28', image: img('photo-1715772973032-e12d084da243') },
  { title: '가을 우체국', likes: '147', date: '2025.10.15', image: img('photo-1613321651874-8e36db47f095') },
  { title: '조용한 식탁', likes: '132', date: '2026.01.24', image: img('photo-1722226947444-ffcffa432f87') },
  { title: '바람의 말', likes: '118', date: '2026.04.29', image: img('photo-1608562642081-22640ec0fc2d') },
  { title: '서랍 속 계절', likes: '104', date: '2025.09.08', image: img('photo-1629063908171-0e573f3cad89') },
  { title: '이름 없는 별', likes: '96', date: '2026.06.07', image: img('photo-1460563594877-adf295bdf0ab') },
  { title: '마지막 페이지', likes: '81', date: '2026.05.13', image: img('photo-1529590003495-b2646e2718bf') },
]

// 상세 페이지 공용 콘텐츠 (디자인 원본 기준, 시별 개별 본문은 없어 공통 사용)
export const poemContent = {
  eyebrow: '시집 「계절의 결」',
  caption: '봄밤, 골목 어귀에서',
  stanzas: [
    ['밤은 천천히 골목을 적시고', '가로등 아래 벚꽃이 진다', '발끝에 닿는 계절의 온기', '나는 오래 그 자리에 머문다'],
    ['바람이 한 줄 문장을 건네면', '나는 받아 적을 뿐이다', '말이 되지 못한 마음들이', '오늘도 꽃잎처럼 떨어진다'],
  ],
  signature: '— 권일원',
  poet: '권일원',
  poetInitial: '권',
  note: '이 시는 지난 봄, 늦은 밤 산책길에서 시작됐습니다. 벚꽃이 지는 골목을 걷다 문득 계절이 몸에 스미는 감각을 붙잡고 싶었어요. 말이 되지 못하고 흩어지는 마음들을 그대로 적어 두고 싶었습니다. 완성했다기보다, 그 밤의 온도를 겨우 옮겨 적은 기록에 가깝습니다.',
}

export interface PoemContext {
  poem: PoemDoc
  prev: PoemDoc
  next: PoemDoc
}

// 주어진 시 목록에서 제목으로 찾고 이전/다음 시(순환)를 함께 반환
export function getPoemContext(poems: PoemDoc[], title: string): PoemContext | null {
  if (poems.length === 0) return null
  const i = poems.findIndex((p) => p.title === title)
  if (i === -1) return null
  return {
    poem: poems[i],
    prev: poems[(i - 1 + poems.length) % poems.length],
    next: poems[(i + 1) % poems.length],
  }
}

// 리치 에디터로 저장한 본문인지(HTML) 판별.
// TipTap 저장물은 항상 블록 태그(<p> 등)로 시작하고, 기존 순수 텍스트 시는
// 한글 등 일반 문자로 시작하므로 첫 글자로 구분한다.
export function isRichHtml(content?: string): boolean {
  return !!content && content.trim().startsWith('<')
}

// 본문 문자열을 연(빈 줄) / 행(줄바꿈)으로 분해
export function parseStanzas(content?: string): string[][] | null {
  if (!content || !content.trim()) return null
  return content
    .trim()
    .split(/\n\s*\n/)
    .map((stanza) => stanza.split(/\n/).map((l) => l.trim()).filter(Boolean))
    .filter((s) => s.length > 0)
}

// Mobile - Poems (2열 × 5행 = 10편)
export const mobilePoems: Poem[] = [
  { title: '첫눈 오는 저녁', likes: '342', date: '2026.06.28', image: img('photo-1478962505401-384e868c82dc') },
  { title: '바다의 안개', likes: '287', date: '2026.06.21', image: img('photo-1693751724966-72ffecbdc928') },
  { title: '달빛 아래 걷다', likes: '256', date: '2026.06.14', image: img('photo-1609863551340-ca87e7656bfb') },
  { title: '겨울나무의 기도', likes: '231', date: '2026.06.07', image: img('photo-1709083634539-597765515ced') },
  { title: '가을이 지나간 자리', likes: '198', date: '2026.05.30', image: img('photo-1429198739803-7db875882052') },
  { title: '오래된 골목', likes: '174', date: '2026.05.22', image: img('photo-1693899121789-da923e57c419') },
  { title: '빗소리를 듣는 밤', likes: '152', date: '2026.05.15', image: img('photo-1422544834386-d121ef7c6ea8') },
  { title: '여름의 끝에서', likes: '139', date: '2026.05.08', image: img('photo-1689629067109-0e0e529b097c') },
  { title: '새벽의 강가', likes: '118', date: '2026.04.29', image: img('photo-1601838695448-84c3cc5c9328') },
  { title: '잊혀진 계절', likes: '97', date: '2026.04.21', image: img('photo-1733834826239-bf3f732bece2') },
]
