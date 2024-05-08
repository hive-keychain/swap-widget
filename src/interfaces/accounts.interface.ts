import { LocalAccount } from "../interfaces/local-account.interface";

export interface Accounts {
  list: LocalAccount[];
  hash?: string;
}
