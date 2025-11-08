import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  CircleCompleted,
  ContractAuthorized,
  ContractRevoked,
  Initialized,
  LatePaymentRecorded,
  OwnershipTransferred,
  ReputationDecreased,
  ReputationIncreased,
  ScoreCategoryChanged,
  Upgraded
} from "../generated/ReputationV1/ReputationV1"

export function createCircleCompletedEvent(
  user: Address,
  totalCompleted: BigInt
): CircleCompleted {
  let circleCompletedEvent = changetype<CircleCompleted>(newMockEvent())

  circleCompletedEvent.parameters = new Array()

  circleCompletedEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  circleCompletedEvent.parameters.push(
    new ethereum.EventParam(
      "totalCompleted",
      ethereum.Value.fromUnsignedBigInt(totalCompleted)
    )
  )

  return circleCompletedEvent
}

export function createContractAuthorizedEvent(
  contractAddress: Address
): ContractAuthorized {
  let contractAuthorizedEvent = changetype<ContractAuthorized>(newMockEvent())

  contractAuthorizedEvent.parameters = new Array()

  contractAuthorizedEvent.parameters.push(
    new ethereum.EventParam(
      "contractAddress",
      ethereum.Value.fromAddress(contractAddress)
    )
  )

  return contractAuthorizedEvent
}

export function createContractRevokedEvent(
  contractAddress: Address
): ContractRevoked {
  let contractRevokedEvent = changetype<ContractRevoked>(newMockEvent())

  contractRevokedEvent.parameters = new Array()

  contractRevokedEvent.parameters.push(
    new ethereum.EventParam(
      "contractAddress",
      ethereum.Value.fromAddress(contractAddress)
    )
  )

  return contractRevokedEvent
}

export function createInitializedEvent(version: BigInt): Initialized {
  let initializedEvent = changetype<Initialized>(newMockEvent())

  initializedEvent.parameters = new Array()

  initializedEvent.parameters.push(
    new ethereum.EventParam(
      "version",
      ethereum.Value.fromUnsignedBigInt(version)
    )
  )

  return initializedEvent
}

export function createLatePaymentRecordedEvent(
  user: Address,
  totalLatePayments: BigInt
): LatePaymentRecorded {
  let latePaymentRecordedEvent = changetype<LatePaymentRecorded>(newMockEvent())

  latePaymentRecordedEvent.parameters = new Array()

  latePaymentRecordedEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  latePaymentRecordedEvent.parameters.push(
    new ethereum.EventParam(
      "totalLatePayments",
      ethereum.Value.fromUnsignedBigInt(totalLatePayments)
    )
  )

  return latePaymentRecordedEvent
}

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferred {
  let ownershipTransferredEvent =
    changetype<OwnershipTransferred>(newMockEvent())

  ownershipTransferredEvent.parameters = new Array()

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferredEvent
}

export function createReputationDecreasedEvent(
  user: Address,
  points: BigInt,
  reason: string,
  newScore: BigInt
): ReputationDecreased {
  let reputationDecreasedEvent = changetype<ReputationDecreased>(newMockEvent())

  reputationDecreasedEvent.parameters = new Array()

  reputationDecreasedEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  reputationDecreasedEvent.parameters.push(
    new ethereum.EventParam("points", ethereum.Value.fromUnsignedBigInt(points))
  )
  reputationDecreasedEvent.parameters.push(
    new ethereum.EventParam("reason", ethereum.Value.fromString(reason))
  )
  reputationDecreasedEvent.parameters.push(
    new ethereum.EventParam(
      "newScore",
      ethereum.Value.fromUnsignedBigInt(newScore)
    )
  )

  return reputationDecreasedEvent
}

export function createReputationIncreasedEvent(
  user: Address,
  points: BigInt,
  reason: string,
  newScore: BigInt
): ReputationIncreased {
  let reputationIncreasedEvent = changetype<ReputationIncreased>(newMockEvent())

  reputationIncreasedEvent.parameters = new Array()

  reputationIncreasedEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  reputationIncreasedEvent.parameters.push(
    new ethereum.EventParam("points", ethereum.Value.fromUnsignedBigInt(points))
  )
  reputationIncreasedEvent.parameters.push(
    new ethereum.EventParam("reason", ethereum.Value.fromString(reason))
  )
  reputationIncreasedEvent.parameters.push(
    new ethereum.EventParam(
      "newScore",
      ethereum.Value.fromUnsignedBigInt(newScore)
    )
  )

  return reputationIncreasedEvent
}

export function createScoreCategoryChangedEvent(
  user: Address,
  oldCategory: i32,
  newCategory: i32
): ScoreCategoryChanged {
  let scoreCategoryChangedEvent =
    changetype<ScoreCategoryChanged>(newMockEvent())

  scoreCategoryChangedEvent.parameters = new Array()

  scoreCategoryChangedEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  scoreCategoryChangedEvent.parameters.push(
    new ethereum.EventParam(
      "oldCategory",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(oldCategory))
    )
  )
  scoreCategoryChangedEvent.parameters.push(
    new ethereum.EventParam(
      "newCategory",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(newCategory))
    )
  )

  return scoreCategoryChangedEvent
}

export function createUpgradedEvent(implementation: Address): Upgraded {
  let upgradedEvent = changetype<Upgraded>(newMockEvent())

  upgradedEvent.parameters = new Array()

  upgradedEvent.parameters.push(
    new ethereum.EventParam(
      "implementation",
      ethereum.Value.fromAddress(implementation)
    )
  )

  return upgradedEvent
}
