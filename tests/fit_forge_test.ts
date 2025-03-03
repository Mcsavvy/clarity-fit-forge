import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

// [Previous tests remain unchanged]

Clarinet.test({
  name: "Handles multiple workouts in same day correctly",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;
    
    // Create profile
    chain.mineBlock([
      Tx.contractCall('fit-forge', 'create-profile', [
        types.utf8("Get stronger")
      ], wallet1.address)
    ]);
    
    // Log two workouts in same day (same block height)
    let workout1 = chain.mineBlock([
      Tx.contractCall('fit-forge', 'log-workout', [
        types.utf8("Morning Workout"),
        types.uint(30),
        types.utf8("First workout")
      ], wallet1.address)
    ]);
    
    let workout2 = chain.mineBlock([
      Tx.contractCall('fit-forge', 'log-workout', [
        types.utf8("Evening Workout"),
        types.uint(30),
        types.utf8("Second workout")
      ], wallet1.address)
    ]);
    
    // Check streak is still 1
    let getUserBlock = chain.mineBlock([
      Tx.contractCall('fit-forge', 'get-user-data', [
        types.principal(wallet1.address)
      ], wallet1.address)
    ]);
    
    const userData = getUserBlock.receipts[0].result.expectOk().expectTuple();
    assertEquals(userData['current-streak'], '1');
  },
});

Clarinet.test({
  name: "Validates workout input correctly",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;
    
    // Create profile
    chain.mineBlock([
      Tx.contractCall('fit-forge', 'create-profile', [
        types.utf8("Get stronger")
      ], wallet1.address)
    ]);
    
    // Try invalid duration
    let invalidDuration = chain.mineBlock([
      Tx.contractCall('fit-forge', 'log-workout', [
        types.utf8("Workout"),
        types.uint(361), // More than max duration
        types.utf8("Notes")
      ], wallet1.address)
    ]);
    
    invalidDuration.receipts[0].result.expectErr(400);
    
    // Try empty workout type
    let invalidType = chain.mineBlock([
      Tx.contractCall('fit-forge', 'log-workout', [
        types.utf8(""),
        types.uint(30),
        types.utf8("Notes")
      ], wallet1.address)
    ]);
    
    invalidType.receipts[0].result.expectErr(400);
  },
});
