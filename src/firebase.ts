import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyBwlIuW2PqH_MZ7xm-5dNOhMIQhkjQ9fqA',
  authDomain: 'poetry-kwonilwon.firebaseapp.com',
  projectId: 'poetry-kwonilwon',
  storageBucket: 'poetry-kwonilwon.firebasestorage.app',
  messagingSenderId: '952090116571',
  appId: '1:952090116571:web:f2ddb60cde9005f19e27fe',
}

// 관리자 로그인 아이디로 쓰는 전화번호를 내부 이메일로 매핑
export const ADMIN_EMAIL = '01092375405@poetry-admin.web'
export function phoneToEmail(phone: string) {
  return `${phone.replace(/\D/g, '')}@poetry-admin.web`
}

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
