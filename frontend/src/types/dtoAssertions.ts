import type { Agent, Contract, Quote } from './index';

type HasKey<T, K extends PropertyKey> = K extends keyof T ? true : false;
type Assert<T extends true> = T;

type _AgentHasOwnerAddress = Assert<HasKey<Agent, 'ownerAddress'>>;
type _QuoteHasEncryptedAmount = Assert<HasKey<Quote, 'encryptedAmount'>>;
type _QuoteHasSellerId = Assert<HasKey<Quote, 'sellerId'>>;
type _ContractHasEncryptedAmount = Assert<HasKey<Contract, 'encryptedAmount'>>;

export const DTO_TYPE_ASSERTIONS: [_AgentHasOwnerAddress, _QuoteHasEncryptedAmount, _QuoteHasSellerId, _ContractHasEncryptedAmount] = [
  true,
  true,
  true,
  true,
];
