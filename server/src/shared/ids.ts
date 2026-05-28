/**
 * 统一ID类型：数据库使用BigInt存储ID（自增主键），API层统一用string传输
 * 避免JavaScript Number精度丢失问题（BigInt超过2^53后Number无法精确表示）
 */
export type ID = string;

export interface EntityId {
  id: ID;
}
