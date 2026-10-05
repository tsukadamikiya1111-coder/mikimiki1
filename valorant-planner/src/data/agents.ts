export type Role = 'duelist' | 'sentinel' | 'initiator' | 'controller'

export interface Agent {
  id: string
  name: string // 日本語表記
  code: string // アイコンに表示する短縮名
  role: Role
}

export const ROLES: { id: Role; name: string; color: string }[] = [
  { id: 'duelist', name: 'デュエリスト', color: '#ff6b57' },
  { id: 'sentinel', name: 'センチネル', color: '#4fd1a5' },
  { id: 'initiator', name: 'イニシエーター', color: '#f2c94c' },
  { id: 'controller', name: 'コントローラー', color: '#6fa8ff' },
]

export const roleColor = (role: Role) => ROLES.find((r) => r.id === role)!.color

const a = (id: string, name: string, code: string, role: Role): Agent => ({ id, name, code, role })

export const AGENTS: Agent[] = [
  // デュエリスト
  a('jett', 'ジェット', 'JET', 'duelist'),
  a('raze', 'レイズ', 'RAZ', 'duelist'),
  a('phoenix', 'フェニックス', 'PHX', 'duelist'),
  a('reyna', 'レイナ', 'REY', 'duelist'),
  a('yoru', 'ヨル', 'YOR', 'duelist'),
  a('neon', 'ネオン', 'NEO', 'duelist'),
  a('iso', 'アイソ', 'ISO', 'duelist'),
  a('waylay', 'ウェイレイ', 'WAY', 'duelist'),
  // センチネル
  a('sage', 'セージ', 'SAG', 'sentinel'),
  a('cypher', 'サイファー', 'CYP', 'sentinel'),
  a('killjoy', 'キルジョイ', 'KJ', 'sentinel'),
  a('chamber', 'チェンバー', 'CHM', 'sentinel'),
  a('deadlock', 'デッドロック', 'DLK', 'sentinel'),
  a('vyse', 'ヴァイス', 'VYS', 'sentinel'),
  a('veto', 'ヴェト', 'VET', 'sentinel'),
  // イニシエーター
  a('breach', 'ブリーチ', 'BRE', 'initiator'),
  a('sova', 'ソーヴァ', 'SOV', 'initiator'),
  a('skye', 'スカイ', 'SKY', 'initiator'),
  a('kayo', 'KAY/O', 'K/O', 'initiator'),
  a('fade', 'フェイド', 'FAD', 'initiator'),
  a('gekko', 'ゲッコー', 'GEK', 'initiator'),
  a('tejo', 'テホ', 'TEJ', 'initiator'),
  // コントローラー
  a('omen', 'オーメン', 'OMN', 'controller'),
  a('brimstone', 'ブリムストーン', 'BRM', 'controller'),
  a('viper', 'ヴァイパー', 'VPR', 'controller'),
  a('astra', 'アストラ', 'AST', 'controller'),
  a('harbor', 'ハーバー', 'HAR', 'controller'),
  a('clove', 'クローヴ', 'CLV', 'controller'),
  a('miks', 'ミクス', 'MKS', 'controller'),
]

export const agentById = (id: string) => AGENTS.find((x) => x.id === id)
