export interface WeaponGroup {
  category: string
  weapons: string[]
}

export const WEAPON_GROUPS: WeaponGroup[] = [
  { category: 'サイドアーム', weapons: ['クラシック', 'ショーティー', 'フレンジー', 'ゴースト', 'シェリフ'] },
  { category: 'SMG', weapons: ['スティンガー', 'スペクター'] },
  { category: 'ショットガン', weapons: ['バッキー', 'ジャッジ'] },
  { category: 'ライフル', weapons: ['ブルドッグ', 'ガーディアン', 'ファントム', 'ヴァンダル'] },
  { category: 'スナイパーライフル', weapons: ['マーシャル', 'アウトロー', 'オペレーター'] },
  { category: 'マシンガン', weapons: ['アレス', 'オーディン'] },
]
