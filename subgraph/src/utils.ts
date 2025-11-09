import { BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { Transaction, User } from "../generated/schema";

export function createTransaction(event: ethereum.Event): Transaction {
  const transaction = new Transaction(event.transaction.hash);
  transaction.blockNumber = event.block.number;
  transaction.blockTimestamp = event.block.timestamp;
  transaction.transactionHash = event.transaction.hash;

  transaction.save();
  return transaction;
}

export function getOrCreateUser(address: Bytes): User {
  let user = User.load(address);

  if (user == null) {
    user = new User(address);
    user.id = address;
    user.email = "";
    user.username = "";
    user.fullName = "";
    user.accountId = BigInt.fromI32(0);
    user.photo = "";
    user.lastPhotoUpdate = BigInt.fromI32(0);
    user.createdAt = BigInt.fromI32(0);
    user.hasProfile = false;
    user.repCategory = 0;
    user.totalReputation = BigInt.fromI32(0);
    user.totalLatePayments = BigInt.fromI32(0);
    user.totalGoalsCompleted = BigInt.fromI32(0);
    user.totalCirclesCompleted = BigInt.fromI32(0);

    user.save();
  }

  return user as User;
}