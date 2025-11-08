import {
  CircleCompleted as CircleCompletedEvent,
  ContractAuthorized as ContractAuthorizedEvent,
  ContractRevoked as ContractRevokedEvent,
  Initialized as InitializedEvent,
  LatePaymentRecorded as LatePaymentRecordedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  ReputationDecreased as ReputationDecreasedEvent,
  ReputationIncreased as ReputationIncreasedEvent,
  ScoreCategoryChanged as ScoreCategoryChangedEvent,
  Upgraded as UpgradedEvent,
} from "../generated/ReputationV1/ReputationV1"
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
  Upgraded,
} from "../generated/schema"

export function handleCircleCompleted(event: CircleCompletedEvent): void {
  let entity = new CircleCompleted(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.user = event.params.user
  entity.totalCompleted = event.params.totalCompleted

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleContractAuthorized(event: ContractAuthorizedEvent): void {
  let entity = new ContractAuthorized(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.contractAddress = event.params.contractAddress

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleContractRevoked(event: ContractRevokedEvent): void {
  let entity = new ContractRevoked(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.contractAddress = event.params.contractAddress

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleInitialized(event: InitializedEvent): void {
  let entity = new Initialized(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.version = event.params.version

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleLatePaymentRecorded(
  event: LatePaymentRecordedEvent,
): void {
  let entity = new LatePaymentRecorded(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.user = event.params.user
  entity.totalLatePayments = event.params.totalLatePayments

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent,
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleReputationDecreased(
  event: ReputationDecreasedEvent,
): void {
  let entity = new ReputationDecreased(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.user = event.params.user
  entity.points = event.params.points
  entity.reason = event.params.reason
  entity.newScore = event.params.newScore

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleReputationIncreased(
  event: ReputationIncreasedEvent,
): void {
  let entity = new ReputationIncreased(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.user = event.params.user
  entity.points = event.params.points
  entity.reason = event.params.reason
  entity.newScore = event.params.newScore

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleScoreCategoryChanged(
  event: ScoreCategoryChangedEvent,
): void {
  let entity = new ScoreCategoryChanged(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.user = event.params.user
  entity.oldCategory = event.params.oldCategory
  entity.newCategory = event.params.newCategory

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleUpgraded(event: UpgradedEvent): void {
  let entity = new Upgraded(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.implementation = event.params.implementation

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
