import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
  name: "Can create user profile and get user data",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;
    const goals = "Build muscle and improve endurance";
    
    let block = chain.mineBlock([
      Tx.contractCall('fit-forge', 'create-profile', [
        types.utf8(goals)
      ], wallet1.address)
    ]);
    
    block.receipts[0].result.expectOk();
    
    let getUserBlock = chain.mineBlock([
      Tx.contractCall('fit-forge', 'get-user-data', [
        types.principal(wallet1.address)
      ], wallet1.address)
    ]);
    
    getUserBlock.receipts[0].result.expectOk();
    const userData = getUserBlock.receipts[0].result.expectOk().expectTuple();
    assertEquals(userData.goals, goals);
    assertEquals(userData['total-workouts'], '0');
    assertEquals(userData.level, '1');
  },
});

Clarinet.test({
  name: "Can log workout and earn achievements",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;
    const workoutType = "Weight Training";
    const duration = 60;
    const notes = "Great session!";
    
    // Create profile first
    let block = chain.mineBlock([
      Tx.contractCall('fit-forge', 'create-profile', [
        types.utf8("Get stronger")
      ], wallet1.address)
    ]);
    
    block.receipts[0].result.expectOk();
    
    // Log workout
    let workoutBlock = chain.mineBlock([
      Tx.contractCall('fit-forge', 'log-workout', [
        types.utf8(workoutType),
        types.uint(duration),
        types.utf8(notes)
      ], wallet1.address)
    ]);
    
    workoutBlock.receipts[0].result.expectOk();
    
    // Check workout data
    let getWorkoutBlock = chain.mineBlock([
      Tx.contractCall('fit-forge', 'get-workout', [
        types.uint(1)
      ], wallet1.address)
    ]);
    
    const workoutData = getWorkoutBlock.receipts[0].result.expectOk().expectTuple();
    assertEquals(workoutData['workout-type'], workoutType);
    assertEquals(workoutData.duration, duration.toString());
    assertEquals(workoutData.notes, notes);
  },
});

Clarinet.test({
  name: "Can update goals",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;
    const initialGoals = "Initial goals";
    const updatedGoals = "Updated goals";
    
    // Create profile
    let block = chain.mineBlock([
      Tx.contractCall('fit-forge', 'create-profile', [
        types.utf8(initialGoals)
      ], wallet1.address)
    ]);
    
    block.receipts[0].result.expectOk();
    
    // Update goals
    let updateBlock = chain.mineBlock([
      Tx.contractCall('fit-forge', 'update-goals', [
        types.utf8(updatedGoals)
      ], wallet1.address)
    ]);
    
    updateBlock.receipts[0].result.expectOk();
    
    // Verify updated goals
    let getDataBlock = chain.mineBlock([
      Tx.contractCall('fit-forge', 'get-user-data', [
        types.principal(wallet1.address)
      ], wallet1.address)
    ]);
    
    const userData = getDataBlock.receipts[0].result.expectOk().expectTuple();
    assertEquals(userData.goals, updatedGoals);
  },
});