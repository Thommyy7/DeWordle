import { validateEnv } from './env.validation';

const VALID_BASE: Record<string, unknown> = {
  DB_HOST: 'localhost',
  DB_USERNAME: 'postgres',
  DB_PASSWORD: 'secret',
  DB_NAME: 'dewordle',
  JWT_SECRET: 'supersecret',
  SOROBAN_RPC_URL: 'https://soroban-testnet.stellar.org',
  SOROBAN_CORE_GAME_CONTRACT_ID: 'CAABC123',
};

describe('validateEnv', () => {
  it('passes with all required variables present', () => {
    expect(() => validateEnv(VALID_BASE)).not.toThrow();
  });

  it('applies defaults for optional variables', () => {
    const result = validateEnv(VALID_BASE);
    expect(result.PORT).toBe(3000);
    expect(result.SOROBAN_NETWORK).toBe('testnet');
    expect(result.INDEXER_MAX_PAYLOAD_BYTES).toBe(8192);
  });

  it('throws when DB_HOST is missing', () => {
    const { DB_HOST: _removed, ...rest } = VALID_BASE;
    expect(() => validateEnv(rest)).toThrow('Environment validation failed');
  });

  it('throws when JWT_SECRET is missing', () => {
    const { JWT_SECRET: _removed, ...rest } = VALID_BASE;
    expect(() => validateEnv(rest)).toThrow('Environment validation failed');
  });

  it('throws when SOROBAN_RPC_URL is missing', () => {
    const { SOROBAN_RPC_URL: _removed, ...rest } = VALID_BASE;
    expect(() => validateEnv(rest)).toThrow('Environment validation failed');
  });

  it('throws when SOROBAN_CORE_GAME_CONTRACT_ID is missing', () => {
    const { SOROBAN_CORE_GAME_CONTRACT_ID: _removed, ...rest } = VALID_BASE;
    expect(() => validateEnv(rest)).toThrow('Environment validation failed');
  });

  it('throws when SOROBAN_NETWORK is an invalid value', () => {
    expect(() =>
      validateEnv({ ...VALID_BASE, SOROBAN_NETWORK: 'devnet' }),
    ).toThrow('Environment validation failed');
  });

  it('collects all missing-field errors in one throw', () => {
    expect(() => validateEnv({})).toThrow('Environment validation failed');
  });
});
