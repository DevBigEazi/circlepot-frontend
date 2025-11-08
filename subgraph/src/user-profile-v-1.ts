import {
  ProfileCreated as ProfileCreatedEvent,
  PhotoUpdated as PhotoUpdatedEvent,
  UserProfileV1,
} from "../generated/UserProfileProxy/UserProfileV1"
import {
  PhotoUpdated,
  ProfileCreated,
} from "../generated/schema";
import { createTransaction, getOrCreateUser } from "./utils";

export function handleProfileCreated(event: ProfileCreatedEvent): void {
   const contract = UserProfileV1.bind(event.address);
   const transaction = createTransaction(event);
   const userProfile = contract.getProfile(event.params.user);
   const profileCreated = new ProfileCreated(event.transaction.hash);

   const user = getOrCreateUser(event.params.user); 
   user.id = event.params.user;
   user.accountId = event.params.accountId;
   user.email = userProfile.email;
   user.username = userProfile.username;
   user.fullName =event.params.fullName;
   user.photo = userProfile.profilePhoto;
   user.lastPhotoUpdate = userProfile.lastPhotoUpdate;
   user.createdAt = userProfile.createdAt;
   user.hasProfile = contract.hasProfile(event.params.user);

   profileCreated.transaction = transaction.id;
   profileCreated.user = user.id

   user.save();
   profileCreated.save();

}

export function handlePhotoUpdated(event: PhotoUpdatedEvent): void {
   const transaction = createTransaction(event);
   const photoUpdated = new PhotoUpdated(event.transaction.hash);
   const user = getOrCreateUser(event.params.user);

   user.photo = event.params.photo.toString();

   photoUpdated.transaction = transaction.id;
   photoUpdated.user = user.id;

   user.save();
   photoUpdated.save();
}

