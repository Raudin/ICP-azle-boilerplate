// Importing necessary modules from the 'azle' library
import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt, Principal } from 'azle';
import { v4 as uuidv4 } from 'uuid';

// Defining record types for different entities
type TimeCapsule = Record<{
  id: string;
  creator: Principal;
  contents: Vec<string>; // Messages, images, programs, etc.
  open_date: bigint;
  is_opened: boolean;
  created_date: bigint;
}>;

type CapsulePayload = Record<{
  contents: Vec<string>;
  open_date: bigint;
}>;

// Creating instances of StableBTreeMap for each entity type
const capsuleStorage = new StableBTreeMap<string, TimeCapsule>(0, 44, 512);

// Function to create a new Time Capsule
$update
export function createTimeCapsule(payload: CapsulePayload): Result<string, string> {
  if (payload.contents.length === 0) {
    return Result.Err("Contents cannot be empty");
  }

  if (payload.open_date <= ic.time()) {
    return Result.Err("Open date must be in the future");
  }

  const capsuleId = generateUniqueId();
  const capsule: TimeCapsule = {
    id: capsuleId,
    creator: ic.caller(),
    contents: payload.contents,
    open_date: payload.open_date,
    is_opened: false,
    created_date: ic.time(),
  };
  capsuleStorage.insert(capsuleId, capsule);
  return Result.Ok(capsuleId);
}

// Function to open a Time Capsule
$update
export function openTimeCapsule(capsuleId: string): Result<string, string> {
  if (!isValidUUID(capsuleId)) {
    return Result.Err("Invalid capsule ID format");
  }

  const capsule = capsuleStorage.get(capsuleId);
  if (!capsule) {
    return Result.Err(`Time Capsule with ID ${capsuleId} not found`);
  }

  if (capsule.is_opened) {
    return Result.Err("Time Capsule has already been opened");
  }

  if (ic.time() < capsule.open_date) {
    return Result.Err("Time Capsule cannot be opened before the specified date");
  }

  if (capsule.creator !== ic.caller()) {
    return Result.Err("Only the creator can open the Time Capsule");
  }
  capsule.is_opened = true;
  capsuleStorage.insert(capsuleId, capsule);
  
  // Perform actions with the contents (e.g., display messages, execute programs)
  // For simplicity, let's just return the contents as a string
  return `Time Capsule opened! Contents: ${capsule.contents.join(', ')}`;
}

// Function to get all Time Capsules
$query
export function getAllTimeCapsules(): Vec<TimeCapsule> {
  return capsuleStorage.values();
}

// Function to generate a unique ID
function generateUniqueId(): string {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
}
