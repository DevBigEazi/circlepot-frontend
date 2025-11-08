import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { CircleCompleted } from "../generated/schema"
import { CircleCompleted as CircleCompletedEvent } from "../generated/ReputationV1/ReputationV1"
import { handleCircleCompleted } from "../src/reputation-v-1"
import { createCircleCompletedEvent } from "./reputation-v-1-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let user = Address.fromString("0x0000000000000000000000000000000000000001")
    let totalCompleted = BigInt.fromI32(234)
    let newCircleCompletedEvent = createCircleCompletedEvent(
      user,
      totalCompleted
    )
    handleCircleCompleted(newCircleCompletedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#write-a-unit-test

  test("CircleCompleted created and stored", () => {
    assert.entityCount("CircleCompleted", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "CircleCompleted",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "user",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "CircleCompleted",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "totalCompleted",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#asserts
  })
})
