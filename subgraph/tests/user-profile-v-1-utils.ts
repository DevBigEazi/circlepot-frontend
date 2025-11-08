import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  ContractUpgraded,
  Initialized,
  OwnershipTransferred,
  PhotoUpdated,
  ProfileCreated,
  Upgraded
} from "../generated/UserProfileV1/UserProfileV1"

export function createContractUpgradedEvent(
  newImplementation: Address,
  version: BigInt
): ContractUpgraded {
  let contractUpgradedEvent = changetype<ContractUpgraded>(newMockEvent())

  contractUpgradedEvent.parameters = new Array()

  contractUpgradedEvent.parameters.push(
    new ethereum.EventParam(
      "newImplementation",
      ethereum.Value.fromAddress(newImplementation)
    )
  )
  contractUpgradedEvent.parameters.push(
    new ethereum.EventParam(
      "version",
      ethereum.Value.fromUnsignedBigInt(version)
    )
  )

  return contractUpgradedEvent
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

export function createPhotoUpdatedEvent(
  user: Address,
  photo: string
): PhotoUpdated {
  let photoUpdatedEvent = changetype<PhotoUpdated>(newMockEvent())

  photoUpdatedEvent.parameters = new Array()

  photoUpdatedEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  photoUpdatedEvent.parameters.push(
    new ethereum.EventParam("photo", ethereum.Value.fromString(photo))
  )

  return photoUpdatedEvent
}

export function createProfileCreatedEvent(
  user: Address,
  email: string,
  username: string,
  fullName: string,
  accountId: BigInt
): ProfileCreated {
  let profileCreatedEvent = changetype<ProfileCreated>(newMockEvent())

  profileCreatedEvent.parameters = new Array()

  profileCreatedEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  profileCreatedEvent.parameters.push(
    new ethereum.EventParam("email", ethereum.Value.fromString(email))
  )
  profileCreatedEvent.parameters.push(
    new ethereum.EventParam("username", ethereum.Value.fromString(username))
  )
  profileCreatedEvent.parameters.push(
    new ethereum.EventParam("fullName", ethereum.Value.fromString(fullName))
  )
  profileCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "accountId",
      ethereum.Value.fromUnsignedBigInt(accountId)
    )
  )

  return profileCreatedEvent
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
