import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { ContractUpgraded } from "../generated/schema"
import { ContractUpgraded as ContractUpgradedEvent } from "../generated/UserProfileV1/UserProfileV1"
import { handleContractUpgraded } from "../src/user-profile-v-1"
import { createContractUpgradedEvent } from "./user-profile-v-1-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let newImplementation = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let version = BigInt.fromI32(234)
    let newContractUpgradedEvent = createContractUpgradedEvent(
      newImplementation,
      version
    )
    handleContractUpgraded(newContractUpgradedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#write-a-unit-test

  test("ContractUpgraded created and stored", () => {
    assert.entityCount("ContractUpgraded", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "ContractUpgraded",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "newImplementation",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "ContractUpgraded",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "version",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#asserts
  })
})
