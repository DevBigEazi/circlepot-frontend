import { gql } from "graphql-request";

export const GET_MINIMAL_REFERRAL_STATS = gql`
  query GetMinimalReferralStats($userId: String!) {
    user(id: $userId) {
      id
      referralCount
      totalReferralRewardsEarned
      pendingRewardsEarned
      referredBy {
        id
        username
      }
    }
  }
`;

export const GET_REFERRAL_SETTINGS = gql`
  query GetReferralSettings {
    referralSystem(id: "0x73797374656d") {
      rewardsEnabled
      supportedTokens {
        token
        bonusAmount
      }
    }
  }
`;
