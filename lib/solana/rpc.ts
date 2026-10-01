import { type Connection, type Keypair, type PublicKey, Transaction, type TransactionInstruction, sendAndConfirmTransaction } from "@solana/web3.js";

export interface AccountData {
  owner: PublicKey;
  data: Buffer;
}

/** The two network operations the app needs. Tests swap in FakeProgramRpc. */
export interface SolanaRpc {
  getAccount(address: PublicKey): Promise<AccountData | null>;
  /** Up to 100 accounts in one request, in the order given. */
  getAccounts(addresses: PublicKey[]): Promise<(AccountData | null)[]>;
  send(ix: TransactionInstruction, signers: Keypair[]): Promise<string>;
}

export class ConnectionRpc implements SolanaRpc {
  constructor(private readonly connection: Connection) {}

  async getAccount(address: PublicKey): Promise<AccountData | null> {
    const info = await this.connection.getAccountInfo(address, "confirmed");
    return info ? { owner: info.owner, data: Buffer.from(info.data) } : null;
  }

  async getAccounts(addresses: PublicKey[]): Promise<(AccountData | null)[]> {
    const infos = await this.connection.getMultipleAccountsInfo(addresses, "confirmed");
    return infos.map((info) => (info ? { owner: info.owner, data: Buffer.from(info.data) } : null));
  }

  async send(ix: TransactionInstruction, signers: Keypair[]): Promise<string> {
    return sendAndConfirmTransaction(this.connection, new Transaction().add(ix), signers, { commitment: "confirmed" });
  }
}
