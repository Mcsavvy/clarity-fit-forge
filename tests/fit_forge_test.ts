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
    assertEquals(userData['current-streak'], '0');
    assertEquals(userData['last-workout'], '0');
  },
});

Clarinet.test({
  name: "Can track workout streaks",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;
    
    // Create profile
    let block = chain.mineBlock([
      Tx.contractCall('fit-forge', 'create-profile', [
        types.utf8("Get stronger")
      ], wallet1.address)
    ]);
    
    // Log consecutive workouts
    for(let i = 0; i < 7; i++) {
      let workoutBlock = chain.mineBlock([
        Tx.contractCall('fit-forge', 'log-workout', [
          types.utf8("Daily Workout"),
          types.uint(30),
          types.utf8("Streak building")
        ], wallet1.address)
      ]);
      workoutBlock.receipts[0].result.expectOk();
    }
    
    // Verify streak
    let getUserBlock = chain.mineBlock([
      Tx.contractCall('fit-forge', 'get-user-data', [
        types.principal(wallet1.address)
      ], wallet1.address)
    ]);
    
    const userData = getUserBlock.receipts[0].result.expectOk().expectTuple();
    assertEquals(userData['current-streak'], '7');
    
    // Check for streak achievement
    let achievementBlock = chain.mineBlock([
      Tx.contractCall('fit-forge', 'get-achievements', [
        types.principal(wallet1.address)
      ], wallet1.address)
    ]);
    
    const achievements = achievementBlock.receipts[0].result.expectOk().expectTuple();
    assertEquals(achievements.milestones.indexOf("7 Day Streak Achievement!") !== -1, true);
  },
});
