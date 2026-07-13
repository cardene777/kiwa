import { describe, expect, it } from 'vitest';
import {
  ORM_BRANDS,
  SQL_DIALECTS,
  isOrmBrand,
  isSqlDialect,
} from '../src/types.js';

describe('orm/types runtime helpers', () => {
  it('ORM_BRANDS + isOrmBrand round trip', () => {
    expect([...ORM_BRANDS]).toEqual(['drizzle', 'prisma', 'kysely']);
    for (const brand of ORM_BRANDS) expect(isOrmBrand(brand)).toBe(true);
    expect(isOrmBrand('sequelize')).toBe(false);
    expect(isOrmBrand(null)).toBe(false);
    expect(isOrmBrand(42)).toBe(false);
    expect(isOrmBrand(undefined)).toBe(false);
  });

  it('SQL_DIALECTS + isSqlDialect round trip', () => {
    expect([...SQL_DIALECTS]).toEqual(['sqlite', 'postgres', 'mysql']);
    for (const d of SQL_DIALECTS) expect(isSqlDialect(d)).toBe(true);
    expect(isSqlDialect('mssql')).toBe(false);
    expect(isSqlDialect('')).toBe(false);
    expect(isSqlDialect({})).toBe(false);
  });
});
