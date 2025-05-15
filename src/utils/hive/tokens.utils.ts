import { TokenRequestParams } from "@interfaces/token-request-params.interface";
import { Token, TokenBalance, TokenMarket } from "@interfaces/tokens.interface";
import { HiveEngineUtils } from "@utils/hive/hive-engine.utils";

const getHiveEngineTokenPrice = (
  { symbol }: Partial<TokenBalance>,
  market: TokenMarket[]
) => {
  const tokenMarket = market.find((t) => t.symbol === symbol);
  const price = tokenMarket
    ? parseFloat(tokenMarket.lastPrice)
    : symbol === "SWAP.HIVE"
    ? 1
    : 0;
  return price;
};

/* istanbul ignore next */
const getUserBalance = (account: string) => {
  return HiveEngineUtils.get<TokenBalance[]>({
    contract: "tokens",
    table: "balances",
    query: { account: account },
    indexes: [],
    limit: 1000,
    offset: 0,
  });
};

/* istanbul ignore next */
/**
 * SSCJS request using HiveEngineConfigUtils.getApi().find.
 * @param {string} contract Fixed as 'tokens'
 * @param {string} table Fixed as 'tokens
 */
const getAllTokens = async (): Promise<Token[]> => {
  let tokens = [];
  let offset = 0;
  do {
    const newTokens = await getTokens(offset);
    tokens.push(...newTokens);
    offset += 1000;
  } while (tokens.length % 1000 === 0);
  return tokens;
};

const getTokens = async (offset: number) => {
  return (
    await HiveEngineUtils.get<any[]>({
      contract: "tokens",
      table: "tokens",
      query: {},
      limit: 1000,
      offset: offset,
      indexes: [],
    })
  ).map((t: any) => {
    return {
      ...t,
      metadata: JSON.parse(t.metadata),
    };
  });
};

const getTokenInfo = async (symbol: string): Promise<Token> => {
  return (
    await HiveEngineUtils.get<any[]>({
      contract: "tokens",
      table: "tokens",
      query: { symbol: symbol },
      limit: 1000,
      offset: 0,
      indexes: [],
    })
  ).map((t: any) => {
    return {
      ...t,
      metadata: JSON.parse(t.metadata),
    };
  })[0];
};

/* istanbul ignore next */
/**
 * SSCJS request using HiveEngineConfigUtils.getApi().find.
 * @param {string} contract Fixed as 'market'
 * @param {string} table Fixed as 'metrics
 */
const getTokensMarket = async (
  query: {},
  limit: number,
  offset: number,
  indexes: {}[]
): Promise<TokenMarket[]> => {
  return HiveEngineUtils.get<TokenMarket[]>({
    contract: "market",
    table: "metrics",
    query: query,
    limit: limit,
    offset: offset,
    indexes: indexes,
  } as TokenRequestParams);
};

const getTokenPrecision = async (symbol: string) => {
  if (symbol === "HBD" || symbol === "HIVE") {
    return 3;
  }
  const token = await getTokenInfo(symbol);
  return token.precision;
};

const TokensUtils = {
  getUserBalance,
  getAllTokens,
  getTokensMarket,
  getHiveEngineTokenPrice,
  getTokenInfo,
  getTokenPrecision,
};

export default TokensUtils;
