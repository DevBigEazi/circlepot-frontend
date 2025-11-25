import {
  ProfileCreated as ProfileCreatedEvent,
  PhotoUpdated as PhotoUpdatedEvent,
} from "../generated/UserProfileProxy/UserProfileV1"
import {
  PhotoUpdated,
  ProfileCreated,
} from "../generated/schema";
import { createTransaction, getOrCreateUser } from "./utils";

export function handleProfileCreated(event: ProfileCreatedEvent): void {
   const transaction = createTransaction(event);
   const profileCreated = new ProfileCreated(event.transaction.hash);

   const user = getOrCreateUser(event.params.user); 
   user.id = event.params.user;
   user.accountId = event.params.accountId;
   user.email = event.params.email;
   user.username = event.params.username;
   user.fullName =event.params.fullName;
   user.photo = event.params.profilePhoto;
   user.createdAt = event.params.createdAt;
   user.hasProfile = event.params.hasProfile;

   profileCreated.transaction = transaction.id;
   profileCreated.user = user.id

   user.save();
   profileCreated.save();
}

export function handlePhotoUpdated(event: PhotoUpdatedEvent): void {
   const transaction = createTransaction(event);
   const photoUpdated = new PhotoUpdated(event.transaction.hash);
   const user = getOrCreateUser(event.params.user);

   user.photo = event.params.photo
   user.lastPhotoUpdate = transaction.blockTimestamp

   photoUpdated.transaction = transaction.id;
   photoUpdated.user = user.id;

   user.save();
   photoUpdated.save();
}

